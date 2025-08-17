import React, { useState } from 'react';
import Messenger from './Messenger';
import './AgentContactModal.css';

const AgentContactModal = ({ agent, open, onClose }) => {
  const [showMessenger, setShowMessenger] = useState(false);
  const [calling, setCalling] = useState(false);

  if (!open) return null;

  const handleCall = () => {
    setCalling(true);
    setTimeout(() => setCalling(false), 3500);
  };

  return (
    <div className="agent-contact-modal-bg">
      <div className="agent-contact-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
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
          <button className="btn btn-outline-success w-100 mb-2" onClick={() => { window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id } } })); }}>
            Appeler (in-app)
          </button>
          <button className="btn btn-outline-primary w-100" onClick={()=>setShowMessenger(true)}>
            Message instantané intégré
          </button>
        </div>
        {calling && (
          <div className="agent-call-simulate">
            <div className="call-avatar">
              <img src={agent.photo} alt={agent.name} />
              <div className="call-wave"><div></div><div></div><div></div></div>
            </div>
            <div className="call-info">
              <div className="fw-bold">Appel en cours...</div>
              <div className="small text-muted">Avec {agent.name}</div>
            </div>
            <div className="call-anim-circle"></div>
          </div>
        )}
        {showMessenger && (
          <Messenger agent={agent} onClose={()=>setShowMessenger(false)} />
        )}
      </div>
    </div>
  );
};

export default AgentContactModal;
