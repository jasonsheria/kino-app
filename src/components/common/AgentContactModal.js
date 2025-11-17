import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './AgentContactModal.css';
import { useAuth } from '../../contexts/AuthContext';

// Basic in-app WebRTC UI (loopback for demo) — no signaling server included.
const AgentContactModal = ({ agent, open, onClose }) => {
  // removed inline messenger: we will open the global messenger instead for a better view
  const [isCalling, setIsCalling] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, requesting, connecting, active, ended
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const { user } = useAuth();
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  
  // Swipe to close handler
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY, onClose());

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 100;
    if (isUpSwipe && !isCalling) {
      onClose();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    return () => {
      stopCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  // Safe accessor for agent fields to avoid calling .replace on undefined
  const agentName = agent?.prenom || agent?.name || 'Agent';
  const agentImageUrl = (process.env.REACT_APP_BACKEND_APP_URL || '') + (agent?.image || '');
  const rawWhatsapp = agent?.whatsapp || agent?.telephone || '';
  const whatsappNumber = rawWhatsapp ? String(rawWhatsapp).replace(/[^\d]/g, '') : '';

  // get current user id from auth context (if available)

  const currentUserId = user?.id || user?._id || null;

  const startTimer = () => {
    setCallTime(0);
    timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const formatTime = (s) => {
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
  };

  const requestPermissions = async () => {
    try {
      setCallStatus('requesting');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      setPermissionDenied(true);
      setCallStatus('idle');
      return false;
    }
  };

  const startCall = async () => {
    try {
      // Check permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;
      
      setIsCalling(true);
      setCallStatus('connecting');
      
      // get local media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // basic RTCPeerConnection loopback demo (no remote peer)
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // when remote tracks arrive (loopback will show local as remote)
      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      // add tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // For demo loopback: set remote description equal to local
      await pc.setRemoteDescription(offer);

      // create answer (same as offer) and set local/remote as needed
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await pc.setRemoteDescription(answer);

      startTimer();
    } catch (e) {
      console.error('startCall error', e);
      stopCall();
    }
  };

  const stopCall = () => {
    stopTimer();
    setIsCalling(false);
    setCallTime(0);
    if (pcRef.current) {
      try { pcRef.current.close(); } catch(e){}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  };

  const modal = (
    
    <div className="agent-contact-modal-bg" 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="agent-contact-modal" aria-modal="true" role="dialog">
        <button 
          className="close-btn" 
          onClick={() => { stopCall(); onClose(); }} 
          aria-label="Fermer"
        >&times;</button>
        <div className="agent-contact-header">
          <img src={agentImageUrl} alt={agentName} className="agent-avatar" />
          <div>
            <div className="fw-bold text-success" style={{fontSize:'1.1rem'}}>{agentName}</div>
            <div className="small text-muted">Agent immobilier</div>
          </div>
        </div>

        <div className="agent-contact-actions">
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${rawWhatsapp}?text=Bonjour,%20je%20suis%20intéressé(e)%20par%20vos%20services`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-success w-100 mb-2"
            >
              Message WhatsApp
            </a>
          ) : (
            <button className="btn btn-secondary w-100 mb-2" disabled>WhatsApp indisponible</button>
          )}

          <div className="webrtc-controls mb-2">
            {!isCalling ? (
              <button 
                className="btn btn-outline-success w-100" 
                onClick={() => { 
                  startCall(); onClose();
                  window.dispatchEvent(new CustomEvent('ndaku-call', { 
                    detail: { to: 'support', meta: { agentId: agent.id } } 
                  })); 
                }}
                disabled={permissionDenied}
              >
                {permissionDenied ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Autoriser le microphone
                  </>
                ) : callStatus === 'requesting' ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    Autorisation...
                  </>
                ) : callStatus === 'connecting' ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Connexion...</span>
                    </div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                    Démarrer l'appel
                  </>
                )}
              </button>
            ) : (
              <div className="call-panel">
                <div className="call-info-left">
                  <div className="fw-bold">En appel</div>
                    <div className="small text-muted">
                    <span>Avec {agentName}</span>
                    <span className="mx-2">•</span>
                    <span>{formatTime(callTime)}</span>
                  </div>
                </div>
                <div className="call-controls">
                  <button 
                    className={`btn ${micEnabled ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={toggleMic}
                    aria-label={micEnabled ? 'Désactiver le micro' : 'Activer le micro'}
                  >
                    {micEnabled ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                        Micro ON
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="1" y1="1" x2="23" y2="23"/>
                          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2M12 19v4M8 23h8"/>
                        </svg>
                        Micro OFF
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={stopCall}
                    aria-label="Raccrocher"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 2v4M8 2v4M3 9.5h18m-18 0c0 5.52 4.48 10 10 10s10-4.48 10-10"/>
                    </svg>
                    Raccrocher
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="btn btn-outline-primary w-100" onClick={() => {
            // close this modal to give full viewport to the messenger
            try { stopCall(); } catch(e){}
            if (onClose) onClose();
            // open global messenger and request a conversation with this agent
            window.dispatchEvent(new CustomEvent('ndaku-open-messenger', { detail: { agentId: agent?.id || agent?._id || agent?.agentId } }));
          }}>
            Message instantané intégré
          </button>
        </div>

        <div className="call-videos">
          <video ref={localVideoRef} autoPlay playsInline muted style={{display:'none'}} />
          <audio ref={remoteVideoRef} autoPlay playsInline />
        </div>

        {/* Messenger is opened globally via event 'ndaku-open-messenger' to avoid nesting modals */}
      </div>
    </div>
  );

  // render modal to document.body to avoid parent transforms/positioning affecting it
  try {
    return createPortal(modal, document.body);
  } catch (e) {
    // fallback if document not available (SSR) or portal fails
    return modal;
  }
};

export default AgentContactModal;
