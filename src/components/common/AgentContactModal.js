import React, { useState, useRef, useEffect } from 'react';
import Messenger from './Messenger';
import './AgentContactModal.css';

// Basic in-app WebRTC UI (loopback for demo) — no signaling server included.
const AgentContactModal = ({ agent, open, onClose }) => {
  const [showMessenger, setShowMessenger] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

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

  const startCall = async () => {
    try {
      setIsCalling(true);
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

  return (
    <div className="agent-contact-modal-bg">
      <div className="agent-contact-modal">
        <button className="close-btn" onClick={() => { stopCall(); onClose(); }}>&times;</button>
        <div className="agent-contact-header">
          <img src={agent.photo} alt={agent.name} className="agent-avatar" />
          <div>
            <div className="fw-bold text-success" style={{fontSize:'1.1rem'}}>{agent.name}</div>
            <div className="small text-muted">Agent immobilier</div>
          </div>
        </div>

        <div className="agent-contact-actions">
          <a
            href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, '')}?text=Bonjour,%20je%20suis%20intéressé(e)%20par%20vos%20services`}
            target="_blank" rel="noopener noreferrer"
            className="btn btn-success w-100 mb-2"
          >
            Message WhatsApp
          </a>

          <div className="webrtc-controls mb-2">
            {!isCalling ? (
              <button className="btn btn-outline-success w-100" onClick={() => { startCall(); window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id } } })); }}>
                Démarrer l'appel (in-app)
              </button>
            ) : (
              <div className="call-panel">
                <div className="call-info-left">
                  <div className="fw-bold">En appel</div>
                  <div className="small text-muted">Avec {agent.name} • {formatTime(callTime)}</div>
                </div>
                <div className="call-controls">
                  <button className={`btn ${micEnabled ? 'btn-warning' : 'btn-secondary'} me-2`} onClick={toggleMic}>{micEnabled ? 'Micro ON' : 'Micro OFF'}</button>
                  <button className="btn btn-danger" onClick={stopCall}>Raccrocher</button>
                </div>
              </div>
            )}
          </div>

          <button className="btn btn-outline-primary w-100" onClick={()=>setShowMessenger(true)}>
            Message instantané intégré
          </button>
        </div>

        <div className="call-videos">
          <video ref={localVideoRef} autoPlay playsInline muted style={{display:'none'}} />
          <audio ref={remoteVideoRef} autoPlay playsInline />
        </div>

        {showMessenger && (
          <Messenger agent={agent} onClose={()=>setShowMessenger(false)} />
        )}
      </div>
    </div>
  );
};

export default AgentContactModal;
