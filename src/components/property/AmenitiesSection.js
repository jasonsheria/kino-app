import React from 'react';
import { 
  FaWifi, FaSwimmingPool, FaTree, FaShieldAlt, FaParking, 
  FaFire, FaSnowflake, FaBuilding, FaLock, FaCamera,
  FaClock, FaTrash, FaCheck, FaLightbulb, FaFaucet,
  FaBolt, FaHome, FaBed, FaPhone, FaRoad
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import './AmenitiesSection.css';

const AmenitiesSection = ({ property = {} }) => {
  if (!property) return null;

  // Définir les aménités selon le type de propriété
  const amenities = [
    { id: 'wifi', label: 'WiFi', icon: FaWifi, available: property.wifi !== false },
    { id: 'pool', label: 'Piscine', icon: FaSwimmingPool, available: property.pool || false },
    { id: 'garden', label: 'Jardin', icon: FaTree, available: property.garden !== false },
    { id: 'security', label: 'Sécurité 24/7', icon: FaShieldAlt, available: property.security24 !== false },
    { id: 'parking', label: 'Parking', icon: FaParking, available: property.parking !== false },
    { id: 'heating', label: 'Chauffage', icon: FaFire, available: property.heating || false },
    { id: 'ac', label: 'Climatisation', icon: FaSnowflake, available: property.airConditioning || false },
    { id: 'elevator', label: 'Ascenseur', icon: FaBuilding, available: property.elevator || false },
    { id: 'intercom', label: 'Interphone', icon: FaLock, available: property.intercom || false },
    { id: 'cctv', label: 'Surveillance CCTV', icon: FaCamera, available: property.cctv || false },
    { id: 'reception', label: 'Réception 24h', icon: FaClock, available: property.reception24 || false },
    { id: 'waste', label: 'Gestion déchets', icon: FaTrash, available: property.wasteManagement !== false },
  ];

  // Filtrer les aménités disponibles
  const availableAmenities = amenities.filter(a => a.available);
  const unavailableAmenities = amenities.filter(a => !a.available);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  if (availableAmenities.length === 0) {
    return null;
  }

  return (
    <div className="amenities-section">
      {/* Header */}
      <div className="amenities-header">
        <h5 className="amenities-title">
          <FaHome className="me-2" />
          Équipements & Commodités
        </h5>
        <p className="amenities-subtitle">
          Découvrez tous les services et équipements disponibles dans cette propriété
        </p>
      </div>

      {/* Grille des aménités */}
      <motion.div 
        className="amenities-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {availableAmenities.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <motion.div
              key={amenity.id}
              className="amenity-item"
              variants={itemVariants}
            >
              <div className="amenity-icon-wrapper">
                <Icon className="amenity-icon" />
                <div className="amenity-check">
                  <FaCheck className="check-icon" />
                </div>
              </div>
              <div className="amenity-label">{amenity.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Section des équipements principaux (si présents) */}
      {(property.chambres || property.sdb || property.cuisine || property.salon) && (
        <div className="main-features-section">
          <h6 className="features-title">Caractéristiques principales</h6>
          <div className="main-features-grid">
            {property.chambres && (
              <div className="main-feature-item">
                <div className="feature-icon-main">
                  <FaBed />
                </div>
                <div className="feature-content-main">
                  <div className="feature-value">{property.chambres}</div>
                  <div className="feature-name">Chambre{property.chambres > 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            {property.douches && (
              <div className="main-feature-item">
                <div className="feature-icon-main">
                  <FaFaucet style={{ transform: 'rotate(90deg)' }} />
                </div>
                <div className="feature-content-main">
                  <div className="feature-value">{property.douches}</div>
                  <div className="feature-name">Salle de bain</div>
                </div>
              </div>
            )}
            {property.cuisine && (
              <div className="main-feature-item">
                <div className="feature-icon-main">
                  <FaBolt />
                </div>
                <div className="feature-content-main">
                  <div className="feature-value">{property.cuisine}</div>
                  <div className="feature-name">Cuisine{property.cuisine > 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            {property.salon && (
              <div className="main-feature-item">
                <div className="feature-icon-main">
                  <FaHome />
                </div>
                <div className="feature-content-main">
                  <div className="feature-value">{property.salon}</div>
                  <div className="feature-name">salon{property.salon > 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information supplémentaire */}
      {property.surface && (
        <div className="additional-info">
          <div className="info-item">
            <FaRoad className="info-icon" />
            <span>Surface: <strong>{property.surface} m²</strong></span>
          </div>
          {property.floor && (
            <div className="info-item">
              <FaBuilding className="info-icon" />
              <span>Étage: <strong>{property.floor}</strong></span>
            </div>
          )}
          {property.yearBuilt && (
            <div className="info-item">
              <FaBolt className="info-icon" />
              <span>Année de construction: <strong>{property.yearBuilt}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
