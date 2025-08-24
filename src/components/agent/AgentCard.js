


import React from 'react';
import { FaCheckCircle, FaStar, FaRegStar, FaUserShield, FaMapMarkerAlt, FaWhatsapp, FaFacebook, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';



const AgentCard = ({ agent }) => {
  const isCertified = agent.subscription && agent.subscription.toLowerCase() === 'pro';
  const rating = isCertified ? 5 : 4;
  const [showContact, setShowContact] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="agent-card-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: '100%', height: '100%' }}
    >
      <div className="agent-card">
        <div className="agent-photo-section">
          <div className="agent-photo-wrapper">
            <img src={agent.photo} alt={agent.name} className="agent-photo" />
            {isCertified && (
              <div className="certified-badge">
                <FaCheckCircle size={18} />
              </div>
            )}
          </div>
          <div className="rating-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
                {i < rating ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>
        </div>

        <div className="agent-info-section">
          <div className="agent-header">
            <div className="agent-name">
              {isCertified && <FaUserShield className="certified-icon" title="Agent certifié" />}
              <h3>{agent.name}</h3>
            </div>
            <span className={`status-badge ${agent.status === 'Actif' ? 'active' : 'inactive'}`}>
              {agent.status}
            </span>
          </div>

          <div className="agent-location">
            <FaMapMarkerAlt />
            <span>{agent.address}</span>
          </div>

          <div className="contact-buttons">
            <button 
              className="contact-btn call"
              onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { 
                detail: { to: 'support', meta: { agentId: agent.id, agentName: agent.name } } 
              }))}
            >
              <FaPhoneAlt />
              <span className="btn-label">Appeler</span>
            </button>
            <button 
              className="contact-btn whatsapp"
              onClick={() => setShowContact(true)}
            >
              <FaWhatsapp />
              <span className="btn-label">WhatsApp</span>
            </button>
            <a 
              href={agent.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn facebook"
            >
              <FaFacebook />
              <span className="btn-label">Facebook</span>
            </a>
            <a 
              href={`mailto:${agent.email}`}
              className="contact-btn email"
            >
              <FaEnvelope />
              <span className="btn-label">Email</span>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .agent-card-container {
          perspective: 1000px;
          height: 100%;
        }

        .agent-card {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          padding: 0;
          gap: 1rem;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: none;
          align-items: flex-start;
          height: 100%;
        }

        .agent-card:hover {
          transform: translateY(-4px);
        }

        .agent-photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 92px;
          flex: 0 0 92px;
        }

        .agent-photo-wrapper {
          position: relative;
          width: 72px;
          height: 72px;
        }

        .agent-photo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(0,0,0,0.06);
          transition: transform 0.25s ease;
        }

        .agent-card:hover .agent-photo {
          transform: scale(1.03);
        }

        .certified-badge {
          position: absolute;
          bottom: -6px;
          right: -6px;
          background: white;
          border-radius: 50%;
          padding: 3px;
          border: 1px solid rgba(0,0,0,0.06);
        }

        .rating-stars { display:flex; gap:4px; }

        .star { color: #ffc107; }

        .agent-info-section {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }

        .agent-header { display:flex; justify-content:space-between; align-items:center; }

        .agent-name { display:flex; align-items:center; gap:0.5rem; }

        .agent-name h3 { margin:0; font-size:1rem; font-weight:600; color: #2d3748; }

  .certified-icon { color: var(--ndaku-primary); font-size:1rem; }

        .status-badge { padding: 0.25rem 0.5rem; border-radius: 0; font-size:0.85rem; font-weight:500; }

  .status-badge.active { background: var(--ndaku-primary-100); color: var(--ndaku-primary); }
        .status-badge.inactive { background: rgba(160,174,192,0.06); color:#a0aec0; }

        .agent-location { display:flex; align-items:center; gap:0.5rem; color:#718096; font-size:0.9rem; }

        .contact-buttons { display:flex; gap:0.5rem; margin-top:auto; }

        .contact-btn { display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0.6rem; border:none; border-radius:0; background:transparent; color:#4a5568; cursor:pointer; font-size:0.85rem; }

  .contact-btn:hover { transform:translateY(-2px); color:var(--ndaku-primary); }

        .btn-label { display:none; }

        .contact-btn:hover .btn-label { display:inline; }

        @media (max-width: 768px) {
          .agent-card { flex-direction: row; padding: 0.5rem 0; }
          .agent-photo-section { width: 72px; }
          .agent-info-section { gap: 0.25rem; }
          .contact-buttons { justify-content:flex-end; }
        }
      `}</style>

      {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
    </div>
  );
};

export default AgentCard;
