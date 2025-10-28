
import React, { useState, useEffect, useRef, useCallback } from 'react';
import img11 from '../../img/carousel/kin.jpg';
import img12 from '../../img/carousel/kin3.jpg';
import img13 from '../../img/property-1.jpg';
import img4 from '../../img/Toyota car.jpg';
import img5 from '../../img/Toyota Yaris Cross -2024.jpg';
import './carousel.css';
const carouselData = [
  { id: 1, img: img11, alt: 'Vue de Kinshasa', title: 'Découvrez Kinshasa' },
  { id: 2, img: img4, alt: 'Toyota moderne', title: 'Véhicules Premium' },
  { id: 3, img: img12, alt: 'Architecture Kinshasa', title: 'Propriétés Exclusives' },
  { id: 4, img: img13, alt: 'Bien immobilier', title: 'Maisons & Appartements' },
  { id: 5, img: img5, alt: 'Toyota Yaris Cross', title: 'Location de Véhicules' }
];

const LandingCarousel = () => {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);
  const zoomRef = useRef(null);
  const [zoom, setZoom] = useState(true);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchStartTime = useRef(null);

  const AUTOPLAY_MS = 6000;
  const TRANSITION_MS = 700;
  const ZOOM_MS = 2800;

  const startAutoplay = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setIndex((prev) => (prev + 1) % carouselData.length);
      }
    }, AUTOPLAY_MS);
  }, [isTransitioning]);

  // Autoplay avec transition
  useEffect(() => {
    startAutoplay();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, isTransitioning, startAutoplay]);

  // Animation de zoom
  useEffect(() => {
    setZoom(true);
    if (zoomRef.current) clearTimeout(zoomRef.current);
    zoomRef.current = setTimeout(() => setZoom(false), ZOOM_MS);
    return () => {
      if (zoomRef.current) clearTimeout(zoomRef.current);
    };
  }, [index]);

  // Gestion de la transition
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_MS);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const goTo = useCallback((newIndex) => {
    if (isTransitioning) return;
    const targetIndex = (newIndex + carouselData.length) % carouselData.length;
    setIsTransitioning(true);
    setIndex(targetIndex);
    startAutoplay();
  }, [isTransitioning, startAutoplay]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    goTo(index - 1);
  }, [goTo, index]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    goTo(index + 1);
  }, [goTo, index]);

  // Support tactile amélioré
  const onTouchStart = useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;

    const touch = e.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touchStartX.current - touch.clientX;
    const deltaY = touchStartY.current - touch.clientY;
    const deltaTime = Date.now() - touchStartTime.current;

    // Vérifie si le mouvement est plus horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Vérifie la vitesse et la distance du swipe
      if (Math.abs(deltaX) > 40 && deltaTime < 300) {
        if (deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchStartTime.current = null;
  }, [handleNext, handlePrev]);

  // Styles responsives optimisés
  const containerStyle = {
    background: 'linear-gradient(135deg, #e3eafc 0%, #f0f5ff 100%)',
    maxHeight: '100vh',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    touchAction: 'pan-y pinch-zoom'
  };

  const controlSize = 'clamp(40px, 5vw, 48px)';
  const indicatorSize = 'clamp(6px, 1.5vw, 8px)';

  return (
    <div 
      className="carousel w-100 position-relative" 
      style={containerStyle} 
      onTouchStart={onTouchStart} 
      onTouchEnd={onTouchEnd}
    >
      <div className="carousel-inner h-100 w-100 position-relative" style={{ overflow: 'hidden' }}>
        {carouselData.map((slide, i) => (
          <div
            className={`carousel-item h-100 w-100${i === index ? ' active' : ''}`}
            key={slide.id}
            style={{
              // position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: i === index ? 1 : 0,
              transition: `opacity ${TRANSITION_MS}ms ease-out`,
              zIndex: i === index ? 2 : 1,
              pointerEvents: i === index ? 'auto' : 'none',
            }}
          >
            <img
              src={slide.img}
              alt={slide.alt}
              className="d-block w-100 h-100 carousel-image"
              loading="eager"
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                filter: 'brightness(1)',
                transition: `filter ${TRANSITION_MS}ms ease-out, transform 2.2s cubic-bezier(.23,1,.32,1)`,
                transform: i === index ? (zoom ? 'scale(1.06)' : 'scale(1)') : 'scale(1)',
              }}
            />
            <div 
              className="position-absolute bottom-0 start-0 w-100 p-3"
              style={{
                background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
                color: '#fff',
                transform: i === index ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.5s ease-out',
                opacity: i === index ? 1 : 0,
              }}
            >
              <h3 
                className="m-0 text-white" 
                style={{
                  fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {slide.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Contrôles de navigation */}
      <button
        aria-label="Précédent"
        onClick={handlePrev}
        disabled={isTransitioning}
        className="carousel-control carousel-control-prev"
        style={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200,
          width: controlSize,
          height: controlSize,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          cursor: isTransitioning ? 'default' : 'pointer',
          opacity: isTransitioning ? 0.6 : 1,
          transition: 'opacity 0.2s, transform 0.2s',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="var(--ndaku-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        aria-label="Suivant"
        onClick={handleNext}
        disabled={isTransitioning}
        className="carousel-control carousel-control-next"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200,
          width: controlSize,
          height: controlSize,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          cursor: isTransitioning ? 'default' : 'pointer',
          opacity: isTransitioning ? 0.6 : 1,
          transition: 'opacity 0.2s, transform 0.2s',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="var(--ndaku-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Indicateurs de position */}
      <div 
        className="carousel-indicators position-absolute bottom-0 start-50 translate-middle-x mb-2"
        style={{
          display: 'flex',
          gap: '8px',
          zIndex: 200
        }}
      >
        {carouselData.map((_, i) => (
          <button
            key={i}
            onClick={() => !isTransitioning && goTo(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: indicatorSize,
              height: indicatorSize,
              padding: 0,
              borderRadius: '50%',
              border: 'none',
              background: i === index ? 'var(--ndaku-primary)' : 'rgba(255,255,255,0.8)',
              cursor: isTransitioning ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isTransitioning ? 0.6 : 1,
              transform: i === index ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingCarousel;
