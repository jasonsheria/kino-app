
import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { FaPhoneAlt, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVolumeUp, FaVolumeDown } from 'react-icons/fa';
import './CallModal.css';


const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Sonnerie d'appel (ringtone) — son simple intégré (data URI ou lien public)
const RINGTONE_URL =
  'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5b2.mp3'; // libre de droits, court


export default function CallModal({ open, onClose, agent, status = 'connecting', onHangup, onMute, muted, onVolume, volume = 1 }) {
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef();
  const audioRef = useRef();

  // Timer d'appel (affiché seulement en "in-call")
  useEffect(() => {
    if (open && status === 'in-call') {
      timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [open, status]);

  // Sonnerie d'appel (ringtone) tant que "connecting"
  useEffect(() => {
    if (open && status === 'connecting') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.7;
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [open, status]);

  return (
    <Modal open={open} onClose={onClose}>
      {/* Sonnerie d'appel WebRTC simulée (invisible) */}
      <audio ref={audioRef} src={RINGTONE_URL} preload="auto" style={{ display: 'none' }} />
      <div className={`call-modal ${status}`}>
        <div className="call-modal-avatar">
          <img src={agent?.image || require('../../img/header.jpg')} alt={agent?.name || 'Agent'} />
        </div>
        <div className="call-modal-info">
          <div className="call-modal-name">{agent?.prenom || agent?.name || 'Agent inconnu'}</div>
          <div className="call-modal-company">{agent?.company || ''}</div>
          <div className="call-modal-status">
            {status === 'connecting' && <span className="call-anim">Connexion... <span style={{fontSize:'1.1em',color:'var(--ndaku-primary)',marginLeft:8}}>&#128222;</span></span>}
            {status === 'in-call' && <span>En appel</span>}
            {status === 'ended' && <span>Appel terminé</span>}
            {status === 'error' && <span>Erreur d'appel</span>}
          </div>
          {status === 'in-call' && <div className="call-modal-timer">{formatTime(callTime)}</div>}
        </div>
        <div className="call-modal-controls">
          <button className={`call-btn ${muted ? 'active' : ''}`} title={muted ? 'Activer le micro' : 'Couper le micro'} onClick={onMute}>
            {muted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button className="call-btn" title="Volume -" onClick={() => onVolume && onVolume(Math.max(0, volume - 0.1))}><FaVolumeDown /></button>
          <button className="call-btn" title="Volume +" onClick={() => onVolume && onVolume(Math.min(1, volume + 0.1))}><FaVolumeUp /></button>
          <button className="call-btn hangup" title="Raccrocher" onClick={onHangup}><FaPhoneSlash /></button>
        </div>
      </div>
    </Modal>
  );
}
