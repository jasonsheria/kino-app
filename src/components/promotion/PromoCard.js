import React, { useState } from 'react';
import { FaHeart, FaShare, FaArrowRight,  FaTag, FaFire } from 'react-icons/fa';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import './PromoCard.css';

const PromoCard = ({
  id,
  title,
  description,
  image,
  oldPrice,
  newPrice,
  discountPercent = 0,
  likes = 0,
  comments = [],
  onLike,
  onShare,
  onComment,
  isHot = false,
  isTrending = false,
  promoId,
  category = 'Immobilier'
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Handle like button click
  const handleLike = () => {
    if (!isLiked) {
      setLikeCount(likeCount + 1);
      setIsLiked(true);
      onLike?.(id || promoId);
    }
  };

  // Handle share button click
  const handleShare = () => {
    onShare?.(id || promoId);
  };

  // Handle add comment
  const handleAddComment = () => {
    if (commentText.trim()) {
      onComment?.(id || promoId, commentText);
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  // Calculate discount display
  const discount = discountPercent || (oldPrice && newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : 0);
  const savings = oldPrice && newPrice ? oldPrice - newPrice : 0;

  return (
    <div className="promo-card-wrapper">
      <div className="promo-card animate-card">
        {/* Hot / Trending Badge */}
        {(isHot || isTrending) && (
          <div className={`promo-badge-hot ${isHot ? 'hot' : 'trending'}`}>
            {isHot ? (
              <>
                <FaFire size={16} />
                <span>HOT</span>
              </>
            ) : (
              <>
                <FaFire size={16} />
                
                <span>TENDANCE</span>
              </>
            )}
          </div>
        )}

        {/* Image Container */}
        <div className="promo-image-wrapper">
          <div className="promo-image-overlay"></div>
          <img src={image} alt={title} className="promo-image" loading="lazy" />

          {/* Discount Badge - Animated */}
          {discount > 0 && (
            <div className="promo-discount-badge">
              <div className="badge-content">
                <div className="badge-percent">-{discount}%</div>
                <div className="badge-save">Économisez</div>
              </div>
            </div>
          )}

          {/* Category Tag */}
          <div className="promo-category-tag">
            <FaTag size={12} />
            <span>{category}</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="promo-content">
          {/* Title */}
          <h3 className="promo-title">{title}</h3>

          {/* Description */}
          <p className="promo-description">
            {description && description.length > 100
              ? description.substring(0, 100) + '...'
              : description}
          </p>

          {/* Price Section */}
          <div className="promo-price-section">
            {oldPrice && (
              <span className="promo-old-price">{oldPrice.toLocaleString()} $</span>
            )}
            {newPrice && (
              <span className="promo-new-price">
                {newPrice.toLocaleString()} $
              </span>
            )}
            {savings > 0 && (
              <span className="promo-savings">
                Économie: {savings.toLocaleString()} $
              </span>
            )}
          </div>

          {/* Limited Offer Banner */}
          <div className="promo-limited-banner">
            ⏰ Offre limitée : réservez avant la fin du mois !
          </div>

          {/* Engagement Stats */}
          <div className="promo-stats">
            <div className="stat-item">
              <span className="stat-icon">👍</span>
              <span className="stat-value">{likeCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-value">{comments.length}</span>
            </div>

          </div>

          {/* Comments Preview */}
          {comments.length > 0 && (
            <div className="promo-comments-preview">
              {comments.slice(0, 2).map((comment) => (
                <div key={comment.id} className="comment-preview">
                  <strong className="comment-author">{comment.author}:</strong>
                  <span className="comment-text">
                    {comment.text.substring(0, 50)}
                    {comment.text.length > 50 ? '...' : ''}
                  </span>
                </div>
              ))}
              {comments.length > 2 && (
                <div className="comments-more">+{comments.length - 2} autre(s)</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="promo-actions">
            <button
              className={`promo-action-btn like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              title="J'aime"
            >
              <FaHeart size={16} />
              <span>J'aime</span>
            </button>

            <button
              className="promo-action-btn share-btn"
              onClick={handleShare}
              title="Partager"
            >
              <FaShare size={16} />
              <span>Partager</span>
            </button>

            <Link to={`/promotion/${id || promoId}`} style={{ textDecoration: 'none', flex: 1 }}>
              <button className="promo-action-btn view-btn">
                <span>Voir l'offre</span>
                <FaArrowRight size={14} />
              </button>
            </Link>
          </div>

          {/* Comment Input */}
          {showCommentInput && (
            <div className="promo-comment-input">
              <input
                type="text"
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                }}
                className="comment-input-field"
              />
              <div className="comment-input-actions">
                <button className="btn-cancel" onClick={() => setShowCommentInput(false)}>
                  Annuler
                </button>
                <button className="btn-send" onClick={handleAddComment}>
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {/* Toggle Comment Input */}
          {!showCommentInput && (
            <button
              className="promo-comment-toggle"
              onClick={() => setShowCommentInput(true)}
            >
              💬 Ajouter un commentaire
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoCard;
