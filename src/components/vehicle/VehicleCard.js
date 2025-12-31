import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agents } from '../../data/fakedata';
import AgentContactModal from '../common/AgentContactModal';
import VisitBookingModal from '../common/VisitBookingModal';
import '../property/PropertyCard.css';
import { 
  FaWhatsapp, FaCar, FaTachometerAlt, FaPalette, 
  FaCalendarAlt, FaGasPump, FaCogs, FaUserTie, 
  FaMapMarkerAlt, FaUsers 
} from 'react-icons/fa';
import img from '../../assets/images/user-ecommerce-icon-fill-style-png.png';

const VehicleCard = ({ vehicle }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  // Sécurité pour l'agent
  const agent = agents.find(a => String(a.id || a._id) === String(vehicle?.agentId));
  
  // Sécurité pour les images
  const imgs = Array.isArray(vehicle?.images) && vehicle.images.length 
    ? vehicle.images.map(i => (typeof i === 'string' ? i : i?.url || ''))
    : [vehicle?.image || ''];

  const nextImg = (e) => { e.stopPropagation(); setImgIdx((imgIdx + 1) % imgs.length); };
  const prevImg = (e) => { e.stopPropagation(); setImgIdx((imgIdx - 1 + imgs.length) % imgs.length); };

  const [isReserved, setIsReserved] = useState(() => {
    try {
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
      return reserved.includes(String(vehicle?._id || vehicle?.id)) || Boolean(vehicle?.isReserved);
    } catch (e) { return Boolean(vehicle?.isReserved); }
  });

  useEffect(() => {
    const handler = (e) => {
      const reservedId = e?.detail?.propertyId ?? e?.detail?.property_id ?? e?.detail?.id ?? null;
      const idsToCheck = [vehicle?.id, vehicle?._id].filter(Boolean).map(String);
      if (reservedId && idsToCheck.includes(String(reservedId))) setIsReserved(true);
    };
    
    window.addEventListener('property-reserved', handler);
    return () => window.removeEventListener('property-reserved', handler);
  }, [vehicle?._id, vehicle?.id]);

  // FONCTION SÉCURISÉE : Garantit le retour d'une string
  const safeStr = (v) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return '';
  };

  const tronquerTexte = (text, maxLength) => {
    const str = safeStr(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  return (
    <div className="card border-0 mb-4 vehicle-card animate__animated animate__fadeInUp" style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(120deg, rgba(19,194,150,0.03) 40%, rgba(25,118,210,0.03) 100%)' }}>
      <div className="position-relative">
        <img
          src={imgs[imgIdx]?.startsWith('blob') ? img : (imgs[imgIdx] || img)}
          alt={safeStr(vehicle?.titre)}
          className="card-img-top"
          style={{ height: 270, objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => navigate(`/properties/${vehicle?._id || vehicle?.id}`)}
        />
        
        {imgs.length > 1 && (
          <div className="image-nav-buttons">
            <button className="btn btn-light btn-sm position-absolute top-50 start-0 translate-middle-y ms-2 shadow-sm" onClick={prevImg}>‹</button>
            <button className="btn btn-light btn-sm position-absolute top-50 end-0 translate-middle-y me-2 shadow-sm" onClick={nextImg}>›</button>
          </div>
        )}

        <span className="badge position-absolute top-0 end-0 m-2 fs-6 shadow-sm" style={{ background: '#0ea5a4', color: '#fff' }}>{safeStr(vehicle?.type)}</span>
        <span className="badge position-absolute top-0 start-0 m-2 fs-6 shadow-sm" style={{ background: '#3b82f6', color: '#fff' }}>{safeStr(vehicle?.statut)}</span>
        
        <div className="price-tag shadow-sm" style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: 8 }}>
          <FaCar className="me-2 text-success" />
          <span className="text-success fw-bold">{(Number(vehicle?.price || vehicle?.prix || 0)).toLocaleString()} $</span>
        </div>
      </div>

      <div className="card-body" onClick={() => navigate(`/properties/${vehicle?._id || vehicle?.id}`)} style={{ cursor: 'pointer' }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title fw-bold text-primary mb-1 text-capitalize">
            {tronquerTexte(vehicle?.titre || vehicle?.name, 25)}
          </h6>
          <div className="text-muted small d-flex align-items-center gap-1">
            <FaMapMarkerAlt className="text-success" /> {tronquerTexte(vehicle?.adresse, 20)}
          </div>
        </div>

        <div className="mb-2 d-flex flex-wrap gap-2">
          <span className="badge bg-light text-dark border"><FaPalette className="me-1 text-primary" /> {safeStr(vehicle?.couleur)}</span>
          <span className="badge bg-light text-dark border"><FaTachometerAlt className="me-1 text-info" /> {vehicle?.kilometrage} km</span>
          <span className="badge bg-light text-dark border"><FaCalendarAlt className="me-1 text-warning" /> {vehicle?.annee}</span>
          <span className="badge bg-light text-dark border"><FaGasPump className="me-1 text-success" /> {safeStr(vehicle?.carburant)}</span>
          <span className="badge bg-light text-dark border"><FaCogs className="me-1 text-danger" /> {safeStr(vehicle?.transmission)}</span>
          <span className="badge bg-light text-dark border"><FaUsers className="me-1 text-secondary" /> {vehicle?.places} pl.</span>
        </div>
      </div>

      {agent && (
        <div className="p-3 bg-light border-top">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <img 
                src={agent.photo || img} 
                alt="agent" 
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', filter: isReserved ? 'none' : 'blur(2px)' }} 
              />
              <div className="ms-2">
                <div className="fw-semibold small" style={{ fontSize: '0.85rem' }}>{agent.name}</div>
                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{isReserved ? agent.phone : 'Numéro masqué'}</div>
              </div>
            </div>

            <div>
              {!isReserved ? (
                <button className="btn btn-primary btn-sm px-3 fw-bold" onClick={(e) => { e.stopPropagation(); setShowBooking(true); }}>
                  Réserver
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); setShowContact(true); }}><FaWhatsapp /></button>
                  <button className="btn btn-outline-dark btn-sm" onClick={(e) => { e.stopPropagation(); window.location.href=`tel:${agent.phone}`; }}><FaUserTie /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBooking && (
        <VisitBookingModal
          open={showBooking}
          onClose={() => setShowBooking(false)}
          property={vehicle}
          agent={agent}
          onSuccess={() => { setIsReserved(true); setShowBooking(false); }}
        />
      )}
      {showContact && <AgentContactModal agent={agent} open={showContact} onClose={() => setShowContact(false)} />}
    </div>
  );
};

export default VehicleCard;