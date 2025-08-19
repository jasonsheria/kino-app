
import React, { useState, useEffect, useRef } from 'react';
import img11 from '../../img/carousel/kin.jpg';
import img12 from '../../img/carousel/kin3.jpg';
import img13 from '../../img/property-1.jpg';
import img4 from '../../img/Toyota car.jpg';
import img5 from '../../img/Toyota Yaris Cross -2024.jpg';
const images = [img11,img4, img12, img13, img5];





const LandingCarousel = () => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef(null);
  const zoomRef = useRef(null);
  const [zoom, setZoom] = useState(true); // true: zoom in, false: zoom out
  const touchStartX = useRef(null);

  const AUTOPLAY_MS = 7500;

  // autoplay with resettable timeout
  useEffect(() => {
    const start = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, AUTOPLAY_MS);
    };
    start();
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  // Animation zoom in/out on active image
  useEffect(() => {
    setZoom(true);
    if (zoomRef.current) clearTimeout(zoomRef.current);
    zoomRef.current = setTimeout(() => setZoom(false), 2800);
    return () => clearTimeout(zoomRef.current);
  }, [index]);

  const goTo = (newIndex) => {
    setLoaded(false);
    setIndex((newIndex + images.length) % images.length);
    // reset autoplay
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    goTo(index - 1);
  };
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    goTo(index + 1);
  };

  // touch / swipe support
  const onTouchStart = (e) => { touchStartX.current = e.touches?.[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX == null) return;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(index + 1); else goTo(index - 1);
    }
    touchStartX.current = null;
  };

  // responsive container height: avoid forcing 100vh which causes layout/jump issues on mobile
  const containerStyle = {
    background: '#e3eafc',
    minHeight: 320,
    height: 'min(72vh, 560px)',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative'
  };

  const controlSize = 'clamp(44px, 6vw, 56px)';

  return (
    <div className="carousel w-100 position-relative" style={containerStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="carousel-inner h-100 w-100 position-relative" style={{ overflow: 'hidden' }}>
        {images.map((img, i) => (
          <div
            className={`carousel-item h-100 w-100${i === index ? ' active' : ''}`}
            key={img}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: i === index && loaded ? 1 : 0,
              transition: 'opacity 0.7s',
              zIndex: i === index ? 2 : 1,
              pointerEvents: i === index ? 'auto' : 'none',
            }}
          >
            <img
              src={img}
              alt={`carousel-${i}`}
              className="d-block w-100 h-100 carousel-image"
              onLoad={() => setLoaded(true)}
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                filter: loaded ? 'brightness(1)' : 'brightness(0.95) blur(2px)',
                transition: 'filter 0.7s, transform 2.2s cubic-bezier(.77,0,.18,1)',
                transform: i === index && loaded ? (zoom ? 'scale(1.06)' : 'scale(1)') : 'scale(1)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Left control */}
      <button
        aria-label="Précédent"
        onClick={handlePrev}
        className="carousel-control carousel-control-prev"
        style={{
          position: 'absolute',
          left: 12,
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
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="#0b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Right control */}
      <button
        aria-label="Suivant"
        onClick={handleNext}
        className="carousel-control carousel-control-next"
        style={{
          position: 'absolute',
          right: 12,
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
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="#0b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default LandingCarousel;
