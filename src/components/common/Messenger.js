import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { agents, messages as allMessages } from '../../data/fakedata';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './Messenger.css';
import { useMessageContext } from '../../contexts/MessageContext';
function formatTime(date) {
  try {
    if (!date && date !== 0) return '';
    // Normalize many possible shapes: number, ISO string, Date, Mongo-style {$date: ...}
    if (typeof date === 'number') date = new Date(date);
    else if (typeof date === 'string') date = new Date(date);
    else if (date && typeof date === 'object') {
      // MongoDB extended JSON may use {$date: xxx}
      if (date.$date || date['$date']) {
        date = new Date(date.$date || date['$date']);
      } else if (typeof date.getTime === 'function') {
        // already a Date-like object
      } else {
        // attempt to coerce to string then Date
        date = new Date(String(date));
      }
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    // Defensive fallback
    try { if (date && date.toString) return String(date).slice(0,5); } catch (er) {}
    return '';
  }
}

// Message status: sent, delivered, read, pending
function getStatusIcon(status) {
  if (status === 'pending') return <span title="En attente" style={{color:'#aaa'}}>⏳</span>;
  if (status === 'sent') return <span title="Envoyé" style={{color:'var(--ndaku-primary)'}}>✓</span>;
  if (status === 'delivered') return <span title="Reçu" style={{color:'var(--ndaku-primary)'}}>✓✓</span>;
  if (status === 'read') return <span title="Lu" style={{color:'var(--ndaku-primary)',fontWeight:700}}>✓✓</span>;
  return null;
}

function formatDateTime(date) {
  try {
    if (!date && date !== 0) return '';
    if (typeof date === 'number') date = new Date(date);
    else if (typeof date === 'string') date = new Date(date);
    else if (date && typeof date === 'object') {
      if (date.$date || date['$date']) date = new Date(date.$date || date['$date']);
      else if (typeof date.getTime === 'function') {}
      else date = new Date(String(date));
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

const MessengerWidget = ({ open, onClose, userId = null, initialAgentId = null }) => {
  const [visible, setVisible] = useState(Boolean(open));
  // normalize incoming data: drop falsy entries to avoid null access later
  const safeAgents = (agents || []).filter(Boolean);
  const safeMessages = (allMessages || []).filter(Boolean);
  // pick a safe default selected agent id (first valid agent)
  const [selectedAgentId, setSelectedAgentId] = useState(safeAgents[0]?.id);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [input, setInput] = useState('');
  const [notif, setNotif] = useState(null);
  const [ MessegesVersion, setMessagesVersion ] = useState(0); // to force re-render on messages array change
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const fileInput = useRef();
  const bodyRef = useRef();
  const inputRef = useRef(null);
  const {user} =useAuth();
  const socketRef = useRef(null);
  const pendingQueue = useRef([]);
  const instanceId = useRef(`messenger_${Date.now()}_${Math.floor(Math.random()*10000)}`);
  const sidebarRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // resolve authenticated user id if available (prefer auth service or localStorage)
  const authUser = (authService && authService.getUser ? authService.getUser() : null) || (localStorage.getItem('ndaku_user') ? JSON.parse(localStorage.getItem('ndaku_user')) : null);
  const effectiveUserId = userId || (authUser && (authUser.id || authUser._id)) || null;
  // prepare sorted contacts with last message SENT TO the contact (where contact is the recipient) & unread
  const contacts = safeAgents.map(agent => {
    // Only consider messages where this agent is the recipient (toId === agent.id)
    const msgsToAgent = (safeMessages || []).filter(m => String(m.toId) === String(agent.id));
    const last = msgsToAgent.slice().sort((a,b) => {
      const ta = new Date(a.time || a.timestamp || a.date || Date.now()).getTime();
      const tb = new Date(b.time || b.timestamp || b.date || Date.now()).getTime();
      return tb - ta;
    })[0];
    // unread count remains messages from agent to current user
    const unread = (safeMessages || []).filter(m => String(m.fromId) === String(agent.id) && !m.read).length;
    return { agent, lastMsg: last, unread, lastTime: last ? (last.time || last.timestamp || last.date || 0) : 0 };
  });
  const contactsSorted = contacts.sort((a,b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    if (b.lastTime !== a.lastTime) return b.lastTime - a.lastTime;
    return (a.agent.name || '').localeCompare(b.agent.name || '');
  });
  // Messages for the selected conversation (between current user and selected agent)
  const agentMessages = (safeMessages || []).filter(m => {
    const from = String(m.fromId || m.from || '');
    const to = String(m.toId || m.to || '');
    const sel = String(selectedAgentId || '');
    const me = user ? String(user.id || user._id || '') : String(effectiveUserId || '');
    if (to===me) console.log("un message dont je suis destianateur",m.content);
    return (from === sel && to === me) || (from === me && to === sel);
  }).slice().sort((a, b) => {
    const ta = new Date(a.time || a.timestamp || a.date || a.time || Date.now()).getTime();
    const tb = new Date(b.time || b.timestamp || b.date || b.time || Date.now()).getTime();
    return ta - tb; // oldest -> newest
  });

  const currentAgent = safeAgents.find(a => String(a.id) === String(selectedAgentId)) || null;

  // helper to recompute unread count from safeMessages
  const recomputeUnread = () => {
    try {
      const count = (safeMessages || []).filter(m => String(m.toId) === String(effectiveUserId) && !m.read).length;
      setUnreadCount(count);
    } catch (e) { setUnreadCount(0); }
  };

  // helper: build conversation messages for selected agent with deduplication & sort
  const buildConversationMessages = (agentId) => {
    try {
      const sel = String(agentId || selectedAgentId || '');
      const me = String(user?.id || user?._id || effectiveUserId || '');
      const list = (safeMessages || []).filter(m => {
        const from = String(m.fromId || m.from || '');
        const to = String(m.toId || m.to || '');
        return (from === sel && to === me) || (from === me && to === sel);
      }).slice().sort((a,b) => {
        const ta = new Date(a.time || a.timestamp || a.date || Date.now()).getTime();
        const tb = new Date(b.time || b.timestamp || b.date || Date.now()).getTime();
        return ta - tb;
      });
      // deduplicate by id (preserve order)
      const seen = new Map();
      for (const m of list) {
        const id = String(m.id || m._id || `${m.time}_${Math.random()}`);
        if (!seen.has(id)) seen.set(id, { ...m, id });
      }
      return Array.from(seen.values());
    } catch (e) { return []; }
  };

  // rebuild conversation when selected agent or messages version changes
  useEffect(() => {
    try {
      setConversationMessages(buildConversationMessages(selectedAgentId));
    } catch (e) {}
  }, [selectedAgentId, MessegesVersion, effectiveUserId]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // initial unread compute on mount
  useEffect(() => { recomputeUnread(); }, []);

  // scroll to bottom whenever selected conversation changes or messages change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [selectedAgentId, conversationMessages]);

  // initialize socket connection for messaging (mount)
  useEffect(() => {
    // timer handle and last identified uid need to live in the effect scope
    // so the cleanup can clear the interval even if socket init fails.
    let identInterval = null;
    let lastIdentUid = null;
    const token = (() => {
      try {
        return localStorage.getItem('ndaku_auth_token') || localStorage.getItem('token') || (authService && authService.getToken ? authService.getToken() : null);
      } catch (e) { return null; }
    })();

    try {
      const base = (process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
      const url = process.env.REACT_APP_WS_URL || (base ? base : undefined);
      const opts = { path: '/socket.io', transports: ['websocket','polling'], autoConnect: true, auth: {} };
      if (token) opts.auth = { token };
      socketRef.current = io(url || undefined, opts);

      const s = socketRef.current;
      s.on('connect', () => {
        console.log('[Messenger] socket connected', s.id);
        try {
          // prefer authService stored user but fallback to localStorage if needed
          const user = (authService && authService.getUser ? authService.getUser() : null) || (localStorage.getItem('ndaku_user') ? JSON.parse(localStorage.getItem('ndaku_user')) : null);
          const uid = user && (user.id || user._id) ? String(user.id || user._id) : null;
          if (uid) {
            s.emit('identify', { userId: uid });
            console.log('[Messenger] emitted identify for userId=', uid);
            console.log('selected agent id',String(selectedAgentId))
            // request history as before (keeps compatibility)
            try {
              const payload = { userId: uid, withUserId: String(selectedAgentId || ''), limit: 200 };
              s.emit('getMessageHistory', payload, (err, history) => {
                if (!err && Array.isArray(history)) {
                  console.log('[Messenger] received history via callback, count=', history.length);
                  history.forEach(m => {
                    allMessages.push({
                      id: m.id || Date.now()+Math.floor(Math.random()*1000),
                      fromId: m.fromId || (m.from && m.from.id) || null,
                      from: m.fromName || (m.from && m.from.name) || '',
                      toId: m.toId || null,
                      to: m.toName || '',
                      text: m.text || m.content || '',
                      time: m.timestamp || (m.time || Date.now()),
                      read: !(m.unread),
                      channel: 'socket',
                      status: 'delivered'
                    });
                  });
                  setMessagesVersion(v => v + 1);
                }
              });
            } catch (err) { console.warn('[Messenger] request history emit failed', err); }
          }

          // flush pending queue (send messages queued while disconnected)
          if (pendingQueue.current && pendingQueue.current.length > 0) {
            console.log('[Messenger] flushing pending message queue, count=', pendingQueue.current.length);
            while (pendingQueue.current.length) {
              const item = pendingQueue.current.shift();
              try {
                s.emit('privateMessage', { recipientId: String(item.toId), content: item.text, tempId: item.id });
                // optimistic local update: mark sent
                const local = safeMessages.find(m => m.id === item.id);
                if (local) local.status = 'sent';
              } catch (err) { console.warn('[Messenger] flush emit failed', err); }
            }
          }
        } catch (e) {}
      });

  s.on('connect_error', (err) => console.warn('[Messenger] socket connect_error', err && err.message ? err.message : err));
  s.on('error', (err) => console.error('[Messenger] socket error', err));
  s.on('disconnect', (reason) => console.log('[Messenger] socket disconnected', reason));

  // Periodically re-emit identify when auth/user becomes available (helps when widget loads before auth)
  try {
    identInterval = setInterval(() => {
      try {
        const user = (authService && authService.getUser ? authService.getUser() : null) || (localStorage.getItem('ndaku_user') ? JSON.parse(localStorage.getItem('ndaku_user')) : null);
        const uid = user && (user.id || user._id) ? String(user.id || user._id) : null;
        if (uid && s && s.connected && uid !== lastIdentUid) {
          s.emit('identify', { userId: uid });
          lastIdentUid = uid;
          console.log('[Messenger] re-emitted identify for userId=', uid);
        }
      } catch (e) {}
    }, 2500);
  } catch (e) { /* ignore timer issues */ }

  s.on('receiveMessage', (payload) => {
        try {
          const fromId = (payload && payload.from && (payload.from.id || payload.from._id)) || null;
          const text = payload && (payload.text || payload.message || payload.content) || '';
          const timestamp = payload && (payload.date || payload.timestamp) ? new Date(payload.date || payload.timestamp).getTime() : Date.now();
          const newMsg = {
            id: Date.now() + Math.floor(Math.random()*1000),
            fromId: fromId || 'bot',
            from: payload.from && (payload.from.name || payload.from.email) || 'Bot',
            toId: effectiveUserId,
            to: 'Vous',
            text,
            time: timestamp,
            read: false,
            channel: 'socket',
            status: 'delivered'
          };
          allMessages.push(newMsg);
          // update unread counters if this is for current user
          try {
            const fromIdLocal = fromId || newMsg.fromId;
            if (String(newMsg.toId) === String(effectiveUserId)) {
              // if the user isn't currently viewing that conversation, count as unread
              if (String(selectedAgentId) !== String(fromIdLocal)) {
                newMsg.read = false;
                recomputeUnread();
              } else {
                // if viewing the conversation, mark read
                newMsg.read = true;
                recomputeUnread();
              }
            }
          } catch (e) {}
          // reconcile optimistic local message if server returned tempId
          try {
            const tempId = payload && (payload.tempId || payload.tempID || payload.clientTempId || payload.temp_id);
            if (tempId) {
              const local = safeMessages.find(m => String(m.id) === String(tempId));
              if (local) local.status = 'delivered';
            }
          } catch (e) {}
          try { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; } catch (e) {}
        } catch (e) { console.error('[Messenger] receiveMessage handler error', e); }
      });

        // incoming private messages (from other users)
        s.on('privateMessage', (payload) => {
          try {
            const fromId = payload && (payload.sender || (payload.from && (payload.from.id || payload.from._id))) ? (payload.sender || payload.from.id || payload.from._id) : null;
            const text = payload && (payload.content || payload.text || payload.message) || '';
            const timestamp = payload && (payload.timestamp || payload.date) ? new Date(payload.timestamp || payload.date).getTime() : Date.now();
            const newMsg = {
              id: payload && (payload._id || payload.id) ? (payload._id || payload.id) : Date.now() + Math.floor(Math.random()*1000),
              fromId: fromId || 'unknown',
              from: payload && (payload.fromName || payload.senderName || payload.from && payload.from.name) || 'Contact',
              toId: effectiveUserId,
              to: 'Vous',
              text,
              time: timestamp,
              read: false,
              channel: 'socket',
              status: 'delivered'
            };
            allMessages.push(newMsg);
            // reconcile optimistic local message if server returned tempId
            try {
              const tempId = payload && (payload.tempId || payload.tempID || payload.clientTempId || payload.temp_id);
              if (tempId) {
                const local = safeMessages.find(m => String(m.id) === String(tempId));
                if (local) local.status = 'delivered';
              }
            } catch (e) {}
            try { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; } catch (e) {}
            // auto-add sender to contacts if unknown (best-effort)
            try {
              const senderId = fromId || (payload && (payload.fromId || payload.sender || (payload.from && (payload.from.id || payload.from._id))));
              if (senderId) {
                const exists = safeAgents.find(a => String(a.id) === String(senderId));
                if (!exists) {
                  safeAgents.push({ id: senderId, name: payload && (payload.senderName || payload.fromName) || 'Contact', photo: '/uploads/agents/anonymous.png' });
                }
              }
            } catch (e) { console.warn('[Messenger] auto-add sender failed', e); }
            // recompute unread after handling this incoming message
            try { recomputeUnread(); } catch (e) {}
          } catch (e) { console.error('[Messenger] privateMessage handler error', e); }
        });

      s.on('notification', (n) => { try { setNotif(n && (n.message || n.title) ? (n.message || n.title) : 'Notification'); setTimeout(()=>setNotif(null), 2500); } catch (e) {} });

      s.on('messageHistory', (history) => {
        try {
          console.log('[Messenger] received messageHistory event, count=', Array.isArray(history)?history.length:0);
          if (Array.isArray(history)) {
            history.forEach(m => {
              allMessages.push({
                id: m.id || Date.now()+Math.floor(Math.random()*1000),
                fromId: m.fromId || (m.from && m.from.id) || null,
                from: m.fromName || (m.from && m.from.name) || '',
                toId: m.toId || null,
                to: m.toName || '',
                text: m.text || m.content || '',
                time: m.timestamp || (m.time || Date.now()),
                read: !(m.unread),
                channel: 'socket',
                status: 'delivered'
              });
            });
            // force a react re-render so UI updates immediately
            setMessagesVersion(v => v + 1);
          }
        } catch (e) { console.error('[Messenger] messageHistory handler error', e); }
      });

      // Acknowledgement from server for optimistic messages -> reconcile tempId with DB id
      s.on('privateMessageAck', (ack) => {
        try {
          console.log('[Messenger] privateMessageAck', ack);
          const tempId = ack && (ack.tempId || ack.tempID || ack.clientTempId || null);
          if (tempId) {
            const local = safeMessages.find(m => String(m.id) === String(tempId));
            if (local) {
              // Replace temporary id with real id (non-destructive) and update status
              if (ack.id || ack._id) local.id = ack.id || ack._id;
              local.status = 'delivered';
              try {
                const ts = ack.timestamp || ack.date || null;
                if (ts) local.time = new Date(ts).getTime ? new Date(ts).getTime() : Date.now();
              } catch (e) {}
            }
          }
        } catch (e) { console.error('[Messenger] privateMessageAck handler error', e); }
      });

    } catch (err) {
      console.warn('[Messenger] socket init failed', err);
    }

    return () => { try { socketRef.current && socketRef.current.disconnect(); } catch (e) {} socketRef.current = null; try { if (identInterval) clearInterval(identInterval); } catch(e) {} };
  }, []);

  // when initialAgentId is provided (like from AgentContactModal), select that agent on open
  useEffect(() => {
    if (open) {
      // prefer robust id keys
      const preferred = (initialAgentId || initialAgentId === 0) ? initialAgentId : null;
      if (preferred) {
        setSelectedAgentId(preferred);
      }
      // focus input a short time after opening (allow animation/DOM to settle)
      setTimeout(() => {
        try { inputRef.current && inputRef.current.focus(); } catch (e) {}
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }, 120);
    }
  }, [open, initialAgentId]);

  // if parent uses prop-controlled `open`, sync it
  useEffect(() => { setVisible(Boolean(open)); }, [open]);

  // Register primary messenger and listen for global open requests so only one instance shows
  useEffect(() => {
    // designate the first mounted messenger as primary if none exists
    if (!window.__ndaku_primary_messenger) window.__ndaku_primary_messenger = instanceId.current;

    const requestHandler = (e) => {
      const src = e?.detail?.sourceId;
      const aid = e?.detail?.agentId;
      if (!src) return; // ignore malformed requests
      if (src === instanceId.current) {
        // request originated from this instance -> toggle visibility
        setVisible(v => {
          const nv = !v;
          if (nv && aid) setSelectedAgentId(aid);
          if (nv) setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (err) {} ; if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 120);
          return nv;
        });
      } else {
        // another instance requested the messenger -> ensure this instance is closed
        setVisible(false);
      }
    };

    const legacyHandler = (e) => {
      // backward compatibility for code dispatching `ndaku-open-messenger` directly
      const aid = e?.detail?.agentId;
      // only the primary messenger should open on legacy events
      if (window.__ndaku_primary_messenger === instanceId.current) {
        if (aid) setSelectedAgentId(aid);
        setVisible(true);
        setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (err) {} ; if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 120);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('ndaku-request-open-messenger', requestHandler);
    window.addEventListener('ndaku-open-messenger', legacyHandler);
    return () => {
      window.removeEventListener('ndaku-request-open-messenger', requestHandler);
      window.removeEventListener('ndaku-open-messenger', legacyHandler);
    };
  }, []);

  // helper to select an agent and focus/scroll
  const selectAgent = (agentId) => {
    // clear old conversation immediately to avoid mixing messages while recomputing
    setConversationMessages([]);
    setSelectedAgentId(agentId);
    // mark read locally (simple approach)
    for (let m of safeMessages) {
      if (String(m.fromId) === String(agentId) && !m.read) m.read = true;
    }
    try { recomputeUnread(); } catch (e) {}
    setTimeout(() => {
      try { inputRef.current && inputRef.current.focus(); } catch (e) {}
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, 80);
  };

  // close sidebar when clicking outside of it
  useEffect(() => {
    const onDocClick = (e) => {
      if (!visible) return;
      if (sidebarCollapsed) return; // already closed
      const sidebarEl = sidebarRef.current;
      if (!sidebarEl) return;
      if (!sidebarEl.contains(e.target)) {
        setSidebarCollapsed(true);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [visible, sidebarCollapsed]);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Ajouter l'écouteur d'événement 'privateChat' pour les messages reçus
  socketRef.current?.on('privateChat', (payload) => {
    try {
      console.log('[Messenger] received privateChat:', payload);
      const newMsg = {
        id: payload.id || Date.now() + Math.random(),
        fromId: payload.fromId || payload.sender,
        from: payload.fromName || payload.senderName || 'Contact',
        toId: effectiveUserId,
        to: 'Vous',
        text: payload.content || payload.text || '',
        time: payload.timestamp || Date.now(),
        read: false,
        status: 'delivered'
      };
      
      allMessages.push(newMsg);
      setMessagesVersion(v => v + 1);
      
      // Auto scroll to bottom
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
    } catch (e) {
      console.error('[Messenger] privateChat handler error:', e);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    if (!authService.isAuthenticated()) {
      setShowAuthPrompt(true);
      return;
    }

    const safeUserId = effectiveUserId || (user?.id || user?._id);
    if (!safeUserId || !selectedAgentId) {
      setNotif("Erreur: Impossible d'envoyer le message");
      setTimeout(() => setNotif(null), 1500);
      return;
    }

    const tmpId = Date.now() + Math.random();
    const newMsg = {
      id: tmpId,
      fromId: safeUserId,
      from: 'Vous',
      toId: selectedAgentId,
      to: safeAgents.find(a => String(a.id) === String(selectedAgentId))?.name,
      text: input,
      time: Date.now(),
      read: false,
      status: 'pending'
    };

    // Optimistic update - ajouter immédiatement le message à l'UI
    allMessages.push(newMsg);
    setMessagesVersion(v => v + 1);
    
    // Scroll to bottom after adding new message
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
    
    if (socketRef.current?.connected) {
      socketRef.current.emit('privateChat', {
        senderId: String(safeUserId),
        recipientId: String(selectedAgentId), 
        content: input,
        tempId: tmpId
      }, (err, ack) => {
        if (err) {
          console.error('[Messenger] Send error:', err);
          setNotif("Erreur d'envoi");
          setTimeout(() => setNotif(null), 1500);
          return;
        }
        // Update message status on success
        const msg = allMessages.find(m => m.id === tmpId);
        if (msg) {
          msg.status = 'delivered';
          msg.id = ack?.id || msg.id;
          setMessagesVersion(v => v + 1);
        }
        setNotif('Message envoyé');
        setTimeout(() => setNotif(null), 1200);
      });
    } else {
      pendingQueue.current.push({ 
        id: tmpId,
        toId: selectedAgentId,
        text: input 
      });
      setNotif("Message en attente (hors ligne)");
      setTimeout(() => setNotif(null), 2000);
    }

    setInput('');
  };

  const handleAttach = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const content = evt.target.result;
      // TODO: implement actual file send
      console.log('File selected:', file.name, 'Content:', content);
      setNotif('Envoi de fichiers pas encore implémenté dans cette démo');
      setTimeout(() => setNotif(null), 2000);
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = null;
  };

  // Always render the floating toggle button and messenger modal
  return (
    <>
      <button
        aria-label={visible ? 'Fermer la messagerie' : 'Ouvrir la messagerie'}
        className={`messenger-toggle-btn ${visible ? 'open' : ''}`}
        onClick={() => {
          try {
            window.dispatchEvent(new CustomEvent('ndaku-request-open-messenger', { 
              detail: { sourceId: instanceId.current, agentId: selectedAgentId } 
            }));
          } catch (err) {
            setVisible(v => {
              const nv = !v;
              if (nv) setTimeout(() => { 
                try { inputRef.current?.focus(); } catch (e) {} 
              }, 120);
              return nv;
            });
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="messenger-floating-badge" 
                style={{position:'absolute',top:-6,right:-6,background:'#d7263d',
                        color:'#fff',borderRadius:12,padding:'2px 6px',fontSize:'0.75rem'}}>
            {unreadCount}
          </span>
        )}
      </button>

      {visible && (
        <div className={`messenger-modal messenger-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-open'}`}>
          <div className="messenger-inner" style={{display:'flex',height:'420px',maxWidth:'98vw'}}>

            {/* Sidebar contacts */}
            <div ref={sidebarRef} className={`messenger-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} 
                 style={{width: sidebarCollapsed ? 64 : 200,background:'#f7f7f7',
                        borderRight:'1px solid #f1f5f3',display:'flex',
                        flexDirection:'column',transition:'width 0.18s ease'}}>
              <div className="sidebar-header" style={{padding:'12px 10px',fontWeight:800,
                                                    fontSize:'1.05rem',color:'var(--ndaku-primary)',
                                                    display:'flex',alignItems:'center',
                                                    justifyContent:'space-between',gap:8}}>
                {!sidebarCollapsed ? 'Contacts' : ' '}
                <button aria-label={sidebarCollapsed? 'Ouvrir la liste' : 'Réduire la liste'} 
                        className="sidebar-toggle" onClick={()=>setSidebarCollapsed(s=>!s)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6L16 12L9 18" stroke="currentColor" strokeWidth="2" 
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="sidebar-list" style={{flex:1,overflowY:'auto'}}>
                {contactsSorted.map(({agent, lastMsg, unread}) => (
                  <div key={agent.id} 
                       className={`sidebar-contact${String(selectedAgentId)===String(agent.id)?' active':''}`}
                       onClick={()=>selectAgent(agent.id)}
                       style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                              cursor:'pointer',
                              background:String(selectedAgentId)===String(agent.id)?'#eef7f3':'',
                              borderBottom:'1px solid #f7f7f7'}}>
                    <img src={process.env.REACT_APP_BACKEND_APP_URL+agent.photo} 
                         alt={agent.name} className="agent-avatar" 
                         style={{width:36,height:36}} />
                    {!sidebarCollapsed && (
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:'1.05em',color:'#0a223a'}}>{agent.name}</div>
                        <div style={{fontSize:'0.92em',color:'#888',whiteSpace:'nowrap',
                                   overflow:'hidden',textOverflow:'ellipsis',maxWidth:140}}>
                          {lastMsg?.text||'Aucun message'}
                        </div>
                      </div>
                    )}
                    {unread>0 && 
                      <span className="badge" 
                            style={{background:'#d7263d',color:'#fff',
                                   borderRadius:8,padding:'2px 7px',fontSize:'0.85em'}}>
                        {unread}
                      </span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="messenger-chat" 
                 style={{flex:1,display:'flex',flexDirection:'column',
                        position:'relative',background:'#fff'}}>
              
              {/* Chat Header */}
              <div className="messenger-header" 
                   style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                          padding:'10px 12px',borderBottom:'1px solid #f1f5f3'}}>
                <div className="agent-info" style={{display:'flex',alignItems:'center',gap:12}}>
                  <button className="header-sidebar-toggle"
                          aria-label={sidebarCollapsed ? 'Ouvrir la liste' : 'Fermer la liste'}
                          title={sidebarCollapsed ? 'Ouvrir la liste' : 'Fermer la liste'}
                          onClick={() => setSidebarCollapsed(s => !s)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" 
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {currentAgent && (
                    <>
                      <img src={process.env.REACT_APP_BACKEND_APP_URL+currentAgent.photo} 
                           alt={currentAgent.name} className="agent-avatar" 
                           style={{width:36,height:36}} />
                      <div style={{fontWeight:700}}>{currentAgent.name}</div>
                    </>
                  )}
                </div>
                <button onClick={() => { setVisible(false); if (onClose) onClose(); }} 
                        className="close-btn" aria-label="Fermer la messagerie">&times;</button>
              </div>

              {/* Messages Body */}
              <div className="messenger-body" ref={bodyRef}
                   style={{flex:1,overflowY:'auto',padding:'18px 18px 10px 18px',
                          background:'#f7f7f7'}}>
                {conversationMessages.length === 0 && (
                  <div style={{color:'#888',textAlign:'center',marginTop:40}}>
                    Aucun message avec cet agent.
                  </div>
                )}
                {conversationMessages.map((msg) => (
                  <div key={msg.id} className={`msg-bubble ${String(msg.fromId)===String(effectiveUserId)?'user':'agent'}`}>
                    {String(msg.fromId)!==String(effectiveUserId) && (
                      <img src={process.env.REACT_APP_BACKEND_APP_URL+safeAgents.find(a=>String(a.id)===String(msg.fromId))?.photo}
                           alt="avatar" className="msg-avatar" style={{width:36,height:36}} />
                    )}
                    <div className="msg-content">
                      <div className="msg-text">{msg.text}</div>
                      <div className="msg-time">
                        {formatDateTime(msg.time || msg.timestamp || msg.date || msg.time)}
                        {String(msg.fromId)===String(effectiveUserId) && getStatusIcon(msg.status||'sent')}
                      </div>
                    </div>
                    {String(msg.fromId)===String(effectiveUserId) && (
                      <div className="msg-avatar user-avatar">👤</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Auth Prompt */}
              {showAuthPrompt && (
                <div className="auth-prompt" role="dialog" aria-modal="true">
                  <div className="auth-prompt-inner">
                    <div style={{marginBottom:8}}>Veuillez vous connecter pour envoyer un message.</div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-sm btn-primary" 
                              onClick={() => { 
                                window.dispatchEvent(new CustomEvent('ndaku-show-login')); 
                                setShowAuthPrompt(false); 
                              }}>
                        Se connecter
                      </button>
                      <button className="btn btn-sm btn-secondary" 
                              onClick={() => setShowAuthPrompt(false)}>
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="messenger-footer" 
                   style={{display:'flex',alignItems:'center',padding:'12px 18px',
                          borderTop:'1.5px solid #e9f7f3',background:'#fff',gap:8}}>
                <div style={{display:'flex',alignItems:'center',flex:1,gap:8}}>
                  <input ref={inputRef}
                         className="messenger-input"
                         type="text"
                         value={input}
                         onChange={e => setInput(e.target.value)}
                         placeholder="Écrivez un message..."
                         onKeyDown={e => e.key === 'Enter' && handleSend()}
                         aria-label="Votre message"
                  />
                </div>
                
                <input type="file"
                       style={{ display: 'none' }}
                       ref={fileInput}
                       onChange={handleAttach}
                       aria-hidden
                />
                
                <button className="attach-btn" 
                        title="Joindre un fichier" 
                        onClick={() => fileInput.current.click()} 
                        aria-label="Joindre un fichier">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-7.07 7.07a2 2 0 0 1-2.83-2.83l6.36-6.36" 
                          stroke="currentColor" strokeWidth="1.6" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                <button className="send-btn" 
                        onClick={handleSend} 
                        disabled={!input.trim()} 
                        aria-label="Envoyer le message" 
                        title="Envoyer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="#fff" strokeWidth="1.6" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="1.2" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notif && (
        <div className="messenger-notif">{notif}</div>
      )}
    </>
  );
};

export default MessengerWidget;
