import React from 'react';
import { 
  FaPhone, FaWhatsapp, FaFacebook, FaMailchimp, FaStar, FaCheckCircle, 
  FaHome, FaUserTie, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy,
  FaArrowRight
} from 'react-icons/fa';
import { Button } from '@mui/material';
import './AgentProfileCard.css';

const AgentProfileCard = ({ agent, property, onContactClick, onViewMoreClick, isReserved }) => {
  if (!agent) return null;

  // Données du profil agent avec valeurs par défaut
  const agentName = agent?.prenom || agent?.name || 'Agent immobilier';
  const agentPhoto = (process.env.REACT_APP_BACKEND_APP_URL || '') + (agent?.photo || agent?.image || agent?.avatar || '');
  const agentTitle = agent?.titre || agent?.title || 'Agent immobilier professionnel';
  const agentPhone = agent?.whatsapp || agent?.phone || '';
  const agentEmail = agent?.email || '';
  const agentFacebook = agent?.facebook || agent?.fb || '';
  const agentLocation = agent?.location || agent?.city || 'Kinshasa, RDC';
  
  // Statistiques avec valeurs par défaut
  const yearsExperience = agent?.yearsExperience || agent?.experience || 5;
  const propertiesCount = agent?.propertiesCount || agent?.properties_count || 12;
  const rating = agent?.rating || agent?.cote || 4.5;
  const reviews = agent?.reviews || agent?.avis || 28;
  const certifications = agent?.certifications || ['Agent Agréé', 'Expert Immobilier'];
  const badges = agent?.badges || ['Recommandé', 'Top Agent'];
  const description = agent?.description || agent?.bio || `Professionnel expérimenté dans la vente et la location de biens immobiliers. Expert du marché local avec une excellente connaissance des quartiers.`;
  
  // Fonction pour afficher les étoiles
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <div key={i} className="star-half">
            <FaStar className="star half-filled" />
          </div>
        );
      } else {
        stars.push(<FaStar key={i} className="star empty" />);
      }
    }
    return stars;
  };

  return (
    <div className="agent-profile-card">
      {/* Header avec photo de fond dégradé */}
      <div className="agent-profile-header">
        <div className="agent-header-background" />
        
        {/* Avatar circulaire */}
        <div className="agent-avatar-container">
          <img src={agentPhoto} alt={agentName} className="agent-avatar-large" />
          {badges.includes('Top Agent') && (
            <div className="badge-top-agent" title="Top Agent">
              <FaTrophy className="me-1" /> TOP
            </div>
          )}
        </div>
      </div>

      {/* Contenu du profil */}
      <div className="agent-profile-content">
        {/* Nom et titre */}
        <div className="agent-profile-header-text">
          <div className="agent-name-container">
            <h3 className="agent-name">{agentName}</h3>
            {agent?.verified && <FaCheckCircle className="badge-verified" title="Vérifié" />}
          </div>
          <p className="agent-title text-muted">{agentTitle}</p>
          <div className="agent-location small text-secondary">
            <FaMapMarkerAlt className="me-1" /> {agentLocation}
          </div>
        </div>

        {/* Évaluation et cote */}
        <div className="agent-rating-section">
          <div className="rating-stars d-flex align-items-center gap-2">
            <div className="stars-container">
              {renderStars(rating)}
            </div>
            <span className="rating-value fw-bold">{rating.toFixed(1)}</span>
            <span className="rating-count text-muted small">({reviews} avis)</span>
          </div>
        </div>

        {/* Badges et certifications */}
        <div className="agent-badges-section">
          {certifications.map((cert, idx) => (
            <span key={idx} className="badge badge-certification">
              <FaCheckCircle className="me-1" /> {cert}
            </span>
          ))}
          {badges.map((badge, idx) => (
            <span key={idx} className="badge badge-achievement">
              {badge}
            </span>
          ))}
        </div>

        {/* Statistiques */}
        <div className="agent-stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <FaHome />
            </div>
            <div className="stat-content">
              <div className="stat-value">{propertiesCount}</div>
              <div className="stat-label">Propriétés</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <div className="stat-value">{yearsExperience}</div>
              <div className="stat-label">Ans d'expérience</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <div className="stat-value">24h</div>
              <div className="stat-label">Réponse rapide</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="agent-description-section">
          <h6 className="section-title">À propos</h6>
          <p className="agent-description">
            {description}
          </p>
        </div>

        {/* Boutons d'action - icônes seulement */}
        <div className="agent-action-buttons icon-only">
          {agentPhone && (
            <button
              className="btn btn-icon btn-whatsapp"
              onClick={() => onContactClick?.('whatsapp')}
              title="Contacter via WhatsApp"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </button>
          )}

          <button
            className="btn btn-icon btn-phone"
            onClick={() => onContactClick?.('phone')}
            title="Appeler"
            aria-label="Appeler"
          >
            <FaPhone />
          </button>

          {agentEmail && (
            <button
              className="btn btn-icon btn-email"
              onClick={() => onContactClick?.('email')}
              title="Envoyer un email"
              aria-label="Email"
            >
              <FaMailchimp />
            </button>
          )}

          {agentFacebook && (
            <a
              href={agentFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-icon btn-facebook"
              title="Facebook"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
          )}
        </div>

        {/* Voir plus de biens de cet agent */}
        <button 
          className="btn btn-view-more"
          onClick={onViewMoreClick}
        >
          Voir tous les biens de cet agent
          <FaArrowRight className="ms-2" />
        </button>

        {/* Divider */}
        <div className="divider"></div>

        {/* Bouton principal de réservation */}
        {isReserved ? (
          <Button
            fullWidth
            variant="contained"
            disabled
            color="success"
            size="large"
            className="btn-reserve-main"
            sx={{
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
              cursor: 'not-allowed'
            }}
          >
            ✓ Déjà réservé
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            className="btn-reserve-main"
            sx={{
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none'
            }}
            onClick={() => onContactClick?.('reservation')}
          >
            Réserver une visite
          </Button>
        )}
      </div>
    </div>
  );
};

export default AgentProfileCard;
