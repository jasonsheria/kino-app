



import React, { useState, useEffect } from 'react';
import { showToast } from '../common/ToastManager';
import { agents, properties } from '../../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';
import './PropertyCard.css';
import VisitBookingModal from '../common/VisitBookingModal';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const PropertyCard = ({ property, showActions: propShowActions }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const agent = agents.find(a => a.id === property.agentId);
  const location = useLocation();
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [isReserved, setIsReserved] = useState(() => {
    try {
  const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
  return reserved.includes(String(property.id)) || Boolean(property.isReserved);
    } catch (e) {
      return Boolean(property.isReserved);
    }
  });

  useEffect(() => {
    console.log(`PropertyCard mounted for ${property.id} - initial isReserved:`, isReserved);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const reservedId = e?.detail?.propertyId;
      if (String(reservedId) === String(property.id)) {
        console.log('PropertyCard received property-reserved event for', reservedId);
        setIsReserved(true);
      }
    };
    window.addEventListener('property-reserved', handler);
    const storageHandler = (e) => {
      if (e.key === 'reserved_properties') {
        try {
          const reserved = JSON.parse(e.newValue || '[]').map(String);
          if (reserved.includes(String(property.id))) setIsReserved(true);
        } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('property-reserved', handler);
    // cleanup storage listener too
    return () => {
      window.removeEventListener('property-reserved', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [property.id]);
  const navigate = useNavigate();

  // determine whether to show edit/delete action buttons:
  // Priority: explicit prop -> role-based (preferred) -> fallback to route-based
  const role = user?.role || user?.domaine || null;
  const isPrivileged = /^\s*(owner|agency|admin|superadmin)\s*$/i.test(role);
  const showActions = Boolean(propShowActions) || isPrivileged || /\/owner|\/dashboard|\/agency|\/admin/i.test(location.pathname);

  const handleReservationSuccess = () => {
  console.log('Reservation success callback received for property', property.id);
  setIsReserved(true);
  setShowBooking(false);
    // Optionnel: Mettre à jour le statut dans le localStorage pour persistance
    try {
      const reservedProperties = JSON.parse(localStorage.getItem('reserved_properties') || '[]');
      if (!reservedProperties.includes(property.id)) {
        reservedProperties.push(property.id);
        localStorage.setItem('reserved_properties', JSON.stringify(reservedProperties));
      }
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du statut de réservation:', e);
    }
  showToast('Visite réservée — contact agent disponible', 'success');
  };

  // safe images array (fallback to property.image or a bundled placeholder)
  const imgs = Array.isArray(property.images) && property.images.length
    ? property.images
    : (property.image ? [property.image] : [require('../../img/property-1.jpg')]);
  const displayName = property.name || property.title || 'Bien immobilier';

  // Suggestions (autres biens, exclure le courant)
  const suggestions = properties.filter(p => p.id !== property.id).slice(0, 3);

  // Custom marker icons
  const redIcon = new L.Icon({
    iconUrl: require('../../img/leaflet/marker-icon-2x-red.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('../../img/leaflet/marker-shadow.png'),
    shadowSize: [41, 41]
  });
  const blueIcon = new L.Icon({
      iconUrl: require('../../img/leaflet/marker-icon-2x-blue.png'),
  shadowUrl: require('../../img/leaflet/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setShowLightbox(true);
  };
  const closeLightbox = () => setShowLightbox(false);
  const nextImg = () => { const l = imgs.length || 1; setLightboxIndex((lightboxIndex + 1) % l); };
  const prevImg = () => { const l = imgs.length || 1; setLightboxIndex((lightboxIndex - 1 + l) % l); };

  // Pour la map, on prend la géoloc de l'agent (sinon défaut Kinshasa)
  const mainPos = agent?.geoloc || { lat: -4.325, lng: 15.322 };

  return (
    <div className="card shadow-lg border-0 mb-4 property-card fixed-size animate__animated animate__fadeInUp" style={{borderRadius:14, overflow:'hidden', transition:'box-shadow .3s'}}>
      <div className="property-image" onClick={() => imgs.length && openLightbox(0)} role="button">
        <img src={imgs[0]} alt={displayName} className="property-img" />
        <div className="image-overlay" />
        <div className="badges">
          <div className="badge status-badge">{property.status || ''}</div>
          <div className="badge type-badge">{property.type || ''}</div>
        </div>
        <div className="price-badge">{new Intl.NumberFormat().format(property.price || 0)} $</div>
        {showActions && (
          <div className="card-actions">
            <button className="action-btn" title="Edit"><FaEdit /></button>
            <button className="action-btn danger" title="Delete"><FaTrash /></button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="title-row">
          <h6 className="card-title mb-0">{displayName}</h6>
          <div className="meta-location small text-muted"><FaMapMarkerAlt className="me-1"/>{property.address}</div>
        </div>
        <p className="card-desc text-secondary small">{property.description}</p>
        <div className="features-row">
          {(property.chambres || property.douches || property.salon || property.cuisine) && (
            <>
              <div className="feature"><FaBed /> <span>{property.chambres || 0}</span></div>
              <div className="feature"><FaShower /> <span>{property.douches || 0}</span></div>
              <div className="feature"><FaCouch /> <span>{property.salon || 0}</span></div>
              <div className="feature"><FaUtensils /> <span>{property.cuisine || 0}</span></div>
            </>
          )}
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button className="btns btn-primary btn-sm fw-bold" onClick={() => navigate(`/properties/${property.id}`)}>Voir le bien</button>
        </div>
        {/* Agent lié */}
        {agent && (
          <div className="property-agent d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s">
            <div className="property-agent-inner">
              <div className="agent-left">
                <div className="agent-avatar-wrapper">
                  <img src={agent.photo} alt={agent.name} className="agent-thumb" />
                </div>
                <div className="agent-meta">
                  <div className="agent-name fw-semibold small">{agent.name}</div>
                  <div className="agent-phone small text-muted">{agent.phone}</div>
                </div>
              </div>
              <div className="agent-right">
                {!isReserved ? (
                  <div className="agent-action-wrap">
                    <button 
                      className="btns btn-primary reserve-btn"
                      title="Réserver une visite"
                      onClick={()=>setShowBooking(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7.5M19 21v-6m-3 3h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Réserver une visite
                    </button>
                  </div>
                ) : (
                  <div className="agent-contact-buttons">
                    <span className="badge bg-success reserve-badge">Réservé</span>
                    <button className="btns btn-outline-success ms-2 contact-icon" title="WhatsApp" onClick={()=>setShowContact(true)}><FaWhatsapp /></button>
                    {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
                    <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="btns btn-outline-primary ms-2 contact-icon" title="Facebook"><FaFacebook /></a>
                    <button className="btns btn-outline-dark ms-2 contact-icon" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, propertyId: property.id } } }))}><FaPhone /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      {showBooking && <VisitBookingModal open={showBooking} onClose={()=>setShowBooking(false)} onSuccess={handleReservationSuccess} agent={agent} property={property} />}
      </div>
      {/* Lightbox */}
      {showLightbox && imgs.length > 0 && (
        <div className="lightbox position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate__animated animate__fadeIn" style={{background:'rgba(0,0,0,0.8)',zIndex:2000}}>
          <button className="btns btn-light position-absolute top-0 end-0 m-3" onClick={closeLightbox}>&times;</button>
          <button className="btns btn-light position-absolute start-0 top-50 translate-middle-y ms-3" onClick={prevImg}><i className="bi bi-chevron-left"></i></button>
          <img src={imgs[lightboxIndex % imgs.length]} alt="" style={{maxHeight:'80vh', maxWidth:'90vw', borderRadius:8, boxShadow:'0 4px 32px #0008'}} />
          <button className="btns btn-light position-absolute end-0 top-50 translate-middle-y me-3" onClick={nextImg}><i className="bi bi-chevron-right"></i></button>
        </div>
      )}

  {/* ...aucune carte ni suggestions ici, à déplacer dans PropertyDetails... */}
    </div>
  );
};

export default PropertyCard;
