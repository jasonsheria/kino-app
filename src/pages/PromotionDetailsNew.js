import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaHeart, FaShare2, FaChevronLeft, FaChevronRight, FaCheckCircle, FaHome, FaDoors, FaRulerCombined, FaCalendarAlt } from 'react-icons/fa';
import './PromotionDetailsNew.css';
import HomeLayout from '../components/homeComponent/HomeLayout';
import img1 from '../img/property-1.jpg';
import img2 from '../img/property-2.jpg';
import img3 from '../img/property-3.jpg';
import img4 from '../img/property-4.jpg';
const PromotionDetailsNew = () => {
  const { id } = useParams();
  const [promo, setPromo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real API call
  const mockPromo = {
    id: '1',
    title: 'Magnifique Appartement 3 Pièces - Vue Panoramique',
    description: 'Découvrez cet appartement exceptionnel situé au cœur du quartier privilégié. Entièrement rénové avec finitions haut de gamme, lumineux et spacieux. Accès facile à toutes commodités, écoles, hôpitaux et commerces. Opportunité rare avec réduction de lancement de 17%.',
    type: 'Appartement',
    subtype: '3 pièces',
    location: 'Douala, Akwa',
    district: 'Quartier résidentiel premium',
    images: [
      img1,
      img2,
      img3,
      img4
    ],
    priceBefore: 45000000,
    priceNow: 37500000,
    discount: 17,
    features: [
      { icon: '🛏️', title: 'Chambres', desc: '3 chambres spacieuses' },
      { icon: '🚿', title: 'Salles de bain', desc: '2 salles modernes' },
      { icon: '📏', title: 'Superficie', desc: '120 m²' },
      { icon: '🏢', title: 'Étage', desc: '3e étage' },
    ],
    amenities: ['Parking privé', 'Ascenseur', 'Climatisation', 'Cuisine équipée', 'Balcon', 'Sécurité 24h/24'],
    endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    agent: {
      id: '1',
      name: 'Jean Dupont',
      verified: true,
      image: 'JD',
      phone: '+237 690 123 456',
      email: 'jean.dupont@immobilier.com',
      listings: 245,
      sold: 89,
      rating: 4.8,
    },
    location_gps: { lat: 4.0511, lng: 9.7679 },
    suggestions: [
      {
        id: '2',
        title: 'Studio Moderne - Centre Ville',
        price: 8500000,
        discount: 12,
        location: 'Douala, Centre',
      },
      {
        id: '3',
        title: 'Villa 5 Pièces - Résidence Sécurisée',
        price: 75000000,
        discount: 10,
        location: 'Douala, Bonanjo',
      },
      {
        id: '4',
        title: 'Penthouse Luxe - Vue Mer',
        price: 95000000,
        discount: 15,
        location: 'Douala, Face de Rail',
      },
    ],
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPromo(mockPromo);
      setLoading(false);
    }, 500);
  }, [id]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? promo.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === promo.images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const daysLeft = Math.ceil((new Date(promo?.endsAt) - new Date()) / (1000 * 60 * 60 * 24));

  if (loading) {
    return (
      <div className="promo-details-container">
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '1.2rem', color: '#0daebe' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="promo-details-container">
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '1.2rem', color: '#d7263d' }}>
          Offre non trouvée
        </div>
      </div>
    );
  }

  return (
    <>
    <HomeLayout/>
    <div className="promo-details-container">
      {/* Breadcrumb */}
      <div className="promo-breadcrumb">
        <Link to="/">Accueil</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/#promotions">Promotions</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{promo.type}</span>
      </div>

      {/* Main Grid */}
      <div className="promo-main-grid">
        {/* Gallery Section */}
        <div className="promo-gallery-section">
          {/* Main Image */}
          <div className="promo-main-image" onClick={() => setLightboxOpen(true)}>
            <img src={promo.images[currentImageIndex]} alt="Promotion" />
            <div className="promo-gallery-badge">
              📸 {currentImageIndex + 1} / {promo.images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="promo-thumbnails">
            {promo.images.map((img, idx) => (
              <button
                key={idx}
                className={`thumbnail-btn ${idx === currentImageIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="promo-sidebar">
          {/* Price Box */}
          <div className="promo-quick-card promo-price-box">
            <div className="price-label">💰 PRIX PROMO</div>
            <div className="price-before">{formatPrice(promo.priceBefore)}</div>
            <div className="price-now">{formatPrice(promo.priceNow)}</div>
            <div className="price-save">
              ✨ Économies: {formatPrice(promo.priceBefore - promo.priceNow)} (-{promo.discount}%)
            </div>
          </div>

          {/* Quick Info */}
          <div className="promo-quick-card">
            <div className="promo-meta-quick">
              <div className="meta-item">
                <span className="meta-item-icon">⏰</span>
                <div>
                  <strong>Offre expire dans</strong>
                  <br />
                  <span style={{ color: '#d7263d', fontWeight: 'bold' }}>{daysLeft} jours</span>
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-item-icon">📍</span>
                <div>
                  <strong>Localisation</strong>
                  <br />
                  {promo.location}
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-item-icon">🏠</span>
                <div>
                  <strong>Type</strong>
                  <br />
                  {promo.type} {promo.subtype}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="promo-cta-buttons">
            <button className="btn-primary">
              📞 Contacter l'agent
            </button>
            <button className="btn-secondary" onClick={() => setLiked(!liked)}>
              {liked ? '❤️' : '🤍'} {liked ? 'Aimé' : 'Aimer'}
            </button>
            <button className="btn-secondary">
              📤 Partager
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="promo-content-section">
        {/* Title */}
        <div className="promo-type-badge">
          🏷️ {promo.type} • {promo.subtype}
        </div>
        <h1 className="promo-title">{promo.title}</h1>

        {/* Meta Tags */}
        <div className="promo-meta-tags">
          <span className="meta-tag">
            <FaMapMarkerAlt /> {promo.location}
          </span>
          <span className="meta-tag">
            <FaCalendarAlt /> Offre valide {daysLeft} jours
          </span>
          <span className="meta-tag">
            <span style={{ fontSize: '1.2rem' }}>✨</span> -
            {promo.discount}%
          </span>
        </div>

        {/* Description */}
        <div className="promo-description">
          {promo.description}
        </div>

        {/* Features */}
        <h2 className="section-header">
          <span className="section-icon">✨</span> Caractéristiques principales
        </h2>
        <div className="features-grid">
          {promo.features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.desc}</div>
            </div>
          ))}
        </div>

        {/* Amenities */}
        <h2 className="section-header">
          <span className="section-icon">🎁</span> Équipements & Services
        </h2>
        <div className="features-grid">
          {promo.amenities.map((amenity, idx) => (
            <div key={idx} className="feature-card">
              <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>✓</div>
              <div className="feature-title">{amenity}</div>
            </div>
          ))}
        </div>

        {/* Location */}
        <h2 className="section-header">
          <span className="section-icon">📍</span> Localisation
        </h2>
        <div className="location-section">
          <div className="location-info">
            <h3 style={{ marginTop: 0 }}>Quartier {promo.district}</h3>
            <p>
              <strong>Adresse:</strong> {promo.location}
            </p>
            <p>
              <strong>Proximité:</strong> À proximité des écoles, hôpitaux, commerces et transports en commun.
            </p>
            <p>
              <strong>Accessibilité:</strong> Accès facile par la route principale, parking disponible.
            </p>
          </div>
          <div className="location-map">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.5423169844576!2d9.76!3d4.05!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMK0MDMnMDYuMCJOIDnCsDQ1JzQ4LjQiRQ!5e0!3m2!1sfr!2scm!4v1234567890"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ borderRadius: '10px' }}
            ></iframe>
          </div>
        </div>
      </div>

      {/* Agent Section */}
      <div className="agent-section">
        <h2 className="section-header">
          <span className="section-icon">👤</span> Votre Agent Immobilier
        </h2>

        <div className="agent-header">
          <div className="agent-avatar">
            {promo.agent.image}
          </div>
          <div className="agent-info" style={{ flex: 1, textAlign: 'left' }}>
            <h3>
              {promo.agent.name}
              {promo.agent.verified && (
                <span className="verified-badge" title="Vérifié">
                  ✓
                </span>
              )}
            </h3>
            <p>Agent Immobilier Professionnel</p>
            <p>⭐ {promo.agent.rating}/5 - {promo.agent.listings} annonces</p>
          </div>
        </div>

        {/* Stats */}
        <div className="agent-stats">
          <div className="stat-box">
            <div className="stat-value">{promo.agent.listings}</div>
            <div className="stat-label">Annonces</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{promo.agent.sold}</div>
            <div className="stat-label">Vendues</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{promo.agent.rating}</div>
            <div className="stat-label">Évaluation</div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="agent-contact">
          <button className="contact-btn primary">
            <FaPhoneAlt /> Appeler
          </button>
          <button className="contact-btn">
            <FaEnvelope /> Email
          </button>
          <button className="contact-btn">
            💬 Message
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="suggestions-section">
        <h2 className="section-header">
          <span className="section-icon">💡</span> Autres Offres Recommandées
        </h2>

        <div className="suggestions-grid">
          {promo.suggestions.map((suggestion) => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-image">
                <img src={`https://via.placeholder.com/300x200?text=${suggestion.title}`} alt={suggestion.title} />
              </div>
              <div className="suggestion-content">
                <div className="suggestion-title">{suggestion.title}</div>
                <div className="suggestion-price">{formatPrice(suggestion.price)}</div>
                <div className="suggestion-meta">
                  <span style={{ color: '#d7263d', fontWeight: 'bold' }}>-{suggestion.discount}%</span>
                  <span> • {suggestion.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="promo-footer">
        <div className="footer-text">
          Pour plus d'informations sur cette offre ou d'autres bien, n'hésitez pas à nous contacter.
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">
            Mentions légales
          </a>
          <a href="#" className="footer-link">
            Conditions d'utilisation
          </a>
          <a href="#" className="footer-link">
            Politique de confidentialité
          </a>
          <a href="#" className="footer-link">
            Nous contacter
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="lightbox-modal" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={promo.images[currentImageIndex]} alt="Lightbox" className="lightbox-image" />
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
              ✕
            </button>
            <button className="lightbox-nav lightbox-prev" onClick={handlePrevImage}>
              ❮
            </button>
            <button className="lightbox-nav lightbox-next" onClick={handleNextImage}>
              ❯
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PromotionDetailsNew;
