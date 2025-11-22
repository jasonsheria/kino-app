import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';

/**
 * ModernImageCarousel - Carrousel d'images moderne avec design doux
 */
export default function ModernImageCarousel({ 
  images = [], 
  name = '', 
  onOpen = () => {} 
}) {
  const [current, setCurrent] = useState(0);
  const autoplayRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    autoplayRef.current = () => setCurrent(c => (c + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!images || images.length <= 1 || isHovered) return;
    const id = setInterval(() => autoplayRef.current(), 5000);
    return () => clearInterval(id);
  }, [images, isHovered]);

  if (!images || images.length === 0) {
    return (
      <div className="image-carousel">
        <div
          className="carousel-main"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
          }}
        >
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <FaImage size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem' }}>Aucune image disponible</p>
          </div>
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((s) => (s - 1 + images.length) % images.length);
  const next = () => setCurrent((s) => (s + 1) % images.length);

  const imageUrl = process.env.REACT_APP_BACKEND_APP_URL + images[current];

  return (
    <div className="image-carousel">
      {/* Main image with controls */}
      <motion.div
        className="carousel-main"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={imageUrl}
            alt={`${name}-${current}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'zoom-in',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onOpen(current)}
          />
        </AnimatePresence>

        {/* Navigation arrows (visible on hover) */}
        <AnimatePresence>
          {isHovered && images.length > 1 && (
            <>
              <motion.button
                onClick={prev}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{
                  position: 'absolute',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaChevronLeft size={20} color="#00cdf2" />
              </motion.button>

              <motion.button
                onClick={next}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaChevronRight size={20} color="#00cdf2" />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Image counter */}
        {images.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '1.2rem',
              right: '1.2rem',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '50px',
              fontSize: '0.85rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              zIndex: 5,
            }}
          >
            {current + 1} / {images.length}
          </motion.div>
        )}
      </motion.div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <motion.div
          className="carousel-thumbnails"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {images.map((img, idx) => (
            <motion.button
              key={idx}
              className={`thumb ${idx === current ? 'active' : ''}`}
              onClick={() => setCurrent(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                border: idx === current ? '2px solid #00cdf2' : '2px solid transparent',
                boxShadow: idx === current ? '0 0 0 3px rgba(0, 205, 242, 0.2)' : 'none',
              }}
            >
              <img
                src={process.env.REACT_APP_BACKEND_APP_URL + img}
                alt={`${name}-thumb-${idx}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
