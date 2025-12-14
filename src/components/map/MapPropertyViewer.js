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
    standard: '#667eea',
    featured: '#ff7a59',
    reserved: '#16a34a',
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

// Map controller component to handle interactions
const MapController = ({ center, zoom, properties, onMarkerClick }) => {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (!map || !properties || properties.length === 0) return;

    // Calculate bounds to fit all markers
    const markers = properties.filter(p => p.geoloc && p.geoloc.lat && p.geoloc.lng);
    if (markers.length === 0) return;

    const bounds = L.latLngBounds(markers.map(p => [p.geoloc.lat, p.geoloc.lng]));
    
    // Fit map to bounds with padding
    if (markers.length === 1) {
      map.setView([markers[0].geoloc.lat, markers[0].geoloc.lng], 15);
    } else {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [properties, map]);

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
  const mapRef = useRef(null);
    const navigate = useNavigate();


  // Resolve agent for each property
  const { agents } = require('../../data/fakedata');
  
  const enrichedProperties = properties.map(p => ({
    ...p,
    agent: agents.find(a => String(a.id) === String(p.agentId))
  }));

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
  const validProperties = enrichedProperties.filter(p => p.geoloc && p.geoloc.lat && p.geoloc.lng);

  if (validProperties.length === 0) {
    return (
      <div className="map-empty-state">
        <FaMapMarkerAlt size={48} />
        <p>Aucun bien avec localisation disponible</p>
      </div>
    );
  }

  return (
    <div className="map-property-viewer">
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
                <img src={property.images[0]} alt={property.title} className="popup-image" />
                <h4 className="popup-title">{property.title}</h4>
                <p className="popup-price">{new Intl.NumberFormat().format(property.price)} $</p>
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
      </MapContainer>

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
