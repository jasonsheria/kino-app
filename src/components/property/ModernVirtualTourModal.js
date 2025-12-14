import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaExpand,
  FaChevronLeft,
  FaChevronRight,
  FaVideo,
} from 'react-icons/fa';
import { IconButton } from '@mui/material';

/**
 * ModernVirtualTourModal - Modal de visite virtuelle moderne avec animations fluides
 */
export default function ModernVirtualTourModal({
  videos = [],
  selectedIndex = 0,
  onClose = () => {},
  onSelect = () => {},
}) {
  const [index, setIndex] = useState(selectedIndex || 0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    setIndex(selectedIndex || 0);
  }, [selectedIndex]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toYoutubeEmbed = (url) => {
    if (!url) return url;
    try {
      if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) {}
    return url;
  };

  const getYoutubeEmbedWithAutoplay = (url, autoplay = false) => {
    if (!url) return url;
    let src = toYoutubeEmbed(url);
    const sep = src.includes('?') ? '&' : '?';
    return (
      src +
      (autoplay ? `${sep}autoplay=1&rel=0&controls=1` : `${sep}rel=0&controls=1`)
    );
  };

  const isYoutube = (url) =>
    url &&
    (url.includes('youtube') ||
      url.includes('youtu') ||
      url.includes('watch?v=') ||
      url.includes('youtu.be'));

  const getVideoUrl = (url) => {
    if (!url) return '';
    // If already a full URL (starts with http or https), return as is
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    // If it's a relative path, prepend backend URL if available
    if (typeof url === 'string' && process.env.REACT_APP_BACKEND_APP_URL) {
      return process.env.REACT_APP_BACKEND_APP_URL + url;
    }
    // Fallback: return as is
    return url || '';
  };

  const getVideoType = (url) => {
    if (!url || typeof url !== 'string') return 'video/mp4';
    const u = url.split('?')[0].toLowerCase();
    if (u.endsWith('.mp4')) return 'video/mp4';
    if (u.endsWith('.webm')) return 'video/webm';
    if (u.endsWith('.ogg') || u.endsWith('.ogv')) return 'video/ogg';
    if (u.endsWith('.mov') || u.endsWith('.qt')) return 'video/quicktime';
    if (u.endsWith('.avi')) return 'video/avi';
    if (u.endsWith('.mkv')) return 'video/x-matroska';
    if (u.endsWith('.flv')) return 'video/x-flv';
    if (u.endsWith('.wmv')) return 'video/x-ms-wmv';
    // Default to mp4 if format cannot be determined
    return 'video/mp4';
  };

  const prev = () => setIndex((s) => (s - 1 + videos.length) % videos.length);
  const next = () => setIndex((s) => (s + 1) % videos.length);

  const toggleMute = () => setMuted((m) => !m);
  const goFull = () => videoRef.current?.requestFullscreen?.();

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const current = videos[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '20px',
            overflow: 'hidden',
            width: '90%',
            maxWidth: isMobile ? '100%' : '1000px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, rgba(0, 205, 242, 0.05) 0%, transparent 100%)',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FaVideo size={24} color="#00cdf2" /> Visite Virtuelle
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                Vidéo {index + 1} sur {videos.length}
              </p>
            </div>
            <IconButton
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                color: '#1f2937',
                width: 40,
                height: 40,
              }}
            >
              <FaTimes />
            </IconButton>
          </motion.div>

          {/* Video Container */}
          <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (playing) setShowControls(false);
            }}
            style={{
              flex: 1,
              background: '#000',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {current && isYoutube(current) ? (
              <iframe
                src={getYoutubeEmbedWithAutoplay(current, playing)}
                title={`video-${index}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : current ? (
              videoError ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    padding: '2rem',
                  }}
                >
                  <FaVideo size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Impossible de lire la vidéo
                  </p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                    Le navigateur ne prend pas en charge ce format.
                  </p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                    URL: {getVideoUrl(current)?.substring(0, 50)}...
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => setVideoError(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: '#00cdf2',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Réessayer
                    </button>
                  </div>
                </motion.div>
              ) : (
                <video
                  key={current}
                  ref={videoRef}
                  controls
                  controlsList="nodownload"
                  playsInline
                  webkitPlaysInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000',
                  }}
                  muted={muted}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onError={(e) => {
                    console.error('Video error:', e.target.error, { current, url: getVideoUrl(current) });
                    setVideoError(true);
                  }}
                >
                  {/* Support multiple video formats for cross-browser compatibility */}
                  <source
                    src={getVideoUrl(current)}
                    type="video/mp4"
                  />
                  <source
                    src={getVideoUrl(current)}
                    type="video/webm"
                  />
                  <source
                    src={getVideoUrl(current)}
                    type="video/ogg"
                  />
                  <source
                    src={getVideoUrl(current)}
                    type="video/quicktime"
                  />
                  Votre navigateur ne supporte pas la lecture vidéo
                </video>
              )
            ) : (
              <div style={{ color: '#fff', textAlign: 'center' }}>Aucune vidéo disponible</div>
            )}

            {/* Floating Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '1rem',
                    borderRadius: '50px',
                    backdropFilter: 'blur(10px)',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {videos.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                      >
                        <FaChevronLeft /> Préc.
                      </button>
                      <button
                        onClick={next}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                      >
                        Suiv. <FaChevronRight />
                      </button>
                    </>
                  )}

                  <button
                    onClick={toggleMute}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    {muted ? <FaVolumeMute /> : <FaVolumeUp />} {muted ? 'Son' : 'Muet'}
                  </button>

                  {!isMobile && (
                    <button
                      onClick={goFull}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                    >
                      <FaExpand /> Plein écran
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Thumbnail strip */}
          {videos.length > 1 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                display: 'flex',
                gap: '0.8rem',
                padding: '1rem',
                background: '#f9fafb',
                borderTop: '1px solid #e5e7eb',
                overflowX: 'auto',
              }}
            >
              {videos.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setIndex(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: '0 0 80px',
                    height: '60px',
                    borderRadius: '10px',
                    border: idx === index ? '2px solid #00cdf2' : '2px solid #d1d5db',
                    background: idx === index ? 'rgba(0, 205, 242, 0.1)' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: idx === index ? '#00cdf2' : '#6b7280',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
