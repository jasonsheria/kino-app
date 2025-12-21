import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './MapPropertyViewer.css';
import { FaMapMarkerAlt, FaCheck, FaPhone, FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { createPortal } from 'react-dom';

// Custom marker icon for properties
const createPropertyMarker = (type = 'standard') => {
  const colors = {
    standard: '#0daebe',
    featured: '#ff7a59',
    reserved: '#0daebe',
  };
  
  return L.divIcon({
    html: `<div class="custom-marker ${type}" style="background:${colors[type]}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>
    </div>`,
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Small red marker for user's current position
const createUserMarker = () => L.divIcon({
  html: `<div class="user-marker" style="background:#e63946;border:2px solid #fff;width:14px;height:14px;border-radius:50%;box-shadow:0 0 8px rgba(230,57,70,0.5)"></div>`,
  className: 'user-marker-wrapper',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Normalize various geolocation formats into { lat, lng } or null
const normalizeGeoloc = (p) => {
  if (!p) return null;
  const g = p.geoloc || p.location || p.coords || null;

  const toNum = v => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const isLat = v => typeof v === 'number' && v >= -90 && v <= 90;
  const isLng = v => typeof v === 'number' && v >= -180 && v <= 180;

  // Handle GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
  if (g && typeof g === 'object' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
    const a0 = toNum(g.coordinates[0]);
    const a1 = toNum(g.coordinates[1]);
    if (a0 != null && a1 != null) {
      // GeoJSON is [lng, lat]
      if (isLat(a1) && isLng(a0)) return { lat: a1, lng: a0 };
    }
  }

  // Array form: could be [lat, lng] or [lng, lat]
  if (Array.isArray(g) && g.length >= 2) {
    const a0 = toNum(g[0]);
    const a1 = toNum(g[1]);
    if (a0 != null && a1 != null) {
      // Heuristic: if a0 looks like lat (-90..90) and a1 looks like lng (-180..180)
      if (isLat(a0) && isLng(a1)) return { lat: a0, lng: a1 };
      // Otherwise maybe [lng, lat]
      if (isLat(a1) && isLng(a0)) return { lat: a1, lng: a0 };
      // Last resort: assume [lat, lng]
      return { lat: a0, lng: a1 };
    }
  }

  if (g && typeof g === 'object') {
    // Common fields
    const lat = toNum(g.lat ?? g.latitude ?? (g[1] ?? null));
    const lng = toNum(g.lng ?? g.longitude ?? (g[0] ?? null));
    if (lat != null && lng != null && isLat(lat) && isLng(lng)) return { lat, lng };
  }

  // Top-level fields
  const tlat = toNum(p.latitude ?? p.lat);
  const tlng = toNum(p.longitude ?? p.lng);
  if (tlat != null && tlng != null && isLat(tlat) && isLng(tlng)) return { lat: tlat, lng: tlng };

  // no valid coords
  return null;
};


// Map controller component to handle interactions
// NOTE: Auto-zoom/auto-fit behavior removed per user request — we only pan to center now
const MapController = ({ center, zoom, properties, onMarkerClick, userPosition, fitRequest, setFitRequestProp }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    // center may be [lat, lng] or { lat, lng }
    let c = null;
    if (Array.isArray(center) && center.length >= 2) c = center;
    else if (center && typeof center === 'object' && center.lat != null && center.lng != null) c = [center.lat, center.lng];

    if (c) {
      try { map.panTo(c); } catch (e) { /* ignore */ }
    }
    // Intentionally do not call map.setView(center, zoom) or map.fitBounds to avoid changing zoom automatically
  }, [center, map]);

  // Perform fitBounds only when user explicitly requests it
  useEffect(() => {
    if (!map || !fitRequest) return;
    const markers = (properties || []).filter(p => p.geoloc && p.geoloc.lat != null && p.geoloc.lng != null).map(p => [p.geoloc.lat, p.geoloc.lng]);
    if (markers.length === 0) {
      if (typeof setFitRequestProp === 'function') setFitRequestProp(false);
      return;
    }
    const bounds = L.latLngBounds(markers);
    try { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 }); } catch (e) { console.warn('[MapController] fitBounds failed', e); }
    if (typeof setFitRequestProp === 'function') setFitRequestProp(false);
  }, [fitRequest, map, properties, setFitRequestProp]);

  return null;
};

// Property detail modal component - Enhanced Design
const PropertyDetailModal = ({ property, agent, open, onClose, onVisitClick }) => {
  // Check if property is reserved - MUST be before any early returns
  const isReserved = React.useMemo(() => {
    try {
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
      return reserved.includes(String(property?.id));
    } catch (e) {
      return false;
    }
  }, [property?.id]);

  if (!open || !property) return null;

  const price = property.promoPrice || property.price;
  const oldPrice = property.oldPrice;
  const image = property.images[0] || 'https://via.placeholder.com/400x300?text=No+Image';
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const modalContent = (
    <div className="map-property-modal-bg" onClick={onClose}>
      <div className="map-property-modal enhanced" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {/* Hero Image Section with Overlays */}
        <div className="modal-hero">
          <img src={image} alt={property.title} className="modal-hero-image" />
          
          {/* Gradient overlay */}
          <div className="modal-hero-overlay"></div>
          
          {/* Badges */}
          <div className="modal-badges">
            {property.promotion && (
              <div className="badge badge-promo">
                <span>🎉 PROMOTION</span>
              </div>
            )}
            {discount > 0 && (
              <div className="badge badge-discount">
                -{discount}%
              </div>
            )}
          </div>

          {/* Price Floating Card */}
          <div className="modal-price-card">
            <div className="price-wrapper">
              {oldPrice && (
                <div className="price-old">
                  <span>{new Intl.NumberFormat().format(oldPrice)}</span>
                  <span className="currency">$</span>
                </div>
              )}
              <div className="price-current">
                <span className="amount">{new Intl.NumberFormat().format(price)}</span>
                <span className="currency">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="modal-content enhanced">
          <h2 className="modal-title">{property.title}</h2>
          
          {/* Address / Location */}
          {property.address && (
            <div className="modal-location">
              <FaMapMarkerAlt size={14} />
              <span>{property.address}</span>
            </div>
          )}
          
          <div className="modal-divider"></div>
          
          <div className="modal-description">
            {property.description}
          </div>

          {/* Property Features */}
          {(property.bedrooms || property.bathrooms || property.size) && (
            <div className="modal-features">
              {property.bedrooms && (
                <div className="feature-item">
                  <span className="feature-label">Chambres</span>
                  <span className="feature-value">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="feature-item">
                  <span className="feature-label">Salles de bain</span>
                  <span className="feature-value">{property.bathrooms}</span>
                </div>
              )}
              {property.size && (
                <div className="feature-item">
                  <span className="feature-label">Surface</span>
                  <span className="feature-value">{property.size} m²</span>
                </div>
              )}
            </div>
          )}

          {/* Agent Section - Enhanced - Show only if property is RESERVED */}
          {isReserved && agent && (
            <div className="modal-agent-section enhanced">
              <div className="agent-section-title">Contactez l'agent</div>
              <div className="agent-card">
                <img src={agent.image} alt={agent.name} className="agent-avatar-large" />
                <div className="agent-info-content">
                  <h4 className="agent-name">{agent.name || agent.prenom}</h4>
                  <p className="agent-company">{agent.company || 'Agent immobilier'}</p>
                  <p className="agent-phone-display">{agent.phone}</p>
                </div>
              </div>
              
              <div className="agent-actions enhanced">
                <button 
                  className="action-btn-modern whatsapp"
                  title="WhatsApp"
                  onClick={() => {
                    const msg = `Bonjour! Je suis intéressé par ${property.title}`;
                    window.open(`https://wa.me/${agent.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </button>
                <button 
                  className="action-btn-modern call"
                  title="Appel"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ndaku-call', {
                      detail: { to: 'support', meta: { agentId: agent.id, propertyId: property.id } }
                    }));
                  }}
                >
                  <FaPhone />
                  <span>Appel</span>
                </button>
                {agent.facebook && (
                  <a 
                    href={agent.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn-modern facebook"
                    title="Facebook"
                  >
                    <FaFacebook />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Reserved Badge - Show only if property is RESERVED */}
          {isReserved && (
            <div className="reserved-status-badge">
              <FaCheck size={16} />
              <span>Cette propriété a déjà été réservée</span>
            </div>
          )}

          {/* CTA Button - Show only if property is NOT RESERVED */}
          {!isReserved && (
            <button className="modal-visit-btn enhanced" onClick={() => onVisitClick(property, agent)}>
              <span>Réserver une visite</span>
              <FaCheck size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Main MapPropertyViewer component
const MapPropertyViewer = ({ properties = [], onVisitRequest, defaultCenter = [-4.325, 15.322], defaultZoom = 13 }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [userLocation, setUserLocation] = useState(null);
  const [fitRequest, setFitRequest] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const mapRef = useRef(null);
    const navigate = useNavigate();


  // Resolve agent for each property and normalize geolocation
  const { agents } = require('../../data/fakedata');
  
  const enrichedProperties = properties.map(p => {
    const geo = normalizeGeoloc(p);
    return {
      ...p,
      geoloc: geo,
      agent: agents.find(a => a && (String(a.id) === String(p.agentId) || String(a._id) === String(p.agentId)))
    };
  });

  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
  };

  const handleVisitRequest = (property, agent) => {
    setSelectedProperty(null);
    if (typeof onVisitRequest === 'function') {
      onVisitRequest({ property, agent });
    }
  };

  // Filter properties with valid geolocation
  const validProperties = enrichedProperties.filter(p => p.geoloc && p.geoloc.lat != null && p.geoloc.lng != null);

  // Debug summary when properties change: how many have geoloc
  useEffect(() => {
    try {
      const total = (properties || []).length;
      const valid = validProperties.length;
      const missing = (properties || []).filter(p => !normalizeGeoloc(p)).slice(0, 8).map(p => (p.id || p._id || p.pid || p.title || '(obj)'));
      console.debug('[MapPropertyViewer] properties summary', { total, valid, missingSample: missing });
    } catch (e) { /* ignore */ }
  }, [properties, validProperties.length]);

  // get user's real location (initial and watch for updates)
  useEffect(() => {
    if (!navigator.geolocation) {
      console.debug('[MapPropertyViewer] Geolocation not available in this browser');
      return;
    }
    let watchId = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.debug('[MapPropertyViewer] getCurrentPosition', { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => { console.warn('Geolocation error', err); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          console.debug('[MapPropertyViewer] watchPosition update', { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('watchPosition error', err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } catch (e) { console.warn('[MapPropertyViewer] failed to start geolocation watch', e); }
    return () => { if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId); };
  }, []);

  // Log user location changes to help debug whether browser returns real coordinates
  useEffect(() => {
    if (userLocation) console.info('[MapPropertyViewer] userLocation state', userLocation);
    else console.info('[MapPropertyViewer] userLocation cleared or not available');
  }, [userLocation]);

  // If there are no properties but we have a user location, still render the map centered on user.
  const shouldRenderMap = validProperties.length > 0 || userLocation;
  if (!shouldRenderMap) {
    return (
      <div className="map-empty-state">
        <FaMapMarkerAlt size={48} />
        <p>Aucun bien avec localisation disponible</p>
      </div>
    );
  }

  return (
    <div className="map-property-viewer" style={{ position: 'relative' }}>
      {/* quick control: center map on user's position */}
      {userLocation && (
        <button
          aria-label="Me localiser"
          title="Me localiser"
          onClick={() => {
            // center on user without forcing zoom
            setMapCenter([userLocation.lat, userLocation.lng]);
            // also log coordinates explicitly for easier copy/paste
            console.info('[MapPropertyViewer] Me localiser clicked, userLocation:', userLocation);
          }}
          style={{ position: 'absolute', left: 12, top: 12, zIndex: 1200, background: '#fff', borderRadius: 8, padding: '8px 10px', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', cursor: 'pointer' }}
        >
          Me localiser
        </button>
      )}

      {/* Manual fit button (user-triggered only) */}
      {validProperties.length > 0 && (
        <button
          aria-label="Afficher tous les biens"
          title="Afficher tous les biens"
          onClick={() => setFitRequest(prev => !prev)}
          style={{ position: 'absolute', left: 12, top: 56, zIndex: 1200, background: '#fff', borderRadius: 8, padding: '8px 10px', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', cursor: 'pointer' }}
        >
          Afficher tous les biens
        </button>
      )}

     -++

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="map-container"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          maxZoom={19}
        />

        <MapController 
          center={mapCenter} 
          zoom={mapZoom} 
          properties={validProperties}
          onMarkerClick={handleMarkerClick}
          userPosition={userLocation}
          fitRequest={fitRequest}
          setFitRequestProp={setFitRequest}
        />

        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.geoloc.lat, property.geoloc.lng]}
            icon={createPropertyMarker(property.promotion ? 'featured' : 'standard')}
            eventHandlers={{
              click: () => handleMarkerClick(property)
            }}
          >
            <Popup closeButton={true} autoClose={false}>
              <div className="marker-popup">
                <img src={property.images && property.images[0]} alt={property.title} className="popup-image" />
                <h4 className="popup-title">{property.title}</h4>
                <p className="popup-price">{new Intl.NumberFormat().format(property.price || property.prix || 0)} $</p>
                <button 
                  className="popup-btn"
                  onClick={() => {navigate(`/properties/${property.id}`);}}
                >
                  Voir détails
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User position marker (red) */}
        {userLocation && (
          <Marker
            key="__user_location"
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserMarker()}
          >
            <Popup closeButton={false}>
              <div style={{ fontWeight: 700 }}>Vous êtes ici</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Debug panel showing properties and coordinates (toggleable) */}
      {debugOpen && (
        <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Liste des propriétés (id — lat, lng)</div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {validProperties.map(p => (
              <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem' }}><strong>{p.id || p._id || '(no id)'}</strong> — {p.geoloc.lat.toFixed(6)}, {p.geoloc.lng.toFixed(6)}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.title || p.name || ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PropertyDetailModal
        property={selectedProperty}
        agent={selectedProperty?.agent}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onVisitClick={handleVisitRequest}
      />
    </div>
  );
};

export default MapPropertyViewer;
