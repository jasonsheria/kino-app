



import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { showToast } from '../common/ToastManager';
import { agents, properties } from '../../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';
import './PropertyCard.css';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const PropertyCard = ({ property, showActions: propShowActions, onOpenBooking }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Resolve agent robustly:
  // 1) if property.agent is an embedded object, use it
  // 2) try to find in the local `agents` array by matching multiple id fields
  // 3) if local `agents` is empty, try fetching user-scoped agents from the API
  const [resolvedAgent, setResolvedAgent] = useState(() => {
    try {
      if (property && property.agent && typeof property.agent === 'object') return property.agent;
      const found = agents && agents.length ? agents.find(a => {
        const propAgentIds = [property.agent, property.agentId, property.agent_id, property._id, property.id].map(v => v && String(v));
        const candidateIds = [a.id, a._id, a.agentId, a.raw && a.raw._id, a.raw && a.raw.id, a.email, a.phone].map(v => v && String(v));
        return candidateIds.some(cid => cid && propAgentIds.some(pid => pid && pid === cid));
      }) : null;
      return found || null;
    } catch (e) { return null; }
  });
  const [remoteAgentsLoading, setRemoteAgentsLoading] = useState(false);
  const [remoteAgentsError, setRemoteAgentsError] = useState(null);
  const location = useLocation();
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [isReserved, setIsReserved] = useState(() => {
    try {
  const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
  return reserved.includes(String(property.id)) || Boolean(property.isReserved);
    } catch (e) {
      return Boolean(property.isReserved);
    }
  });

  useEffect(() => {
    // attempt to resolve agent when component mounts or when property/agents change
    const tryResolve = async () => {
      if (resolvedAgent) return;
      // If property includes embedded agent object, use it
      if (property && property.agent && typeof property.agent === 'object') {
        setResolvedAgent(property.agent);
        return;
      }

      // Try local agents first
      if (agents && agents.length) {
        const found = agents.find(a => {
          const propAgentIds = [property.agent, property.agentId, property.agent_id, property._id, property.id].map(v => v && String(v));
          const candidateIds = [a.id, a._id, a.agentId, a.raw && a.raw._id, a.raw && a.raw.id].map(v => v && String(v));
          return candidateIds.some(cid => cid && propAgentIds.some(pid => pid && pid === cid));
        });
        if (found) {
          setResolvedAgent(found);
          return;
        }
      }

      // If no local agents, try fetching user-scoped agents from backend
      if ((!agents || agents.length === 0) && !remoteAgentsLoading) {
        setRemoteAgentsLoading(true);
        try {
          const token = localStorage.getItem('ndaku_auth_token');
          const base = process.env.REACT_APP_BACKEND_APP_URL || '';
          const urls = [`${base}/api/agents/me`, `${base}/api/agents?site=${process.env.REACT_APP_SITE_ID || ''}`];
          let data = null;
          for (const u of urls) {
            try {
              const res = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
              if (!res.ok) continue;
              const json = await res.json();
              if (Array.isArray(json) && json.length) { data = json; break; }
              // some endpoints wrap data
              if (json && Array.isArray(json.data) && json.data.length) { data = json.data; break; }
            } catch (e) {
              // ignore and try next
            }
          }
          if (data && data.length) {
            const found = data.find(a => {
              const propAgentIds = [property.agent, property.agentId, property.agent_id, property._id, property.id].map(v => v && String(v));
              const candidateIds = [a.id, a._id, a.agentId, a.raw && a.raw._id, a.raw && a.raw.id].map(v => v && String(v));
              return candidateIds.some(cid => cid && propAgentIds.some(pid => pid && pid === cid));
            });
            if (found) setResolvedAgent(found);
          }
        } catch (err) {
          setRemoteAgentsError(err.message || 'failed');
        } finally {
          setRemoteAgentsLoading(false);
        }
      }
    };
    tryResolve();
  }, [property, resolvedAgent]);

  useEffect(() => {
    const handler = (e) => {
      const reservedId = e?.detail?.propertyId;
      if (String(reservedId) === String(property.id)) {
        console.log('PropertyCard received property-reserved event for', reservedId);
        setIsReserved(true);
      }
    };
    const storageHandler = (e) => {
      if (e.key === 'reserved_properties') {
        try {
          const reserved = JSON.parse(e.newValue || '[]').map(String);
          if (reserved.includes(String(property.id))) setIsReserved(true);
        } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('property-reserved', handler);
    window.addEventListener('storage', storageHandler);
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

  // Reservation success is handled globally via event dispatch/localStorage in the modal

  // safe images array (fallback to property.image or a bundled placeholder)
  const imgs = Array.isArray(property.images) && property.images.length
    ? property.images
    : (property.image ? [property.image] : [require('../../img/property-1.jpg')]);
  const displayName = property.name || property.title || 'Bien immobilier';

  // Suggestions (autres biens, exclure le courant)
  const suggestions = properties.filter(p => String(p.id) !== String(property.id)).slice(0, 3);

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

  const lightboxRef = useRef(null);
  const touchStartX = useRef(null);

  // Keyboard navigation and touch swipe for lightbox
  useEffect(() => {
    if (!showLightbox) return;

    // lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        return;
      }
      if (e.key === 'ArrowRight') {
        nextImg();
        return;
      }
      if (e.key === 'ArrowLeft') {
        prevImg();
        return;
      }
    };

    const onTouchStart = (e) => {
      touchStartX.current = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    };
    const onTouchMove = (e) => {
      // prevent default to avoid rubber-band on iOS when necessary
      // but allow pointer events for buttons to work
    };
    const onTouchEnd = (e) => {
      if (!touchStartX.current) return;
      const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      if (endX === null) return;
      const diff = touchStartX.current - endX;
      const threshold = 40; // px
      if (diff > threshold) {
        nextImg();
      } else if (diff < -threshold) {
        prevImg();
      }
      touchStartX.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    const node = lightboxRef.current || document.body;
    node.addEventListener && node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener && node.addEventListener('touchmove', onTouchMove, { passive: true });
    node.addEventListener && node.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      node.removeEventListener && node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener && node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener && node.removeEventListener('touchend', onTouchEnd);
      document.body.style.overflow = prevOverflow;
    };
  }, [showLightbox, lightboxRef, lightboxIndex, imgs.length]);

  // For map and agent UI use the resolvedAgent
  const agentResolved = resolvedAgent;
  // Pour la map, on prend la géoloc de l'agent (sinon défaut Kinshasa)
  const mainPos = agentResolved?.geoloc || { lat: -4.325, lng: 15.322 };

  return (
    <div className="card shadow-lg border-0 mb-4 property-card fixed-size animate__animated animate__fadeInUp" style={{borderRadius:14, overflow:'hidden', transition:'box-shadow .3s'}}>
      <div className="property-image" onClick={() => imgs.length && openLightbox(0)} role="button">
        <img src={process.env.REACT_APP_BACKEND_APP_URL+ imgs[0]} alt={displayName} className="property-img" />
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
        {/* Agent lié : toujours affiché, mais flouté/muted tant que non-réservé; le bouton de réservation reste actif */}
        {agentResolved && (
          <div className={`property-agent d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s ${!isReserved ? 'agent-muted' : ''}`}>
            <div className="property-agent-inner">
              <div className="agent-left">
                <div className="agent-avatar-wrapper">
                  <img src={(process.env.REACT_APP_BACKEND_APP_URL || '') + agentResolved.image} alt={agentResolved.prenom || agentResolved.name} className="agent-thumb" />
                </div>
                <div className="agent-meta">
                  <div className="agent-name fw-semibold small">{agentResolved.name || agentResolved.prenom}</div>
                  <div className="agent-phone small text-muted">{agentResolved.phone}</div>
                </div>
              </div>
              <div className="agent-right">
                {/* Always show reserve button */}
              

                {/* Contact icons visible only when reserved (or remain hidden while muted) */}
                {isReserved && (
                  <>
                    <button className="btns btn-outline-success contact-icon ms-2" title="WhatsApp" onClick={()=>setShowContact(true)} aria-label={`Contacter ${agentResolved.name || agentResolved.prenom} via WhatsApp`}><FaWhatsapp /></button>
                    {showContact && <AgentContactModal agent={agentResolved} open={showContact} onClose={()=>setShowContact(false)} />}
                    {agentResolved.facebook && (
                      <a href={agentResolved.facebook} target="_blank" rel="noopener noreferrer" className="btns btn-outline-primary contact-icon ms-2" title="Facebook" aria-label={`Visiter la page Facebook de ${agentResolved.name || agentResolved.prenom}`}><FaFacebook /></a>
                    )}
                    <button className="btns btn-outline-dark contact-icon ms-2" title="Téléphone" aria-label={`Appeler ${agentResolved.name || agentResolved.prenom}`} onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agentResolved.id || agentResolved._id, propertyId: property.id } } }))}><FaPhone /></button>
                  </>
                )}

                {/* Small reserved dot when reserved */}
                {isReserved && <span className="reserved-dot ms-2" aria-hidden="true" title="Réservé" />}
                {!isReserved && (
                  <button className="btns btn-success btn-sm fw-bold" onClick={() => onOpenBooking(property)}><FaRegMoneyBillAlt className="me-1"/>Réserver</button>
                )}
              </div>
            </div>
          </div>
        )}
      {/* Booking modal is now mounted at page-level (Home) to allow full-screen presentation */}
      </div>
      {/* Lightbox rendered via Portal to body so it always covers the full viewport */}
      {showLightbox && imgs.length > 0 && createPortal(
        <div className="lightbox-full animate__animated animate__fadeIn" role="dialog" aria-modal="true" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Fermer la lightbox">×</button>
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImg(); }} aria-label="Image précédente">‹</button>
          <img src={process.env.REACT_APP_BACKEND_APP_URL+imgs[lightboxIndex % imgs.length]} alt={displayName} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImg(); }} aria-label="Image suivante">›</button>
        </div>,
        document.body
      )}

  {/* ...aucune carte ni suggestions ici, à déplacer dans PropertyDetails... */}
    </div>
  );
};

export default PropertyCard;
