import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agents } from '../../data/fakedata';
import AgentContactModal from '../common/AgentContactModal';
import { FaWhatsapp } from 'react-icons/fa';
import { FaCar, FaTachometerAlt, FaPalette, FaCalendarAlt, FaGasPump, FaCogs, FaUserTie, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

const VehicleCard = ({ vehicle }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const agent = agents.find(a => a.id === vehicle.agentId);
  const nextImg = () => setImgIdx((imgIdx + 1) % vehicle.images.length);
  const prevImg = () => setImgIdx((imgIdx - 1 + vehicle.images.length) % vehicle.images.length);
  const [showContact, setShowContact] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="card shadow-lg border-0 mb-4 vehicle-card animate__animated animate__fadeInUp" style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(120deg, #f8f9fa 60%, #e9f7f3 100%)', minHeight: 160 }}>
      <div className="position-relative">
        <img
          src={vehicle.images[imgIdx]}
          alt={vehicle.name}
          className="card-img-top animate__animated animate__zoomIn"
          style={{ height: 180, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18, cursor: 'pointer', transition: 'transform .4s' }}
          onClick={nextImg}
        />
        {vehicle.images.length > 1 && (
          <>
            <button className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-2 shadow" style={{zIndex:2}} onClick={prevImg}><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-2 shadow" style={{zIndex:2}} onClick={nextImg}><i className="bi bi-chevron-right"></i></button>
          </>
        )}
        <span className="badge bg-success position-absolute top-0 end-0 m-2 fs-6 shadow">{vehicle.type}</span>
        <span className="badge bg-primary position-absolute top-0 start-0 m-2 fs-6 shadow">{vehicle.status}</span>
      </div>
      <div className="card-body">
        <h6 className="card-title fw-bold text-primary mb-1">{vehicle.name}</h6>
        <div className="mb-2 text-muted small d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> {vehicle.address}</div>
        <div className="mb-2">
          <span className="d-block fs-6 text-dark mb-1" style={{ fontWeight: 500 }}>
            <FaCar className="me-2 text-success" style={{ fontSize: 22 }} />
            <span className="fs-5 text-success fw-bold">{vehicle.price.toLocaleString()} $</span>
          </span>
          <span className="text-secondary small">{vehicle.description}</span>
        </div>
        <div className="mb-2 d-flex flex-wrap gap-2 align-items-center justify-content-start">
          <span className="badge bg-light text-dark border me-1" title="Couleur"><FaPalette className="me-1 text-primary" /> {vehicle.couleur}</span>
          <span className="badge bg-light text-dark border me-1" title="Kilométrage"><FaTachometerAlt className="me-1 text-info" /> {vehicle.kilometrage} km</span>
          <span className="badge bg-light text-dark border me-1" title="Année"><FaCalendarAlt className="me-1 text-warning" /> {vehicle.annee}</span>
          <span className="badge bg-light text-dark border me-1" title="Carburant"><FaGasPump className="me-1 text-success" /> {vehicle.carburant}</span>
          <span className="badge bg-light text-dark border me-1" title="Transmission"><FaCogs className="me-1 text-danger" /> {vehicle.transmission}</span>
          <span className="badge bg-light text-dark border me-1" title="Places"><FaUsers className="me-1 text-secondary" /> {vehicle.places}</span>
        </div>
  {agent && (
          <div className="d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s" style={{ boxShadow: '0 2px 8px #0001' }}>
            <img src={agent.photo} alt={agent.name} className="rounded-circle me-2 border" style={{ width: 38, height: 38, objectFit: 'cover', border: '2px solid #13c296' }} />
            <div className="flex-grow-1">
              <div className="fw-semibold text-success small">{agent.name}</div>
              <div className="small text-muted">{agent.phone}</div>
            </div>
            <button className="btns btn-outline-dark btn-sm ms-2" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, vehicleId: vehicle.id } } }))}><FaUserTie /></button>
            <button className="btns btn-success btn-sm ms-2" title="WhatsApp" onClick={()=>setShowContact(true)}><FaWhatsapp /></button>
            {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
          </div>
        )}
        {/* Bouton Visiter (comme pour les biens immobiliers) */}
        <div className="d-flex justify-content-end mt-3">
          <button className="btns btn-outline-primary btn-sm px-3 fw-bold" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
            Visiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
