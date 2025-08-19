import React, { useEffect, useRef, useState } from 'react';
import '../common/ChatWidget.css';
import ConfirmModal from './ConfirmModal';
import InfoModal from './InfoModal';
import { FaPhoneAlt, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';

// Simple WebSocket-based chat widget with basic call signaling
export default function ChatWidget({ serverUrl = 'ws://localhost:8081', inline = false, user = null, additionalSendMeta = null }) {
  const [ws, setWs] = useState(null);
  const [connectedId, setConnectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(!!inline);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // helper to determine runtime user (prop overrides localStorage)
    const getUser = () => {
      try { return user || JSON.parse(localStorage.getItem('ndaku_user') || '{}'); } catch (e) { return {}; }
    };
    // load persisted messages per user
    try {
      const runtimeUser = getUser();
      const key = runtimeUser && runtimeUser.id ? `ndaku_chat_messages_${runtimeUser.id}` : 'ndaku_chat_messages_public';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      setMessages(existing);
    } catch (e) { /* ignore */ }

    // prompt for notifications (once)
    try {
      if (window.Notification && Notification.permission === 'default') {
        Notification.requestPermission().then(() => {});
      }
    } catch (e) {}

    // reconnection/backoff
    let socket;
    let attempts = 0;
    let closedByUs = false;
    const connect = () => {
      socket = new WebSocket(serverUrl);
      socket.onopen = () => {
        console.log('chat ws open');
        attempts = 0;
        // flush pending queue
        try {
          const runtimeUser = (user) ? user : JSON.parse(localStorage.getItem('ndaku_user') || '{}');
          const qk = runtimeUser && runtimeUser.id ? `ndaku_pending_${runtimeUser.id}` : 'ndaku_pending_public';
          const queued = JSON.parse(localStorage.getItem(qk) || '[]');
          queued.forEach(item => socket.send(JSON.stringify(item)));
          localStorage.removeItem(qk);
        } catch (e) {}
      };
      socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'welcome') setConnectedId(data.id);
        // ignore messages not addressed to us (if they include a 'to' field)
        if (data.to && typeof connectedId === 'string' && data.to !== connectedId && data.to !== 'all' && data.to !== 'support') {
          // not for us
          return;
        }
        else if (data.type === 'chat') {
          setMessages(m => {
            const next = [...m, { from: data.from, text: data.text, ts: Date.now() }];
            // persist
            try {
              const user = JSON.parse(localStorage.getItem('ndaku_user') || '{}');
              const key = user && user.id ? `ndaku_chat_messages_${user.id}` : 'ndaku_chat_messages_public';
              localStorage.setItem(key, JSON.stringify(next));
            } catch (e) {}
            return next;
          });
          // notification
          if (!open && audioRef.current) audioRef.current.play().catch(()=>{});
          if (!open) setUnread(n => n + 1);
          if (window.Notification && Notification.permission === 'granted') {
            try { new Notification('Ndaku — nouveau message', { body: data.text }); } catch(e){}
          }
        }
        else if (data.type === 'call') setMessages(m => [...m, { from: data.from, text: '[Call signal] ' + (data.action || ''), ts: Date.now() }]);
        // WebRTC signaling handlers
        else if (data.type === 'webrtc-offer') {
          // incoming offer from another client
          handleIncomingOffer(data);
        } else if (data.type === 'webrtc-answer') {
          handleIncomingAnswer(data);
        } else if (data.type === 'webrtc-candidate') {
          handleIncomingCandidate(data);
        } else if (data.type === 'webrtc-hangup') {
          // remote hangup
          endActiveCall(data.from);
        }
      } catch (e) { console.warn('ws parse', e); }
    };
      socket.onclose = () => {
        console.log('chat ws closed');
        if (!closedByUs) {
          attempts++;
          const backoff = Math.min(30000, 1000 * Math.pow(1.8, attempts));
          setTimeout(connect, backoff);
        }
      };
      socket.onerror = (e) => { console.warn('ws err', e); socket.close(); };
      setWs(socket);
    };
    connect();
    return () => { closedByUs = true; try { socket && socket.close(); } catch(e){} };
  }, [serverUrl, open]);

  // refs/state for WebRTC
  const pcsRef = useRef({}); // map of peerId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const [inCall, setInCall] = useState(false);
  const [callPeer, setCallPeer] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // null | incoming | connecting | in-call | ended | error
  const [callError, setCallError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [agentName, setAgentName] = useState('Support');
  const [queuedMessages, setQueuedMessages] = useState([]);
  const connectingTimeoutRef = useRef(null);
  const callStatusRef = useRef(callStatus);

  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

    // load any previously queued (offline) messages into state for UI display
    useEffect(() => {
      try {
        const runtimeUser = user || JSON.parse(localStorage.getItem('ndaku_user') || '{}');
        const qk = runtimeUser && runtimeUser.id ? `ndaku_pending_${runtimeUser.id}` : 'ndaku_pending_public';
        const queued = JSON.parse(localStorage.getItem(qk) || '[]');
        setQueuedMessages(queued);
      } catch (e) {}
    }, []);

  // helper: create RTCPeerConnection for a peer
  const createPeer = (peerId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcsRef.current[peerId] = pc;
    pc.onicecandidate = (e) => { if (e.candidate) send({ type: 'webrtc-candidate', to: peerId, candidate: e.candidate }); };
    pc.ontrack = (e) => {
      // attach remote stream
      try {
        const remote = document.getElementById('ndaku-remote-audio');
        if (remote) {
          remote.srcObject = e.streams[0];
          remote.play().catch(()=>{});
        }
      } catch (e) {}
    };
    return pc;
  };

  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = s;
      return s;
    } catch (e) {
    setInfoMsg('Impossible d\u2019accéder au micro. Vérifiez les permissions.');
    setInfoOpen(true);
      throw e;
    }
  };

  const handleIncomingOffer = async (data) => {
  // show incoming call UI and store the offer until user accepts/declines
  pendingOfferRef.current = data;
  setCallPeer(data.from);
  setAgentName((data && data.meta && data.meta.agentName) ? data.meta.agentName : (data.from || 'Agent'));
  setCallStatus('incoming');
  };

  const handleIncomingAnswer = async (data) => {
    try {
      const pc = pcsRef.current[data.from];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
  // remote accepted
  setCallStatus('in-call');
    } catch (e) { console.warn('handle answer', e); }
  };

  const handleIncomingCandidate = async (data) => {
    try {
      const pc = pcsRef.current[data.from];
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) { console.warn('add candidate', e); }
  };

  const endActiveCall = (peerId) => {
    try {
      const pc = pcsRef.current[peerId];
      if (pc) { pc.close(); delete pcsRef.current[peerId]; }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      setInCall(false); setCallPeer(null);
      setCallStatus('ended');
      setTimeout(() => { setCallStatus(null); setCallError(null); }, 2500);
      const remote = document.getElementById('ndaku-remote-audio'); if (remote) { remote.srcObject = null; }
    } catch (e) {}
  };
  let startCall = () => {
    // placeholder - will be replaced below
  };

  // allow other components to request a call by dispatching a CustomEvent 'ndaku-call' with detail { to: 'support', meta: { agentId } }
  useEffect(() => {
    const handler = (e) => {
      const detail = e && e.detail ? e.detail : e;
      if (!detail || !detail.to) return;
      startCall(detail.to, detail.meta);
    };
    window.addEventListener('ndaku-call', handler);
    return () => window.removeEventListener('ndaku-call', handler);
  }, []);

     startCall = async (to = 'support', meta = {}) => {
    // prepare local stream and pc, and show connecting UI
    try {
      setAgentName((meta && meta.agentName) ? meta.agentName : 'Support');
      setCallStatus('connecting');
      const ls = await getLocalStream();
      const peerId = to;
      setCallPeer(peerId);
      const pc = createPeer(peerId);
      ls.getTracks().forEach(t => pc.addTrack(t, ls));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // send initial call signal with optional meta so support can route
      send({ type: 'call', action: 'start', to: peerId, meta });
      send({ type: 'webrtc-offer', to: peerId, sdp: pc.localDescription });
      setInCall(true);
      // if no answer after X seconds show error
      setTimeout(() => {
        if (callStatus === 'connecting') {
          setCallError('Aucune réponse. Vérifiez votre connexion et réessayez.');
          setCallStatus('error');
          // close resources
          try { endActiveCall(peerId); } catch(e){}
        }
      }, 20000);
    } catch (e) { console.warn('startCall failed', e); setCallError('Erreur lors de l 27initialisation de l 27appel.'); setCallStatus('error'); }
  };

  // incoming call helpers
  const pendingOfferRef = useRef(null);
  const acceptIncomingCall = async () => {
    const data = pendingOfferRef.current;
    if (!data) return;
    try {
      setCallStatus('connecting');
      const pc = createPeer(data.from);
      const ls = await getLocalStream();
      ls.getTracks().forEach(t => pc.addTrack(t, ls));
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send({ type: 'webrtc-answer', to: data.from, sdp: pc.localDescription });
      setInCall(true); setCallStatus('in-call'); setCallPeer(data.from);
      pendingOfferRef.current = null;
    } catch (e) { console.warn('accept incoming failed', e); setCallError('Impossible d 27accepter l 27appel'); setCallStatus('error'); }
  };
  const declineIncomingCall = (reason) => {
    const data = pendingOfferRef.current;
    if (data) send({ type: 'webrtc-hangup', to: data.from, reason: reason || 'declined' });
    pendingOfferRef.current = null;
    setCallStatus('ended');
    setTimeout(() => setCallStatus(null), 1200);
  };

  const toggleMute = () => {
    try {
      const s = localStreamRef.current;
      if (!s) return;
      s.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setMuted(m => !m);
    } catch (e) {}
  };

  const hangup = (peerId = callPeer) => {
    if (callStatus === 'in-call' || callStatus === 'connecting') {
      // open confirm modal
      setConfirmHangup(true);
      pendingHangupRef.current = peerId;
      return;
    }
    try { send({ type: 'webrtc-hangup', to: peerId }); } catch(e){}
    endActiveCall(peerId);
  };

    const [infoOpen, setInfoOpen] = useState(false);
    const [infoMsg, setInfoMsg] = useState('');

  const pendingHangupRef = useRef(null);
  const [confirmHangup, setConfirmHangup] = useState(false);
  const doConfirmHangup = ()=>{
    const pid = pendingHangupRef.current;
    pendingHangupRef.current = null;
    setConfirmHangup(false);
    try { send({ type: 'webrtc-hangup', to: pid }); } catch(e){}
    endActiveCall(pid);
  };


  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);

  // robust toggle: when closing the widget ensure call UI/timeouts are cleared and active call ended
  const handleToggle = () => {
    setOpen(o => {
      const next = !o;
      if (!next) {
        // closing: clear connecting timeout
        if (connectingTimeoutRef.current) { clearTimeout(connectingTimeoutRef.current); connectingTimeoutRef.current = null; }
        // end any active call resources
        try {
          if (callPeer || inCall || callStatus) {
            hangup(callPeer);
          }
        } catch (e) {}
        // hide call UI
        setCallStatus(null);
      }
      return next;
    });
    setUnread(0);
  };

  const send = (payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
      // queue for later
      try {
    const runtimeUser = user || JSON.parse(localStorage.getItem('ndaku_user') || '{}');
    const qk = runtimeUser && runtimeUser.id ? `ndaku_pending_${runtimeUser.id}` : 'ndaku_pending_public';
    const queued = JSON.parse(localStorage.getItem(qk) || '[]');
    queued.push(payload);
    localStorage.setItem(qk, JSON.stringify(queued));
    // don't show an alert; keep queued messages available in the UI
    try { setQueuedMessages(queued); } catch (e) {}
      } catch (e) { console.warn('queue failed', e); }
      return;
    }
    ws.send(JSON.stringify(payload));
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    // local echo
    const item = { from: 'me', text, ts: Date.now() };
    setMessages(m => {
      const next = [...m, item];
      try {
    const runtimeUser = user || JSON.parse(localStorage.getItem('ndaku_user') || '{}');
    const key = runtimeUser && runtimeUser.id ? `ndaku_chat_messages_${runtimeUser.id}` : 'ndaku_chat_messages_public';
    localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  // include optional meta to help route/store messages for agencies
  const payload = { type: 'chat', text };
  if (additionalSendMeta) payload.meta = additionalSendMeta;
  send(payload);
    setText('');
  };

  

  return (
    <div>
      <audio ref={audioRef} src="/notification.ogg" preload="auto" />
      <div className={`ndaku-chat-widget ${open ? 'open' : ''} ${inline ? 'inline' : ''}`} aria-live="polite">
        <div className="ndaku-chat-header d-flex align-items-center justify-content-between">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="chat-thumb" />
            <div>
              <div className="fw-bold">Support</div>
              <div className="small">Instantané & appel</div>
            </div>
          </div>
          <div>
            <button className="btn btn-sm btn-success" title="Contacter le support" onClick={() => { window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { source: 'widget' } } })); }}><FaPhoneAlt /></button>
          </div>
        </div>

        {/* audio element to play remote stream */}
        <audio id="ndaku-remote-audio" autoPlay style={{display:'none'}} />

        <div className="ndaku-chat-body" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ndaku-chat-msg ${m.from === 'me' ? 'me' : 'peer'}`}>
              <div className="ndaku-chat-text">{m.text}</div>
              <div className="ndaku-chat-ts">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        <div className="ndaku-chat-input d-flex gap-2">
          <input className="form-control form-control-sm" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} />
          <button className="btn btn-sm btn-success" onClick={sendMessage}>Envoyer</button>
        </div>

        {/* Call overlay */}
        {callStatus && (
          <div className="ndaku-call-overlay" role="dialog" aria-live="assertive">
            <div className="ndaku-call-card">
              <div className="ndaku-call-anim" aria-hidden>
                <FaPhoneAlt size={28} />
              </div>
              <div style={{textAlign:'center'}}>
                <div className="ndaku-call-status">{callStatus === 'incoming' ? 'Appel entrant' : callStatus === 'connecting' ? 'Connexion...' : callStatus === 'in-call' ? 'En appel' : callStatus === 'ended' ? 'Appel terminé' : 'Erreur'}</div>
                <div className="ndaku-call-sub">{agentName}</div>
              </div>

              {callStatus === 'incoming' && (
                <div className="ndaku-call-actions">
                  <button className="ndaku-call-btn mute btn-outline-secondary" title="Refuser" onClick={() => declineIncomingCall('user_declined')}><FaPhoneSlash /></button>
                  <button className="ndaku-call-btn hang" title="Accepter" onClick={acceptIncomingCall} style={{background:'#13c296', color:'white'}}><FaPhoneAlt /></button>
                </div>
              )}

              {callStatus === 'connecting' && (
                <div className="ndaku-call-actions">
                  <div className="small">Connexion en cours…</div>
                </div>
              )}

              {callStatus === 'in-call' && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                  <div className="ndaku-call-actions">
                    <button className={`ndaku-call-btn mute ${muted ? 'active' : ''}`} title={muted ? 'Activer le micro' : 'Couper le micro'} onClick={toggleMute}>{muted ? <FaMicrophoneSlash /> : <FaMicrophone />}</button>
                    <button className="ndaku-call-btn hang" title="Raccrocher" onClick={() => hangup()}><FaPhoneSlash /></button>
                  </div>
                  <div className="small">En communication avec <span className="ndaku-agent-name">{agentName}</span></div>
                </div>
              )}

              {callStatus === 'error' && (
                <div style={{width:'100%'}}>
                  <div className="ndaku-call-error">{callError || 'Une erreur est survenue pendant l\'appel.'}</div>
                  <div style={{height:8}} />
                  <div className="ndaku-call-actions">
                    <button className="ndaku-call-btn mute" onClick={() => { setCallStatus(null); setCallError(null); }}>Fermer</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
  <ConfirmModal open={confirmHangup} title={"Raccrocher"} message={"Voulez-vous vraiment raccrocher et terminer l'appel ?"} onConfirm={doConfirmHangup} onCancel={() => { setConfirmHangup(false); pendingHangupRef.current = null; }} />
  <InfoModal open={infoOpen} title={"Permission"} message={infoMsg} onClose={() => setInfoOpen(false)} />
      </div>
      {!inline && (
        <button className="ndaku-chat-toggle btn btn-success position-fixed" style={{ right: 20, bottom: 20, zIndex: 1200 }} onClick={handleToggle}>
          Chat {unread > 0 && <span className="badge bg-danger ms-2">{unread}</span>}
        </button>
      )}
    </div>
  );
}
