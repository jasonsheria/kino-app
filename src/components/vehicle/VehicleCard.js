import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agents } from '../../data/fakedata';
import AgentContactModal from '../common/AgentContactModal';
import VisitBookingModal from '../common/VisitBookingModal';
import '../property/PropertyCard.css';
import { FaWhatsapp } from 'react-icons/fa';
import { FaCar, FaTachometerAlt, FaPalette, FaCalendarAlt, FaGasPump, FaCogs, FaUserTie, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

const VehicleCard = ({ vehicle }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const agent = agents.find(a => String(a.id) === String(vehicle?.agentId));
  const imgs = Array.isArray(vehicle?.images) && vehicle.images.length ? vehicle.images : [''];
  const nextImg = () => setImgIdx((imgIdx + 1) % imgs.length);
  const prevImg = () => setImgIdx((imgIdx - 1 + imgs.length) % imgs.length);
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [isReserved, setIsReserved] = useState(() => {
    try {
      const raw = localStorage.getItem('reserved_properties') || '[]';
      const list = JSON.parse(raw).map(String);
      return list.includes(String(vehicle._id));
    } catch (e) { return false }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const reservedId = e?.detail?.propertyId ?? e?.detail?.property_id ?? e?.detail?.id ?? null;
      const idsToCheck = [vehicle.id, vehicle._id].filter(Boolean).map(String);
      if (reservedId && idsToCheck.includes(String(reservedId))) setIsReserved(true);
    };
    console.log('VehicleCard mounted for vehicle', vehicle);
    const storageHandler = (e) => {
      if (e.key === 'reserved_properties') {
        try {
          const reserved = JSON.parse(e.newValue || '[]').map(String);
          const idsToCheck = [vehicle.id, vehicle._id].filter(Boolean).map(String);
          if (idsToCheck.some(id => reserved.includes(id))) setIsReserved(true);
        } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('property-reserved', handler);
    window.addEventListener('storage', storageHandler);
    return () => { window.removeEventListener('property-reserved', handler); window.removeEventListener('storage', storageHandler); };
  }, [vehicle._id]);
  function tronquerTexte(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  return (
    <div className="card shadow-lg border-0 mb-4 vehicle-card animate__animated animate__fadeInUp" style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(120deg, rgba(19,194,150,0.03) 40%, rgba(25,118,210,0.03) 100%)', minHeight: 160 }}>
      <div className="position-relative">
        <img
          src={imgs[imgIdx]}
          alt={vehicle?.name || vehicle?.title || ''}
          className="card-img-top animate__animated animate__zoomIn"
          style={{ height: 270, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18, cursor: 'pointer', transition: 'transform .4s' }}
          onClick={nextImg}
        />
        {imgs.length > 1 && (
          <>
            <button className="btns btn-light position-absolute top-50 start-0 translate-middle-y ms-2 shadow" style={{ zIndex: 2 }} onClick={prevImg}><i className="bi bi-chevron-left"></i></button>
            <button className="btns btn-light position-absolute top-50 end-0 translate-middle-y me-2 shadow" style={{ zIndex: 2 }} onClick={nextImg}><i className="bi bi-chevron-right"></i></button>
          </>
        )}
        <span className="badge position-absolute top-0 end-0 m-2 fs-6 shadow" style={{ background: 'var(--ndaku-primary)', color: '#fff' }}>{vehicle?.type}</span>
        <span className="badge position-absolute top-0 start-0 m-2 fs-6 shadow" style={{ background: '#1976d2', color: '#fff' }}>{vehicle?.statut}</span>
        <span className="d-block fs-6 text-dark mb-1" style={{ fontWeight: 500, position: 'absolute', marginTop:" -50px", background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: 8, zIndex: 100, marginLeft: 12 }}>
          <FaCar className="me-2 text-success" style={{ fontSize: 22 }} />
          <span className="fs-5 text-success fw-bold">{(Number(vehicle?.price || vehicle?.prix || 0)).toLocaleString()} $</span>
        </span>
      </div>
      <div className="card-body" onClick={() => navigate(`/properties/${vehicle._id}`)} style={{ cursor: 'pointer', paddingBottom:0}}>
        <div className="d-flex justify-content-between align-items-center mb-2">

          <h6 className="card-title fw-bold text-primary mb-1">{tronquerTexte(vehicle.titre, 25)}</h6>
          <div className="mb-2 text-muted small d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> {vehicle.adresse}</div>
        </div>
        <div className="mb-2">

          <span className="text-secondary small">{ tronquerTexte((vehicle?.description), 40) }</span>
        </div>
        <div className="mb-2 d-flex flex-wrap gap-2 align-items-center justify-content-start">
          <span className="badge bg-light text-dark border me-1" title="Couleur"><FaPalette className="me-1 text-primary" /> {vehicle?.couleur}</span>
          <span className="badge bg-light text-dark border me-1" title="Kilométrage"><FaTachometerAlt className="me-1 text-info" /> {vehicle?.kilometrage ?? ''} {vehicle?.kilometrage ? 'km' : ''}</span>
          <span className="badge bg-light text-dark border me-1" title="Année"><FaCalendarAlt className="me-1 text-warning" /> {vehicle?.annee ?? ''}</span>
          <span className="badge bg-light text-dark border me-1" title="Carburant"><FaGasPump className="me-1 text-success" /> {vehicle?.carburant}</span>
          <span className="badge bg-light text-dark border me-1" title="Transmission"><FaCogs className="me-1 text-danger" /> {vehicle?.transmission}</span>
          <span className="badge bg-light text-dark border me-1" title="Places"><FaUsers className="me-1 text-secondary" /> {vehicle?.places ?? ''}</span>
        </div>
        {/* <div className="d-flex justify-content-end mt-3">
          <button className="btns btn-outline-primary btn-sm px-3 fw-bold" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
            Visiter
          </button> */}
        {/* </div> */}

        {/* Bouton Visiter (comme pour les biens immobiliers) */}

      </div>
      {agent && (
        <div className="property-agent d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s">
          <div className="property-agent-inner">
            <div className="agent-left">
              <div className="agent-avatar-wrapper" style={{ filter: isReserved ? 'none' : 'blur(4px) grayscale(.15)', transition: 'filter .32s ease' }}>
                <img src={agent.photo} alt={agent.name} className="agent-thumb" />
              </div>
              <div className="agent-meta">
                <div className="fw-semibold small agent-name" style={{ color: isReserved ? 'var(--ndaku-primary)' : 'rgba(0,0,0,0.6)' }}>{agent.name}</div>
                <div className="small text-muted agent-phone" style={{ filter: isReserved ? 'none' : 'blur(3px)' }}>{isReserved ? agent.phone : '••• ••• •••'}</div>
              </div>
            </div>
            <div className="agent-right">
              {!isReserved ? (
                <div className="agent-action-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--ndaku-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="var(--ndaku-primary)" d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>
                  </div>
                  <button className="btns btn-primary reserve-btn" title="Réserver" onClick={() => setShowBooking(true)}>Réserver</button>
                </div>
              ) : (
                <div className="agent-contact-buttons">
                  <button className="btns btn-outline-dark contact-icon" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, vehicleId: vehicle.id } } }))}><FaUserTie /></button>
                  <button className="btns btn-success contact-icon" title="WhatsApp" onClick={() => setShowContact(true)}><FaWhatsapp /></button>
                  {showContact && <AgentContactModal agent={agent} open={showContact} onClose={() => setShowContact(false)} />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showBooking && (
        <VisitBookingModal
          open={showBooking}
          onClose={() => setShowBooking(false)}
          property={vehicle}
          agent={agent}
          onSuccess={(data) => { setIsReserved(true); setShowBooking(false); }}
        />
      )}
    </div>
  );
};

export default VehicleCard;
