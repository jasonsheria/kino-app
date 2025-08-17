


import React from 'react';
import { FaCheckCircle, FaStar, FaRegStar, FaUserShield, FaMapMarkerAlt, FaWhatsapp, FaFacebook, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';



const AgentCard = ({ agent }) => {
  const isCertified = agent.subscription && agent.subscription.toLowerCase() === 'pro';
  const rating = isCertified ? 5 : 4;
  const [showContact, setShowContact] = React.useState(false);
  return (
    <div className="card shadow-lg border-0 mb-4 agent-card animate__animated animate__fadeInUp" style={{ borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(120deg, #f8f9fa 60%, #e9f7f3 100%)', minHeight: 160 }}>
      <div className="row g-0 align-items-center" style={{ minHeight: 160 }}>
        <div className="col-4 d-flex flex-column align-items-center justify-content-center position-relative py-3">
          <div className="position-relative" style={{ zIndex: 2 }}>
            <img src={agent.photo} alt={agent.name} className="img-fluid rounded-circle border agent-photo shadow-lg" style={{ width: 82, height: 82, objectFit: 'cover', border: '4px solid #13c296', boxShadow: '0 4px 24px #13c29633' }} />
            {isCertified && (
              <FaCheckCircle className="position-absolute bottom-0 end-0 translate-middle text-success bg-white rounded-circle" size={26} style={{ border: '2px solid #fff', boxShadow: '0 1px 4px #0002', right: -6, bottom: -6 }} title="Agent certifié" />
            )}
          </div>
          <div className="d-flex align-items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => i < rating ? <FaStar key={i} className="text-warning" size={15} /> : <FaRegStar key={i} className="text-warning" size={15} />)}
          </div>
        </div>
        <div className="col-8">
          <div className="card-body py-2 px-3">
            <div className="d-flex align-items-center mb-1 gap-2">
              <h6 className="card-title fw-bold text-success mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
                {isCertified && <FaUserShield className="text-success" title="Agent certifié" />} {agent.name}
              </h6>
              <span className={`badge rounded-pill ${agent.status === 'Actif' ? 'bg-success' : 'bg-secondary'}`}>{agent.status}</span>
            </div>
            <div className="small text-muted mb-2 d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> {agent.address}</div>
            <div className="d-flex align-items-center gap-3 mt-2">
              <button className="text-decoration-none text-dark d-flex align-items-center justify-content-center btn btn-link p-0" title="Appeler" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, agentName: agent.name } } }))}>
                <FaPhoneAlt className="text-success" size={20} />
              </button>
              <button className="btn btn-link p-0 m-0 text-success d-flex align-items-center justify-content-center" style={{fontSize:20}} title="WhatsApp" onClick={()=>setShowContact(true)}>
                <FaWhatsapp size={20} />
              </button>
              <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none d-flex align-items-center justify-content-center" title="Facebook">
                <FaFacebook size={20} />
              </a>
              <a href={`mailto:${agent.email}`} className="text-decoration-none text-dark d-flex align-items-center justify-content-center" title="Email">
                <FaEnvelope className="text-success" size={20} />
              </a>
              {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
