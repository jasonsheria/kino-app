


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
    >
      <div className="agent-card">
        <div className="agent-photo-section">
          <div className="agent-photo-wrapper">
            <img src={agent.photo} alt={agent.name} className="agent-photo" />
            {isCertified && (
              <div className="certified-badge">
                <FaCheckCircle size={24} />
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
          margin-bottom: 1.5rem;
        }

        .agent-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          display: flex;
          padding: 1.5rem;
          gap: 1.5rem;
          transition: all 0.3s ease;
          border: 1px solid rgba(19, 194, 150, 0.1);
        }

        .agent-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(19, 194, 150, 0.15);
          border-color: rgba(19, 194, 150, 0.3);
        }

        .agent-photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .agent-photo-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .agent-photo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #13c296;
          box-shadow: 0 5px 15px rgba(19, 194, 150, 0.2);
          transition: transform 0.3s ease;
        }

        .agent-card:hover .agent-photo {
          transform: scale(1.05);
        }

        .certified-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: white;
          border-radius: 50%;
          padding: 3px;
          border: 2px solid #13c296;
          color: #13c296;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .rating-stars {
          display: flex;
          gap: 2px;
        }

        .star {
          color: #ffc107;
          transition: transform 0.2s ease;
        }

        .star.filled {
          transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
        }

        .agent-info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .agent-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .agent-name h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
        }

        .certified-icon {
          color: #13c296;
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: rgba(19, 194, 150, 0.1);
          color: #13c296;
        }

        .status-badge.inactive {
          background: rgba(160, 174, 192, 0.1);
          color: #a0aec0;
        }

        .agent-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #718096;
          font-size: 0.9rem;
        }

        .contact-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .contact-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 0.9rem;
        }

        .contact-btn:hover {
          transform: translateY(-2px);
          background: rgba(19, 194, 150, 0.1);
          color: #13c296;
        }

        .btn-label {
          display: none;
        }

        .contact-btn:hover .btn-label {
          display: inline;
        }

        @media (max-width: 768px) {
          .agent-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 1rem;
          }

          .agent-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .contact-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .agent-location {
            justify-content: center;
          }
        }
      `}</style>

      {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
    </div>
  );
};

export default AgentCard;
