import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaMapMarkerAlt,
  FaStar, FaHeart, FaRegHeart, FaArrowRight
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import './SuggestionsEnhanced.css';

const SuggestionsEnhanced = ({ suggestions = [], agents = [] }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = React.useState(new Set());

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="suggestions-empty">
        <p>Aucune suggestion disponible pour le moment</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="suggestions-enhanced">
      <div className="suggestions-header">
        <h5 className="suggestions-title">
          <span className="title-icon">✨</span>
          Propriétés similaires suggérées
        </h5>
        <p className="suggestions-subtitle">Découvrez d'autres biens qui pourraient vous intéresser</p>
      </div>

      <motion.div 
        className="suggestions-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {suggestions.map((property, index) => {
          const agent = agents?.find(a => 
            String(a.id) === String(property.agentId) || 
            String(a._id) === String(property.agentId)
          );

          return (
            <motion.div
              key={property.id || property._id}
              className="suggestion-card"
              variants={itemVariants}
              onClick={() => navigate(`/properties/${property.id || property._id}`)}
            >
              {/* Image Container avec overlay */}
              <div className="suggestion-image-wrapper">
                <img 
                  src={process.env.REACT_APP_BACKEND_APP_URL + (property.images?.[0] || '')} 
                  alt={property.name}
                  className="suggestion-image"
                />
                
                {/* Overlay avec bouton d'action */}
                <div className="suggestion-overlay">
                  <button className="btn-see-more">
                    Voir les détails
                    <FaArrowRight className="ms-2" />
                  </button>
                </div>

                {/* Badge favori */}
                <button 
                  className="btn-favorite"
                  onClick={(e) => toggleFavorite(property.id || property._id, e)}
                  title={favorites.has(property.id || property._id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  {favorites.has(property.id || property._id) ? 
                    <FaHeart className="heart-icon filled" /> : 
                    <FaRegHeart className="heart-icon" />
                  }
                </button>

                {/* Badges d'information */}
                {property.status && (
                  <span className="badge-status">{property.status}</span>
                )}
              </div>

              {/* Contenu de la card */}
              <div className="suggestion-content">
                {/* Titre et localisation */}
                <div className="suggestion-header-info">
                  <h6 className="suggestion-name">{property.name}</h6>
                  <div className="suggestion-location">
                    <FaMapMarkerAlt className="location-icon" />
                    <span className="text-truncate">{property.address || 'Kinshasa'}</span>
                  </div>
                </div>

                {/* Prix principal */}
                <div className="suggestion-price-section">
                  <div className="price-main">
                    <span className="currency">$</span>
                    <span className="amount">{(property.price || 0).toLocaleString()}</span>
                  </div>
                  <span className="property-type">{property.type}</span>
                </div>

                {/* Caractéristiques */}
                {(property.type === 'Appartement' || property.type === 'Studio' || property.type === 'Maison') && (
                  <div className="suggestion-features">
                    {property.chambres && (
                      <div className="feature-item" title="Chambres">
                        <FaBed className="feature-icon" />
                        <span>{property.chambres}</span>
                      </div>
                    )}
                    {property.douches && (
                      <div className="feature-item" title="Douches">
                        <FaShower className="feature-icon" />
                        <span>{property.douches}</span>
                      </div>
                    )}
                    {property.salon && (
                      <div className="feature-item" title="Salons">
                        <FaCouch className="feature-icon" />
                        <span>{property.salon}</span>
                      </div>
                    )}
                    {property.cuisine && (
                      <div className="feature-item" title="Cuisines">
                        <FaUtensils className="feature-icon" />
                        <span>{property.cuisine}</span>
                      </div>
                    )}
                    {property.sdb && (
                      <div className="feature-item" title="Salles de bain">
                        <FaBath className="feature-icon" />
                        <span>{property.sdb}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Information Agent */}
                {agent && (
                  <div className="suggestion-agent-info">
                    <img 
                      src={process.env.REACT_APP_BACKEND_APP_URL + (agent.photo || agent.image || agent.avatar || '')}
                      alt={agent.prenom || agent.name}
                      className="agent-avatar-small"
                    />
                    <div className="agent-details">
                      <div className="agent-name-small">{agent.prenom || agent.name || 'Agent'}</div>
                      <div className="agent-rating-small">
                        <FaStar className="star-icon" />
                        <span className="rating-value">{(agent.rating || 4.5).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description courte */}
                {property.description && (
                  <p className="suggestion-description">
                    {property.description.substring(0, 80)}...
                  </p>
                )}

                {/* Bouton d'action principal */}
                <button 
                  className="btn-primary-suggestion"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/properties/${property.id || property._id}`);
                  }}
                >
                  Consulter cette annonce
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SuggestionsEnhanced;
