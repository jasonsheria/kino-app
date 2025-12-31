import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { agents, properties } from '../../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaEdit, FaTrash, FaMoneyBill } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';
import VisitBookingModal from '../common/VisitBookingModal';
import './PropertyCard.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { syncReservationsFromServer } from '../../utils/reservationsSync';
import img from '../../assets/images/user-ecommerce-icon-fill-style-png.png';

const PropertyCard = ({ property, showActions: propShowActions, onOpenBooking }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [remoteAgentsLoading, setRemoteAgentsLoading] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  
  const [isReserved, setIsReserved] = useState(() => {
    try {
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
      return reserved.includes(String(property.id || property._id)) || Boolean(property.isReserved);
    } catch (e) { return Boolean(property.isReserved); }
  });

  const [resolvedAgent, setResolvedAgent] = useState(() => {
    if (property && property.agent && typeof property.agent === 'object') return property.agent;
    return null;
  });

  const navigate = useNavigate();

  // Résolution de l'agent
  useEffect(() => {
    const tryResolve = async () => {
        if (resolvedAgent) return;
        if (property && property.agent && typeof property.agent === 'object') {
            setResolvedAgent(property.agent);
            return;
        }
        // Logique de matching simplifiée pour éviter les erreurs
        const propAgentId = String(property?.agent || property?.agentId || '');
        const found = agents.find(a => String(a.id || a._id) === propAgentId);
        if (found) setResolvedAgent(found);
    };
    tryResolve();
  }, [property, resolvedAgent]);

  // Gestion des images sécurisée
  const imgs = React.useMemo(() => {
    if (Array.isArray(property.images) && property.images.length > 0) {
      return property.images.map(i => (typeof i === 'string' ? i : i?.url || ''));
    }
    return [property.image?.url || property.image || require('../../img/property-1.jpg')];
  }, [property.images, property.image]);

  const safeStr = (v) => (typeof v === 'string' ? v : v ? String(v) : '');
  const displayName = safeStr(property.type || property.name || property.title || property.nom) || 'Bien immobilier';

  const openLightbox = (idx) => { setLightboxIndex(idx); setShowLightbox(true); };
  const closeLightbox = () => setShowLightbox(false);

  // Correction de la fonction de troncature (sécurité)
  function tronquerTexte(text, maxLength) {
    const str = safeStr(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  const role = user?.role || user?.domaine || null;
  const isPrivileged = /^\s*(owner|agency|admin|superadmin)\s*$/i.test(role);
  const showActions = Boolean(propShowActions) || isPrivileged || /\/owner|\/dashboard|\/agency|\/admin/i.test(location.pathname);

  return (
    <div className="card mb-4 property-card fixed-size animate__animated animate__fadeInUp" style={{ borderRadius: 14, overflow: 'hidden', minWidth: 280 }}>
      {/* Image Section */}
      <div className="property-image" onClick={() => imgs.length && openLightbox(0)} role="button" style={{ cursor: 'pointer' }}>
        <img src={imgs[0]} alt={displayName} className="property-img" />
        <div className="image-overlay" />
        <div className="badges">
          <div className="badge status-badge">{new Intl.NumberFormat().format(property.prix || property.price || 0)} $</div>
          <div className="badge type-badge">{safeStr(property.type)}</div>
        </div>
        <div className="price-badge">{safeStr(property.statut || property.status)}</div>
        
        {showActions && (
          <div className="card-actions">
            <button className="action-btn" title="Edit"><FaEdit /></button>
            <button className="action-btn danger" title="Delete"><FaTrash /></button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="mt-2 mb-2" onClick={() => navigate(`/properties/${property.id || property._id}`)} style={{ cursor: 'pointer' }}>
        <div className="title-row" style={{ borderBottom: '1px solid #dcdbdb', padding: '10px' }}>
          <h6 className="card-title mb-0">{displayName}</h6>
          <div className="large" style={{ fontSize: '1.1rem', color: '#35353d', fontWeight: 'bold' }}>
            <FaMoneyBill /> : {property.prix || property.price}$
          </div>
        </div>

        {/* FIX: Utilisation de 'property' au lieu de 'properties' pour la condition */}
        {(property.chambres || property.salon || property.douches) ? (
          <div className="features-row" style={{ borderBottom: '1px solid #dcdbdb', padding: '10px', display: 'flex', gap: '15px' }}>
            {property.chambres > 0 && <div className="feature"><FaBed /> <span>{property.chambres}</span></div>}
            {property.douches > 0 && <div className="feature"><FaShower /> <span>{property.douches}</span></div>}
            {property.salon > 0 && <div className="feature"><FaCouch /> <span>{property.salon}</span></div>}
            {property.cuisine > 0 && <div className="feature"><FaUtensils /> <span>{property.cuisine}</span></div>}
          </div>
        ) : null}

        <div className="meta-location small text-muted" style={{ borderBottom: '1px solid #dcdbdb', padding: '10px' }}>
          <FaMapMarkerAlt className="me-1" />
          {tronquerTexte(property.adresse || property.address, 30)}
        </div>

        <div className="description-row" style={{ padding: '10px' }}>
          <p className="card-text text-muted small">
            <strong className='card-title'>Description</strong> : {tronquerTexte(property.description || property.desc, 100)}
          </p>
        </div>
      </div>

      {/* Agent Section */}
      {resolvedAgent && (
        <div className={`property-agent d-flex align-items-center p-2 bg-light ${!isReserved ? 'agent-muted' : ''}`}>
          <div className="agent-left d-flex align-items-center" style={{ flex: 1 }}>
            <img 
              src={resolvedAgent.photo || img} 
              alt="agent" 
              style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10, objectFit: 'cover' }} 
            />
            <div className="agent-meta">
              <div className="fw-semibold small">{resolvedAgent.name || resolvedAgent.prenom || 'Agent'}</div>
              <div className="small text-muted">{isReserved ? resolvedAgent.phone : 'Numéro masqué'}</div>
            </div>
          </div>
          
          <div className="agent-right">
            {isReserved ? (
              <div className="d-flex gap-2">
                <button className="btn btn-outline-success btn-sm" onClick={() => setShowContact(true)}><FaWhatsapp /></button>
                <button className="btn btn-outline-dark btn-sm" onClick={() => window.location.href = `tel:${resolvedAgent.phone}`}><FaPhone /></button>
              </div>
            ) : (
              <button className="btn btn-success btn-sm fw-bold" onClick={(e) => {
                e.stopPropagation();
                if (onOpenBooking) onOpenBooking(property, resolvedAgent);
                else setShowBooking(true);
              }}>
                <FaRegMoneyBillAlt className="me-1" />Réserver
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals & Portals */}
      {showBooking && (
        <VisitBookingModal 
          open={showBooking} 
          onClose={() => setShowBooking(false)} 
          property={property} 
          agent={resolvedAgent}
          onSuccess={() => {
            setIsReserved(true);
            setShowBooking(false);
          }}
        />
      )}
      
      {showContact && <AgentContactModal agent={resolvedAgent} open={showContact} onClose={() => setShowContact(false)} />}

      {showLightbox && createPortal(
        <div className="lightbox-full" onClick={closeLightbox} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={imgs[lightboxIndex]} alt="fullscreen" style={{ maxHeight: '90%', maxWidth: '90%' }} />
          <button onClick={closeLightbox} style={{ position: 'absolute', top: 20, right: 20, color: 'white', fontSize: 30, background: 'none', border: 'none' }}>×</button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PropertyCard;