import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PromotionDetails.css';

// Minimal mock loader - replace with real API call when available
const mockPromotions = {
  '1': {
    id: '1',
    title: 'Remise exceptionnelle sur appartement 3 pièces',
    description: 'Bel appartement lumineux proche de toutes commodités. Offre limitée avec remise de lancement.',
    images: [
      '/img/promo-1-1.jpg',
      '/img/promo-1-2.jpg',
      '/img/promo-1-3.jpg'
    ],
    type: 'Appartement',
    location: 'Douala, Akwa',
    priceBefore: 45000000,
    priceNow: 37500000,
    endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    comments: [
      { id: 'c1', author: 'Marie', text: "Très belle offre, je recommande la visite.", time: Date.now() - 3600 * 1000 },
      { id: 'c2', author: 'Paul', text: 'Le prix est attractif pour le quartier.', time: Date.now() - 2 * 3600 * 1000 }
    ]
  }
};

function formatCurrency(v) {
  try { return v.toLocaleString('fr-FR'); } catch (e) { return v; }
}

const PromotionDetails = () => {
  const { id } = useParams();
  const [promo, setPromo] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    // Replace with API call: fetch(`/api/promotions/${id}`)...
    const p = mockPromotions[id] || Object.values(mockPromotions)[0];
    setPromo(p);
  }, [id]);

  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min((promo?.images?.length||1)-1, i+1));
      if (e.key === 'ArrowLeft') setActiveIndex(i => Math.max(0, i-1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, promo]);

  if (!promo) return <div className="promo-container">Offre introuvable.</div>;

  const openLightbox = (index) => { setActiveIndex(index); setLightboxOpen(true); };

  return (
    <div className="promo-container">
      <div className="promo-grid">
        <div className="promo-gallery">
          <div className="promo-main-image" onClick={() => openLightbox(activeIndex)}>
            <img src={promo.images[activeIndex]} alt={`Image ${activeIndex+1}`} />
          </div>
          <div className="promo-thumbs">
            {promo.images.map((img, i) => (
              <button key={i} className={`thumb-btn ${i===activeIndex?'active':''}`} onClick={() => setActiveIndex(i)}>
                <img src={img} alt={`Vignette ${i+1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="promo-details">
          <h1>{promo.title}</h1>
          <div className="promo-meta">
            <div><strong>Type :</strong> {promo.type}</div>
            <div><strong>Localisation :</strong> {promo.location}</div>
            <div><strong>Fin de l'offre :</strong> {new Date(promo.endsAt).toLocaleString()}</div>
          </div>

          <div className="promo-pricing">
            <div className="price-before">Prix avant : <span>{formatCurrency(promo.priceBefore)} XAF</span></div>
            <div className="price-now">Prix maintenant : <span>{formatCurrency(promo.priceNow)} XAF</span></div>
          </div>

          <p className="promo-desc">{promo.description}</p>

          <div className="promo-actions">
            <Link to="/contact" className="btn">Contacter le vendeur</Link>
            <Link to="/properties/1" className="btn btn-outline">Voir le bien</Link>
          </div>

          <section className="promo-comments">
            <h3>Commentaires</h3>
            {promo.comments.length===0 && <div className="no-comments">Aucun commentaire pour le moment.</div>}
            <ul>
              {promo.comments.map(c => (
                <li key={c.id} className="comment-item">
                  <div className="comment-author">{c.author}</div>
                  <div className="comment-text">{c.text}</div>
                  <div className="comment-time">{new Date(c.time).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {lightboxOpen && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lb-close" onClick={() => setLightboxOpen(false)}>×</button>
            <button className="lb-prev" onClick={() => setActiveIndex(i => Math.max(0, i-1))} aria-label="Précédent">‹</button>
            <img src={promo.images[activeIndex]} alt={`Grande vue ${activeIndex+1}`} className="lb-image" />
            <button className="lb-next" onClick={() => setActiveIndex(i => Math.min((promo.images.length||1)-1, i+1))} aria-label="Suivant">›</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionDetails;
