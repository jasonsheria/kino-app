import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaHeart, FaThumbsDown, FaComment, FaUserCircle, FaWhatsapp, FaFacebook, FaPhone, FaRegMoneyBillAlt } from 'react-icons/fa';
import { agents } from '../../data/fakedata';
import { Link } from 'react-router-dom';
import './PromoCard.css';
import AgentContactModal from '../common/AgentContactModal';
import VisitBookingModal from '../common/VisitBookingModal';
import { useNavigate } from 'react-router-dom';
// Props: add images = [] in signature
const PromoCard = ({
  id, title, description, image, images = [],
  agent = null, price = null, oldPrice = null, promoPrice = null, promotion = false,
  initialLikes = 0, initialDislikes = 0, initialComments = [],
  onReserve, onViewAgent
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userAction, setUserAction] = useState('none');
  const [comments, setComments] = useState(initialComments);
  // normalize incoming initialComments to an array to avoid runtime errors
  const navigate = useNavigate();
  React.useEffect(() => {
    try {
      setComments(Array.isArray(initialComments) ? initialComments : []);
    } catch (e) {
      setComments([]);
    }
  }, [initialComments]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isReserved, setIsReserved] = useState(() => {
    try {
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
      return reserved.includes(String(id));
    } catch (e) { return false; }
  });
  const [showBooking, setShowBooking] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showHoverOverlay, setShowHoverOverlay] = useState(false);
  const [overlayRect, setOverlayRect] = useState(null);
  const rootRef = useRef(null);
  // Resolve agent when only id is provided (mirror PropertyCard logic)
  const [resolvedAgent, setResolvedAgent] = useState(() => {
    try {
      return agent && typeof agent === 'object' ? agent : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    const normalize = (v) => {
      if (v === null || v === undefined) return null;
      try {
        const s = String(v);
        const m = s.match(/([a-f0-9]{24})/i);
        if (m && m[1]) return m[1].toLowerCase();
        return s.replace(/"|'|\s/g, '').toLowerCase();
      } catch (e) { return String(v); }
    };

    const tryResolve = () => {
      if (resolvedAgent) return;
      if (agent && typeof agent === 'object') { setResolvedAgent(agent); return; }
      const propNorm = normalize(agent);
      if (agents && agents.length && propNorm) {
        for (const a of agents) {
          const aid = normalize(a.id || a._id || a.agentId || (a.raw && a.raw._id) || (a.raw && a.raw.id));
          if (aid && propNorm === aid) {
            setResolvedAgent(a);
            return;
          }
        }
      }
    };

    tryResolve();
  }, [agent, resolvedAgent]);

  const agentResolved = resolvedAgent || (agent && typeof agent === 'object' ? agent : null);

  const imageArray = Array.isArray(images) && images.length
    ? images.filter(i => typeof i === 'string')
    : (image ? [image] : []);
  const currentImage = imageArray[currentImageIndex] || image;
  const hasGallery = imageArray.length > 1;

  // price display: if promotion active and promoPrice provided, show both
  const showPromo = Boolean(promotion && promoPrice);
  const displayedPrice = showPromo ? promoPrice : price;
  const displayedOldPrice = showPromo ? price : (oldPrice || null);

  const nextImage = (e) => { e && e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % imageArray.length); };
  const prevImage = (e) => { e && e.stopPropagation(); setCurrentImageIndex(i => (i - 1 + imageArray.length) % imageArray.length); };

  useEffect(() => {
    if (!showLightbox) return;
    // lock scroll while lightbox open
    try { require('../../utils/scrollLock').lockScroll(); } catch (e) { /* ignore if helper missing */ }
    const onKey = (e) => { if (e.key === 'ArrowRight') nextImage(); if (e.key === 'ArrowLeft') prevImage(); if (e.key === 'Escape') setShowLightbox(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try { require('../../utils/scrollLock').unlockScroll(); } catch (e) { /* ignore */ }
    };
  }, [showLightbox, imageArray.length]);

  const handleLike = () => {
    if (userAction === 'liked') return;
    setLikes((l) => l + 1);
    if (userAction === 'disliked') setDislikes((d) => Math.max(0, d - 1));
    setUserAction('liked');
  };

  const handleDislike = () => {
    if (userAction === 'disliked') return;
    setDislikes((d) => d + 1);
    if (userAction === 'liked') setLikes((l) => Math.max(0, l - 1));
    setUserAction('disliked');
  };

  const handleToggleComments = () => setShowComments((s) => !s);

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const newComment = { id: Date.now().toString(), author: 'Vous', text };
    setComments((c) => [newComment, ...c]);
    setCommentText('');
    setShowComments(true);
  };

  const handleReserve = () => {
    const promoObj = { id, title, image, price, agent };
    if (typeof onReserve === 'function') return onReserve(promoObj);
    // fallback: open local booking modal
    setShowBooking(true);
  };
  const handleViewAgent = () => onViewAgent?.(agent);

  const openLightbox = () => setShowLightbox(true);
  const closeLightbox = () => setShowLightbox(false);

  useEffect(() => {
    const handler = (e) => {
      const reservedId = e?.detail?.propertyId;
      if (String(reservedId) === String(id)) setIsReserved(true);
    };
    const storageHandler = (e) => {
      if (e.key === 'reserved_properties') {
        try {
          const reserved = JSON.parse(e.newValue || '[]').map(String);
          if (reserved.includes(String(id))) setIsReserved(true);
        } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('property-reserved', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('property-reserved', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [id]);

  const updateOverlayRect = () => {
    try {
      const r = rootRef.current && rootRef.current.getBoundingClientRect();
      if (r) setOverlayRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
    } catch (e) { /* ignore */ }
  };

  return (
    <div ref={rootRef} onMouseEnter={() => { updateOverlayRect(); setShowHoverOverlay(true); }} onMouseMove={() => updateOverlayRect()} onMouseLeave={() => setShowHoverOverlay(false)} className="promo-card border-0 property-card fixed-size animate__animated animate__fadeInUp" style={{ borderRadius: 14,/* keep overflow hidden for image cropping but overlay is portalled */ transition: 'box-shadow .3s', backgroundImage : `url(${currentImage})`, backgroundSize: "cover", backgroundRepeat : "no-repeat", backgroundPosition : "center" }}>
      <div className="property-image" onClick={() => image && openLightbox()} role="button">
       
        <div className="badges">
          <div className="badge status-badge">Promotion</div>
        </div>
        <div className="price-badge">
          {displayedOldPrice ? <div style={{ color: '#9ca3af', textDecoration: 'line-through', fontWeight: 600 }}>{new Intl.NumberFormat().format(displayedOldPrice)} $</div> : null}
          <div style={{ fontWeight: 900, fontSize: '1rem', background : 'brown', padding : '10px', borderRadius : '20px' }}> 🎉 {displayedPrice ? `${new Intl.NumberFormat().format(displayedPrice)} $` : ''}</div>
        </div>

        {hasGallery && (
          <>
            <button className="gallery-nav gallery-nav-prev" onClick={(e) => { e.stopPropagation(); prevImage(e); }} aria-label="Précédent">‹</button>
            <button className="gallery-nav gallery-nav-next" onClick={(e) => { e.stopPropagation(); nextImage(e); }} aria-label="Suivant">›</button>
            <div className="gallery-indicator">
              {imageArray.map((_, idx) => (
                <button key={idx} className={`gallery-dot ${idx === currentImageIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="card-body" style={{ cursor: 'pointer' ,  backgroundColor:' #203c6069'}} onClick={() => navigate(`/properties/${id}`)}>

        <div className="title-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h6 className="card-title mb-0" style={{ marginRight: 8 }}>{title}</h6>
            {oldPrice ? (
              <div className="promo-old-price-inline" style={{ color: '#9ca3af', textDecoration: 'line-through', fontWeight: 600 }}>
                {typeof oldPrice === 'number' ? new Intl.NumberFormat().format(oldPrice) + ' $' : oldPrice}
              </div>
            ) : null}
          </div>
          <div className="promo-description-block text-muted small" style={{ marginTop: 4 }}>
            {description ? (description.length > 200 ? description.slice(0, 200) + '…' : description) : ''}
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-2">
          <div className="d-flex align-items-center gap-2">
            <button className={`icon-btn like ${userAction === 'liked' ? 'active' : ''}`} onClick={handleLike} aria-label="like">
              <FaHeart />
              <span>{likes}</span>
            </button>
            <button className={`icon-btn dislike ${userAction === 'disliked' ? 'active' : ''}`} onClick={handleDislike} aria-label="dislike">
              <FaThumbsDown />
              <span>{dislikes}</span>
            </button>
            {/* <button className="icon-btn comment" onClick={handleToggleComments} aria-label="comments">
              <FaComment />
              <span>{comments.length}</span>
            </button> */}
            <div className="promo-emoji" title="Promotion emoji"> {promoPrice }  </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {oldPrice && price && <div className="promo-savings">{Math.round(((oldPrice - price) / oldPrice) * 100)}% off</div>}
          </div>
        </div>

          {/* {showComments && (
          <div className="promo-comments mt-2">
            <div className="comment-input-row">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }} placeholder="Écrire un commentaire…" />
              <button className="send-btn" onClick={handleAddComment}>Envoyer</button>
            </div>
            <div className="comment-list mt-2">
              {comments.length === 0 && <div className="no-comments">Aucun commentaire.</div>}
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">{c.author && c.author !== 'Vous' ? c.author[0].toUpperCase() : 'V'}</div>
                  <div className="comment-body">
                    <div className="comment-author">{c.author}</div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

       
      </div>
        {agentResolved && (
          <div className={`property-agent d-flex align-items-center p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s ${!isReserved ? 'agent-muted' : ''}`}>
            <div className="property-agent-inner">
              <div className="agent-left">
                <div className="agent-avatar-wrapper">
                  <img src={agentResolved.image} alt={agentResolved.prenom || agentResolved.name} className="agent-thumb" />
                </div>
                <div className="agent-meta">
                  <div className="agent-name fw-semibold small">{agentResolved.name || agentResolved.prenom}</div>
                  <div className="agent-phone small text-muted">{agentResolved.phone}</div>
                </div>
              </div>
              <div className="agent-right">
                <button className="btns btn-outline-success contact-icon ms-2" title="WhatsApp" onClick={() => setShowContact(true)} aria-label={`Contacter ${agentResolved.name || agentResolved.prenom} via WhatsApp`}><FaWhatsapp /></button>
                {showContact && <AgentContactModal agent={agentResolved} open={showContact} onClose={() => setShowContact(false)} />}
                {agentResolved.facebook && (
                  <a href={agentResolved.facebook} target="_blank" rel="noopener noreferrer" className="btns btn-outline-primary contact-icon ms-2" title="Facebook" aria-label={`Visiter la page Facebook de ${agentResolved.name || agentResolved.prenom}`}><FaFacebook /></a>
                )}
                <button className="btns btn-outline-dark contact-icon ms-2" title="Téléphone" aria-label={`Appeler ${agentResolved.name || agentResolved.prenom}`} onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agentResolved.id || agentResolved._id, promoId: id } } }))}><FaPhone /></button>

                {isReserved && <span className="reserved-dot ms-2" aria-hidden="true" title="Réservé" />}
                {!isReserved && (
                  <>
                    <button className="btns btn-success btn-sm fw-bold" onClick={() => {
                      if (typeof onReserve === 'function') return onReserve({ id, title, image, agent: agentResolved });
                      setShowBooking(true);
                    }}><FaRegMoneyBillAlt className="me-1" />Réserver</button>
                    {showBooking && (
                      <VisitBookingModal
                        open={showBooking}
                        onClose={() => setShowBooking(false)}
                        onSuccess={() => {
                          try {
                            const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
                            if (!reserved.includes(String(id))) {
                              reserved.push(String(id));
                              localStorage.setItem('reserved_properties', JSON.stringify(reserved));
                            }
                          } catch (e) { /* ignore */ }
                          window.dispatchEvent(new CustomEvent('property-reserved', { detail: { propertyId: String(id) } }));
                          setIsReserved(true);
                          setShowBooking(false);
                        }}
                        property={{ id, title, image }}
                        agent={agentResolved}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {overlayRect && showHoverOverlay && createPortal(
          <div className="promo-portal-overlay show" style={{ top: overlayRect.top + overlayRect.height - 8, left: overlayRect.left + 8, width: overlayRect.width - 16, transformOrigin: 'center bottom' }} onClick={(e) => e.stopPropagation()}>
            <div className="promo-hover-inner" role="region" aria-label={`Détails promotion pour ${title}`} style={{ padding: 18 }}>
              <div className="promo-hover-top">
                <h3 className="promo-hover-title">{title}</h3>
                {displayedOldPrice ? (
                  <div className="promo-hover-old">{new Intl.NumberFormat().format(displayedOldPrice)} $</div>
                ) : null}
                <div className="promo-hover-price">🎉 {displayedPrice ? `${new Intl.NumberFormat().format(displayedPrice)} $` : ''}</div>
                <p className="promo-hover-desc">{description ? (description.length > 200 ? description.slice(0, 200) + '…' : description) : ''}</p>
                <div className="promo-hover-ctas">
                  <button className="btns btn-success promo-hover-cta" onClick={(e) => { e.stopPropagation(); handleReserve(); }}>Réserver</button>
                  <button className="btns view-btn promo-hover-cta" onClick={(e) => { e.stopPropagation(); navigate(`/properties/${id}`); }}>Voir</button>
                </div>
              </div>
            </div>
          </div>, document.body
        )}

        {showLightbox && imageArray.length > 0 && createPortal(
          <div className="lightbox-full animate__animated animate__fadeIn" role="dialog" aria-modal="true" onClick={closeLightbox}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Fermer la lightbox">×</button>
            <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(e); }} aria-label="Image précédente">‹</button>
            <img src={currentImage} alt={title} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
            <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(e); }} aria-label="Image suivante">›</button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PromoCard;
