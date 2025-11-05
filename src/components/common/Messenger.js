
import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { agents, messages as allMessages } from '../../data/fakedata';
import authService from '../../services/authService';
import './Messenger.css';
import { useMessageContext } from '../../contexts/MessageContext';
function formatTime(date) {
  if (!date) return '';
  if (typeof date === 'number') date = new Date(date);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Message status: sent, delivered, read, pending
function getStatusIcon(status) {
  if (status === 'pending') return <span title="En attente" style={{color:'#aaa'}}>⏳</span>;
  if (status === 'sent') return <span title="Envoyé" style={{color:'var(--ndaku-primary)'}}>✓</span>;
  if (status === 'delivered') return <span title="Reçu" style={{color:'var(--ndaku-primary)'}}>✓✓</span>;
  if (status === 'read') return <span title="Lu" style={{color:'var(--ndaku-primary)',fontWeight:700}}>✓✓</span>;
  return null;
}

const MessengerWidget = ({ open, onClose, userId = 1, initialAgentId = null }) => {
  const [visible, setVisible] = useState(Boolean(open));
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id);
  const [input, setInput] = useState('');
  const [notif, setNotif] = useState(null);
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const fileInput = useRef();
  const bodyRef = useRef();
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const pendingQueue = useRef([]);
  const instanceId = useRef(`messenger_${Date.now()}_${Math.floor(Math.random()*10000)}`);
  const sidebarRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const safeAgents = agents || [];
  const safeMessages = allMessages || [];
  // prepare sorted contacts with last message & unread
  const contacts = safeAgents.map(agent => {
    const msgs = safeMessages.filter(m => String(m.fromId) === String(agent.id) || String(m.toId) === String(agent.id));
    const last = msgs.slice().sort((a,b)=>b.time-a.time)[0];
    const unread = safeMessages.filter(m => String(m.fromId) === String(agent.id) && !m.read).length;
    return { agent, lastMsg: last, unread, lastTime: last ? last.time : 0 };
  });
  const contactsSorted = contacts.sort((a,b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    if (b.lastTime !== a.lastTime) return b.lastTime - a.lastTime;
    return (a.agent.name || '').localeCompare(b.agent.name || '');
  });
  // Simuler messages par agent
  const agentMessages = safeMessages.filter(m => String(m.fromId) === String(selectedAgentId) || String(m.toId) === String(selectedAgentId));

  const currentAgent = safeAgents.find(a => String(a.id) === String(selectedAgentId)) || null;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [selectedAgentId, agentMessages]);

  // initialize socket connection for messaging (mount)
  useEffect(() => {
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
          }

          // flush pending queue (send messages queued while disconnected)
          if (pendingQueue.current && pendingQueue.current.length > 0) {
            console.log('[Messenger] flushing pending message queue, count=', pendingQueue.current.length);
            while (pendingQueue.current.length) {
              const item = pendingQueue.current.shift();
              try {
                s.emit('newMessage', { userId: String(item.toId), text: item.text, tempId: item.id });
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

      s.on('receiveMessage', (payload) => {
        try {
          const fromId = (payload && payload.from && (payload.from.id || payload.from._id)) || null;
          const text = payload && (payload.text || payload.message || payload.content) || '';
          const timestamp = payload && (payload.date || payload.timestamp) ? new Date(payload.date || payload.timestamp).getTime() : Date.now();
          const newMsg = {
            id: Date.now() + Math.floor(Math.random()*1000),
            fromId: fromId || 'bot',
            from: payload.from && (payload.from.name || payload.from.email) || 'Bot',
            toId: userId,
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
        } catch (e) { console.error('[Messenger] receiveMessage handler error', e); }
      });

      s.on('notification', (n) => { try { setNotif(n && (n.message || n.title) ? (n.message || n.title) : 'Notification'); setTimeout(()=>setNotif(null), 2500); } catch (e) {} });

      s.on('messageHistory', (history) => {
        try {
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
          }
        } catch (e) { console.error('[Messenger] messageHistory handler error', e); }
      });

    } catch (err) {
      console.warn('[Messenger] socket init failed', err);
    }

    return () => { try { socketRef.current && socketRef.current.disconnect(); } catch (e) {} socketRef.current = null; };
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
    setSelectedAgentId(agentId);
    // mark read locally (simple approach)
    for (let m of safeMessages) {
      if (String(m.fromId) === String(agentId) && !m.read) m.read = true;
    }
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

  const handleSend = () => {
    if (!input.trim()) return;
    // require authentication to send
    if (!authService.isAuthenticated()) {
      // show inline prompt asking user to login
      setShowAuthPrompt(true);
      return;
    }
    // Ici, on simule l'envoi localement et on envoie via socket si connecté
    const tmpId = Date.now() + Math.floor(Math.random()*1000);
    safeMessages.push({
      id: tmpId,
      fromId: userId,
      from: 'Vous',
      toId: selectedAgentId,
      to: (safeAgents.find(a => String(a.id) === String(selectedAgentId)) || {}).name,
      text: input,
      time: Date.now(),
      read: false,
      channel: 'web',
      status: 'pending',
    });
    // emit via socket if available; include tempId to help server/client reconciliation
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('newMessage', { userId: String(selectedAgentId), text: input, tempId: tmpId });
        // optimistic mark as sent
        const local = safeMessages.find(m => m.id === tmpId);
        if (local) local.status = 'sent';
        setNotif('Message envoyé');
        setTimeout(() => setNotif(null), 1200);
      } else {
        // queue for later sending when socket reconnects
        pendingQueue.current.push({ id: tmpId, toId: selectedAgentId, text: input });
        setNotif("Message mis en file d'attente (connexion indisponible)");
        setTimeout(() => setNotif(null), 2000);
      }
    } catch (e) { console.warn('[Messenger] failed to emit newMessage', e); }
    setInput('');
  };

  const handleAttach = e => {
    const file = e.target.files[0];
    if (file) {
      safeMessages.push({
        id: Date.now(),
        fromId: userId,
        from: 'Vous',
        toId: selectedAgentId,
        to: (safeAgents.find(a => String(a.id) === String(selectedAgentId)) || {}).name,
        text: `📎 Fichier envoyé : ${file.name}`,
        time: Date.now(),
        read: false,
        channel: 'web',
        status: 'pending',
      });
      setNotif('Fichier envoyé');
      setTimeout(() => setNotif(null), 1200);
    }
  };

  // Always render the floating toggle so chat can be opened from any page.
  return (
    <>
      <button
        aria-label={visible ? 'Fermer la messagerie' : 'Ouvrir la messagerie'}
        className={`messenger-toggle-btn ${visible ? 'open' : ''}`}
        onClick={() => {
          // request that the global messenger manager open this instance (or toggle if same instance)
          try {
            window.dispatchEvent(new CustomEvent('ndaku-request-open-messenger', { detail: { sourceId: instanceId.current, agentId: selectedAgentId } }));
          } catch (err) {
            // fallback to local toggle if dispatch fails
            setVisible(v => {
              const nv = !v;
              if (nv) setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 120);
              return nv;
            });
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {visible && (
        <div className={`messenger-modal messenger-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-open'}`}>
          <div className="messenger-inner" style={{display:'flex',height:'420px',maxWidth:'98vw'}}>

            {/* Sidebar contacts */}
            <div ref={sidebarRef} className={`messenger-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{width: sidebarCollapsed ? 64 : 200,background:'#f7f7f7',borderRight:'1px solid #f1f5f3',display:'flex',flexDirection:'column',transition:'width 0.18s ease'}}>
              <div className="sidebar-header" style={{padding:'12px 10px',fontWeight:800,fontSize:'1.05rem',color:'var(--ndaku-primary)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                {!sidebarCollapsed ? 'Contacts' : ' '}
                <button aria-label={sidebarCollapsed? 'Ouvrir la liste' : 'Réduire la liste'} className="sidebar-toggle" onClick={()=>setSidebarCollapsed(s=>!s)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M9 6L16 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="sidebar-list" style={{flex:1,overflowY:'auto'}}>
                {contactsSorted.map(({agent, lastMsg, unread}) => {
                  return (
                    <div key={agent.id || agent._id} className={`sidebar-contact${String(selectedAgentId)===String(agent.id)?' active':''}`} onClick={()=>selectAgent(agent.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',cursor:'pointer',background:String(selectedAgentId)===String(agent.id)?'#eef7f3':'',borderBottom:'1px solid #f7f7f7'}}>
                      <img src={process.env.REACT_APP_BACKEND_APP_URL+agent.photo} alt={agent.name} className="agent-avatar" style={{width:36,height:36}} />
                      {!sidebarCollapsed && (
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:'1.05em',color:'#0a223a'}}>{agent.name}</div>
                          <div style={{fontSize:'0.92em',color:'#888',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140}}>{lastMsg?.text||'Aucun message'}</div>
                        </div>
                      )}
                      {unread>0 && <span className="badge" style={{background:'#d7263d',color:'#fff',borderRadius:8,padding:'2px 7px',fontSize:'0.85em'}}>{unread}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zone de chat */}
            <div className="messenger-chat" style={{flex:1,display:'flex',flexDirection:'column',position:'relative',background:'#fff'}}>
              {/* Header chat */}
              <div className="messenger-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderBottom:'1px solid #f1f5f3'}}>
                <div className="agent-info" style={{display:'flex',alignItems:'center',gap:12}}>
                   <button
                    className="header-sidebar-toggle"
                    aria-label={sidebarCollapsed ? 'Ouvrir la liste de contacts' : 'Fermer la liste de contacts'}
                    title={sidebarCollapsed ? 'Ouvrir la liste' : 'Fermer la liste'}
                    onClick={() => setSidebarCollapsed(s => !s)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <img src={process.env.REACT_APP_BACKEND_APP_URL+safeAgents.find(a=>String(a.id)===String(selectedAgentId))?.photo} alt="avatar" className="agent-avatar" style={{width:36,height:36}} />
                  <div style={{fontWeight:700}}>{safeAgents.find(a=>String(a.id)===String(selectedAgentId))?.prenom || 'Agent'}</div>
                </div>
                  {/* Header toggle to open/close sidebar (next to avatar) */}
                 
                  <div>
                    <button onClick={() => { setVisible(false); if (onClose) onClose(); }} className="close-btn" aria-label="Fermer la messagerie">&times;</button>
                  </div>
              </div>

              {/* Body chat */}
              <div className="messenger-body" ref={bodyRef} style={{flex:1,overflowY:'auto',padding:'18px 18px 10px 18px',background:'#f7f7f7'}}>
                {agentMessages.length===0 && <div style={{color:'#888',textAlign:'center',marginTop:40}}>Aucun message avec cet agent.</div>}
                {agentMessages.map((msg, i) => (
                  <div key={msg.id||i} className={`msg-bubble ${msg.fromId===userId?'user':'agent'}`}>
                    {msg.fromId!==userId && <img src={process.env.REACT_APP_BACKEND_APP_URL+safeAgents.find(a=>String(a.id)===String(msg.fromId))?.photo} alt="avatar" className="msg-avatar" />}
                    <div className="msg-content">
                      <div className="msg-text">{msg.text}</div>
                      <div className="msg-time">{formatTime(msg.time)} {msg.fromId===userId && getStatusIcon(msg.status||'sent')}</div>
                    </div>
                    {msg.fromId===userId && <div className="msg-avatar user-avatar">👤</div>}
                  </div>
                ))}
              </div>

              {/* Inline auth prompt when user tries to send while unauthenticated */}
              {showAuthPrompt && (
                <div className="auth-prompt" role="dialog" aria-modal="true">
                  <div className="auth-prompt-inner">
                    <div style={{marginBottom:8}}>Veuillez vous connecter pour envoyer un message.</div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-sm btn-primary" onClick={() => { window.dispatchEvent(new CustomEvent('ndaku-show-login')); setShowAuthPrompt(false); }}>
                        Se connecter
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowAuthPrompt(false)}>Annuler</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer chat */}
              <div className="messenger-footer" style={{display:'flex',alignItems:'center',padding:'12px 18px',borderTop:'1.5px solid #e9f7f3',background:'#fff',gap:8}}>
                <div style={{display:'flex',alignItems:'center',flex:1,gap:8}}>
                  <input
                    ref={inputRef}
                    className="messenger-input"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Écrivez un message..."
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    aria-label="Votre message"
                  />
                </div>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInput}
                  onChange={handleAttach}
                  aria-hidden
                />
                <button className="attach-btn" title="Joindre un fichier" onClick={() => fileInput.current.click()} aria-label="Joindre un fichier">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-7.07 7.07a2 2 0 0 1-2.83-2.83l6.36-6.36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="send-btn" onClick={handleSend} disabled={!input.trim()} aria-label="Envoyer le message" title="Envoyer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M22 2L11 13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {notif && <div className="messenger-notif">{notif}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessengerWidget;
