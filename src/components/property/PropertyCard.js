



import React, { useState, useEffect } from 'react';
import { showToast } from '../common/ToastManager';
import { agents, properties } from '../../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';
import './PropertyCard.css';
import VisitBookingModal from '../common/VisitBookingModal';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const PropertyCard = ({ property }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const agent = agents.find(a => a.id === property.agentId);
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
    <div className="card shadow-lg border-0 mb-4 property-card animate__animated animate__fadeInUp" style={{borderRadius:18, overflow:'hidden', transition:'box-shadow .3s'}}>
      <div className="position-relative">
          <img
          src={imgs[0]}
          alt={displayName}
          className="card-img-top property-img animate__animated animate__zoomIn"
          style={{height: 200, objectFit: 'cover', cursor: 'pointer', borderTopLeftRadius:18, borderTopRightRadius:18, transition:'transform .4s'}}
          onClick={() => imgs.length && openLightbox(0)}
        />
  <span className="badge position-absolute top-0 end-0 m-2 fs-6 shadow" style={{background:'var(--ndaku-primary)', color:'#fff'}}>{property.type}</span>
  <span className="badge position-absolute top-0 start-0 m-2 fs-6 shadow" style={{background:'#1976d2', color:'#fff'}}>{property.status}</span>
      </div>
      <div className="card-body">
  <h6 className="card-title fw-bold text-primary mb-1">{displayName}</h6>
        <div className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1"></i> {property.address}</div>
        <div className="mb-2">
            <span className="d-block fs-6 text-dark mb-1" style={{fontWeight:500}}>
            <FaRegMoneyBillAlt className="me-2 text-success" style={{fontSize:22}}/>
            <span className="fs-5 text-success fw-bold">{(property.price || 0).toLocaleString()} $</span>
          </span>
          <span className="text-secondary small">{property.description}</span>
        </div>
        {/* Spécificités pour Appartement, Studio, Maison */}
  {(property.type === 'Appartement' || property.type === 'Studio' || property.type === 'Maison') && (
          <div className="mb-2 d-flex flex-wrap gap-3 align-items-center justify-content-start">
            <span title="Chambres" className="badge bg-light text-dark border me-1"><FaBed className="me-1 text-primary"/> {property.chambres}</span>
            <span title="Douches" className="badge bg-light text-dark border me-1"><FaShower className="me-1 text-info"/> {property.douches}</span>
            <span title="Salon" className="badge bg-light text-dark border me-1"><FaCouch className="me-1 text-warning"/> {property.salon}</span>
            <span title="Cuisine" className="badge bg-light text-dark border me-1"><FaUtensils className="me-1 text-success"/> {property.cuisine}</span>
            <span title="Salle de bain" className="badge bg-light text-dark border"><FaBath className="me-1 text-danger"/> {property.sdb}</span>
          </div>
        )}
        {/* Bouton Voir plus */}
        <div className="d-flex justify-content-end mb-2">
          <button className="btns btn-outline-primary btn-sm px-3 fw-bold" onClick={() => navigate(`/properties/${property.id}`)}>
            Visiter <FaMapMarkerAlt className="ms-1"/>
          </button>
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
