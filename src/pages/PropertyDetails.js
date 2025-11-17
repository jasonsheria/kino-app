import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { properties, agents } from '../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaStepBackward, FaStepForward, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand, FaTimes } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../pages/HomeSection.css';
import '../pages/PropertyDetails.css';
import ChatWidget from '../components/common/Messenger';
import AgentContactModal from '../components/common/AgentContactModal';
import FooterPro from '../components/common/Footer';
import '../components/property/PropertyCard.css';
import VisitBookingModal from '../components/common/VisitBookingModal';
import { Button, IconButton } from '@mui/material';
import HomeLayout from '../components/homeComponent/HomeLayout';
import AgentProfileCard from '../components/property/AgentProfileCard';
import SuggestionsEnhanced from '../components/property/SuggestionsEnhanced';
import AmenitiesSection from '../components/property/AmenitiesSection';
// Redesigned image carousel (thumbnail strip + main image + simple autoplay)
function ImageCarousel({ images = [], name = '', onOpen = () => { } }) {
  const [current, setCurrent] = useState(0);
  const autoplayRef = useRef();
  useEffect(() => {
    autoplayRef.current = () => setCurrent(c => (c + 1) % images.length);
  }, [images.length]);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = setInterval(() => autoplayRef.current(), 5000);
    return () => clearInterval(id);
  }, [images]);
  if (!images || images.length === 0) return null;

  const prev = () => setCurrent((s) => (s - 1 + images.length) % images.length);
  const next = () => setCurrent((s) => (s + 1) % images.length);

  return (
    <div className="image-carousel">
      <div className="carousel-main position-relative rounded overflow-hidden">
        <img src={process.env.REACT_APP_BACKEND_APP_URL + images[current]} alt={`${name}-${current}`} className="w-100" style={{ objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => onOpen(current)} />
        <div className="carousel-dots position-absolute bottom-0 w-100 d-flex justify-content-center gap-1 mb-2">
          {images.map((_, i) => (
            <button key={i} className={`dot btn btn-sm ${i === current ? 'btn-success' : 'btn-light'}`} onClick={() => setCurrent(i)} style={{ width: 10, height: 10, padding: 0, borderRadius: 20 }} />
          ))}
        </div>
      </div>

      <div className="d-flex gap-2 mt-2 overflow-auto py-2">
        {images.map((img, idx) => (
          <div key={idx} className={`thumb rounded overflow-hidden ${idx === current ? 'border-success' : 'border-0'}`} style={{ width: 120, flex: '0 0 auto', cursor: 'pointer' }} onClick={() => setCurrent(idx)}>
            <img src={process.env.REACT_APP_BACKEND_APP_URL + img} alt={`${name}-thumb-${idx}`} style={{ width: '100%', height: 70, objectFit: 'cover' }} onClick={() => onOpen(idx)} />
          </div>
        ))}
      </div>
    </div>
  );
}



// Animated modal to show virtual tour videos with controls and thumbnails
function VirtualTourModal({ videos = [], selectedIndex = 0, onClose = () => { }, onSelect = () => { } }) {
  const [index, setIndex] = useState(selectedIndex || 0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [progress, setProgress] = useState(0);
  const [youtubeKey, setYoutubeKey] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => { setIndex(selectedIndex || 0); }, [selectedIndex]);

  const toYoutubeEmbedLocal = (url) => {
    if (!url) return url;
    try {
      if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) { }
    return url;
  };

  const getYoutubeEmbedWithAutoplay = (url, autoplay = false) => {
    if (!url) return url;
    let src = toYoutubeEmbedLocal(url);
    const sep = src.includes('?') ? '&' : '?';
    return src + (autoplay ? `${sep}autoplay=1&rel=0&controls=1` : `${sep}rel=0&controls=1`);
  };

  const current = videos[index];
  const isYoutube = (url) => url && (url.includes('youtube') || url.includes('youtu') || url.includes('watch?v=') || url.includes('youtu.be'));

  // Try to guess MIME type from file extension for <source> tag
  const getVideoType = (url) => {
    if (!url || typeof url !== 'string') return '';
    const u = url.split('?')[0].toLowerCase();
    if (u.endsWith('.mp4')) return 'video/mp4';
    if (u.endsWith('.webm')) return 'video/webm';
    if (u.endsWith('.ogg') || u.endsWith('.ogv')) return 'video/ogg';
    return 'video/mp4'; // fallback guess
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); } else { videoRef.current.pause(); setPlaying(false); }
  };
  const toggleMute = () => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); };
  const next = () => { const nextIdx = (index + 1) % videos.length; setIndex(nextIdx); onSelect(nextIdx); };
  const prev = () => { const prevIdx = (index - 1 + videos.length) % videos.length; setIndex(prevIdx); onSelect(prevIdx); };
  const goFull = () => { if (!videoRef.current) return; if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen(); else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen(); };
  
  // update progress for HTML5 video
  useEffect(() => {
    const el = videoRef.current;
    if (!el) { setProgress(0); return; }
    const onTime = () => { try { setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0); } catch (e) {} };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', () => { setPlaying(false); setProgress(100); });
    return () => {
      el.removeEventListener('timeupdate', onTime);
    };
  }, [videoRef, index]);

  // keyboard shortcuts: space play/pause, arrows for prev/next
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') { e.preventDefault(); if (isYoutube(current)) { /* cannot control iframe */ } else togglePlay(); }
      if (e.code === 'ArrowRight') { next(); }
      if (e.code === 'ArrowLeft') { prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, current]);

  // responsive: detect mobile breakpoint and update
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (ev) => setIsMobile(ev.matches ?? mq.matches);
    // set initial
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', onChange); else mq.removeListener(onChange); };
  }, []);

  // Auto-hide mobile controls after 3s of inactivity
  useEffect(() => {
    if (!isMobile || !showControls) return;
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, isMobile]);

  const handleSelect = (i) => {
    const v = videos[i];
    setVideoError(false);
    setIndex(i);
    onSelect(i);
    if (isYoutube(v)) {
      // reload iframe with autoplay
      setYoutubeKey(k => k + 1);
      setPlaying(true);
    } else {
      // reset and play HTML5 video
      setVideoKey(k => k + 1);
      setTimeout(() => {
        if (videoRef.current) { try { videoRef.current.play(); setPlaying(true); } catch (e) {} }
      }, 150);
    }
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: isMobile ? '100%' : 'min(92vh,800px)',
          width: isMobile ? '100%' : 'min(1100px,96%)',
          margin: isMobile ? 0 : 'auto',
          background: '#000',
          borderRadius: isMobile ? 0 : '12px 12px 0 0',
          overflow: 'hidden',
          zIndex: 12001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 60px rgba(0,0,0,0.2)'
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 16, 
            padding: '16px',
            background: 'linear-gradient(rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
            position: 'absolute',
            left: 0,
            right: 0,
            top: 15,
            zIndex: 2,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: isMobile ? (showControls ? 1 : 0) : 1,
            transform: isMobile ? (showControls ? 'translateY(0)' : 'translateY(-20px)') : 'none',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}>
            <IconButton onClick={onClose} aria-label="Fermer la visite" size="small" style={{ color: '#fff', background: 'rgba(0,0,0,0.5)', width: 36, height: 36 }}>
              <FaTimes />
            </IconButton>
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              color: '#fff'
            }}>
              <div style={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: 0.7
              }}>
                Visite virtuelle
              </div>
              <div style={{ 
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                Vidéo {index + 1} sur {videos.length}
              </div>
            </div>
            {!isMobile ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="outlined" color="inherit" size="small" onClick={prev} startIcon={<FaStepBackward />}>Préc.</Button>
                <Button variant="outlined" color="inherit" size="small" onClick={next} startIcon={<FaStepForward />}>Suiv.</Button>
                <Button variant="outlined" color="inherit" size="small" onClick={toggleMute} startIcon={muted ? <FaVolumeMute /> : <FaVolumeUp />}>{muted ? 'Activer son' : 'Couper'}</Button>
                <Button variant="outlined" color="inherit" size="small" onClick={goFull} startIcon={<FaExpand />}>Plein écran</Button>
                <Button variant="outlined" style={{color : '#00a8a7', border : '1px solid #00a8a7'}} color="error" size="small" onClick={onClose} startIcon={<FaTimes />}>Fermer</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outlined" style={{color : '#00a8a7', border : '1px solid #00a8a7'}} color="error" size="small" onClick={onClose} startIcon={<FaTimes />}>Fermer</Button>
              </div>
            )}
          </div>

          <div style={{ padding: 12, display: 'flex', gap: 12, flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch' }}>
          <div 
            style={{ 
              flex: 1,
              minHeight: isMobile ? '60vh' : 420,
              display: 'flex',
              flexDirection: 'column',
              background: '#000',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            onClick={() => isMobile && setShowControls(prev => !prev)}>
              {current && isYoutube(current) ? (
                <iframe key={youtubeKey} src={getYoutubeEmbedWithAutoplay(current, playing)} title={`video-${index}`} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
              ) : (
                // If there is no current video or the browser cannot play it, show a friendly message
                current ? (
                  videoError ? (
                      <div style={{ color: '#fff', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Impossible de lire la vidéo</div>
                        <div className="small">Le navigateur ne prend pas en charge ce format ou la source est invalide.</div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-sm btn-light" onClick={() => { setVideoError(false); setVideoKey(k => k + 1); }}>Réessayer</button>
                          <a className="btn btn-sm btn-outline-light" href={process.env.REACT_APP_BACKEND_APP_URL+current} target="_blank" rel="noopener noreferrer">Télécharger</a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <video
                          key={videoKey}
                          ref={videoRef}
                          controls
                          playsInline
                          webkitPlaysInline
                          preload="metadata"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          muted={muted}
                          onPlay={() => setPlaying(true)}
                          onPause={() => setPlaying(false)}
                          onError={() => { console.error('Video playback error for', current); setVideoError(true); }}
                        >
                          <source src={process.env.REACT_APP_BACKEND_APP_URL+current} type={getVideoType(current)} />
                          {/* Fallback text for very old browsers */}
                          Votre navigateur ne prend pas en charge la lecture de vidéos.
                        </video>
                        {/* simple progress bar */}
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: 'rgba(255,255,255,0.12)' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--ndaku-primary)' }} />
                        </div>
                        {/* Mobile central play overlay */}
                        {isMobile && current && !isYoutube(current) && !videoError && !playing && (
                          <Button onClick={() => { if (videoRef.current) { try { videoRef.current.play(); setPlaying(true); } catch (e) {} } }} variant="outlined"  color="primary" startIcon={<FaPlay />} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: '8px 12px', color: '#fff', color : '#00a8a7', border : '1px solid #00a8a7' }}>
                            Lire
                          </Button>
                        )}
                      </div>
                    )
                ) : (
                  <div style={{ color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Aucune vidéo disponible</div>
                    <div className="small">Cette annonce ne contient pas de source vidéo valide.</div>
                  </div>
                )
              )}
              {isMobile && (
                <div style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  bottom: 0,
                  background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.9) 100%)',
                  padding: '60px 20px 24px',
                  opacity: showControls ? 1 : 0,
                  transform: showControls ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}>
                  {/* Progress bar */}
                  <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: 4,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}>
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${progress}%`,
                      background: '#fff',
                      transition: 'width 0.1s linear',
                      borderRadius: 2
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      left: `${progress}%`,
                      width: 20,
                      height: 20,
                      transform: 'translateX(-50%)',
                      opacity: showControls ? 1 : 0,
                      transition: 'opacity 0.2s ease'
                    }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                        margin: '4px'
                      }} />
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 20
                  }}>
                    {/* Main controls */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24
                    }}>
                      <IconButton onClick={prev} aria-label="Précédent" size="large" sx={{ width: 44, height: 44, color: '#fff' }}>
                        <FaStepBackward />
                      </IconButton>
                      <Button onClick={togglePlay} variant="outlined" style={{color : '#00a8a7', border : '1px solid #00a8a7'}} color="secondary" aria-label={playing ? 'Pause' : 'Lire'} sx={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }} startIcon={playing ? <FaPause /> : <FaPlay />}>
                        {/* icon only, label provided via aria */}
                      </Button>
                      <IconButton onClick={next} aria-label="Suivant" size="large" sx={{ width: 44, height: 44, color: '#fff' }}>
                        <FaStepForward />
                      </IconButton>
                    </div>

                    {/* Secondary controls */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}>
                      <IconButton onClick={toggleMute} aria-label={muted ? 'Activer son' : 'Couper le son'} size="medium" sx={{ width: 44, height: 44, color: '#fff' }}>
                        {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                      </IconButton>
                      <IconButton onClick={goFull} aria-label="Plein écran" size="medium" sx={{ width: 44, height: 44, color: '#fff' }}>
                        <FaExpand />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={isMobile ? { width: '100%', display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', padding: '8px 6px', alignItems: 'center' } : { width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, display: isMobile ? 'none' : 'block' }}>Liste des vidéos</div>
              <div style={isMobile ? { display: 'flex', gap: 8 } : { overflowY: 'auto', flex: 1, paddingRight: 6 }}>
                {videos.map((v, i) => (
                  <div key={i} className={`d-flex gap-2 align-items-center p-2 rounded ${i === index ? 'border border-success' : 'border-0'}`} style={{ cursor: 'pointer', minWidth: isMobile ? 220 : undefined, padding: isMobile ? 8 : undefined }} onClick={() => handleSelect(i)}>
                    <div style={{ width: 88, height: 56, flex: '0 0 auto', overflow: 'hidden', borderRadius: 6, background: '#ddd' }}>
                      {isYoutube(v) ? (
                        <img src={`https://img.youtube.com/vi/${(v.split('v=')[1] || v.split('/').pop()).split('&')[0]}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`thumb-${i}`} />
                      ) : (
                        <video src={v} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>Vidéo {i + 1}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 140 }}>{String(v).split('/').pop()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // local state for the property so we can refresh when global `properties` array is updated
  const [property, setProperty] = useState(() => properties.find(p => String(p.id || p._id) === String(id)));
  // Evaluation modal state
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answers, setAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  // refresh property when fakedata finishes loading and emits an event
  useEffect(() => {
    console.log("listes des agents", agents);
    console.log("listes de propriety", properties);
    const refresh = () => setProperty(properties.find(p => String(p.id) === String(id)));
    // initial attempt
    refresh();
    window.addEventListener('ndaku:properties-updated', refresh);
    window.addEventListener('ndaku:properties-error', refresh);
    return () => {
      window.removeEventListener('ndaku:properties-updated', refresh);
      window.removeEventListener('ndaku:properties-error', refresh);
    };
  }, [id]);

  // Resolve agent robustly: prefer embedded `property.agent`, then local `agents`, then try fetching user-scoped agents
  const [resolvedAgent, setResolvedAgent] = useState(() => {
    try {
      if (property && property.agent) return property.agent;
      return property ? agents.find(a => String(a.id) === String(property.agentId) || String(a._id) === String(property.agentId) || String(a.id) === String(property.agent) || String(a._id) === String(property.agent)) : null;
    } catch (e) { return null; }
  });
  const suggestions = property ? properties.filter(p => String(p.id) !== String(property.id)).slice(0, 2) : [];

  // Prefer new `property.videos` (array). Fall back to legacy virtualTour / virtualTourVideos.
  const videos = (property?.videos && property.videos.length) ? property.videos : (property?.virtualTourVideos && property.virtualTourVideos.length ? property.virtualTourVideos : (property?.virtualTour ? [property.virtualTour] : []));
  // Hooks - declared unconditionally to satisfy rules of hooks
  const [showVirtual, setShowVirtual] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [virtualPlayerRef, setVirtualPlayerRef] = useState(null);
  // image lightbox
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // map selection state for floating detail panel
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);
  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  // Track if property is already reserved
  const [isReserved, setIsReserved] = useState(false);

  // Try fetching user-scoped agents if we couldn't resolve and local agents list is empty
  useEffect(() => {

    let mounted = true;
    const tryFetch = async () => {
      if (resolvedAgent) return;
      if (agents && agents.length) return; // local agents present
      try {
        const token = localStorage.getItem('ndaku_auth_token');
        const base = process.env.REACT_APP_BACKEND_APP_URL || '';
        const res = await fetch(`${base}/api/agents/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : []);
        if (!mounted) return;
        if (list && list.length) {
          const found = list.find(a => String(a.id) === String(property.agentId) || String(a._id) === String(property.agentId) || String(a.id) === String(property.agent) || String(a._id) === String(property.agent));
          if (found) setResolvedAgent(found);
        }
      } catch (e) {
        // ignore
      }
    };
    tryFetch();
    return () => { mounted = false; };
  }, [resolvedAgent, property]);

  // Recompute resolvedAgent when property or local agents change
  useEffect(() => {
    try {
      if (property && property.agent && typeof property.agent === 'object') {
        setResolvedAgent(property.agent);
        return;
      }
      if (agents && agents.length && property) {
        const found = agents.find(a => {
          const pid = String(property.agentId || property.agent || property.agent_id || property._id || property.id || '');
          return [a.id, a._id, a.agentId, a.raw && a.raw._id, a.raw && a.raw.id].some(x => x && String(x) === pid);
        });
        if (found) setResolvedAgent(found);
      }
    } catch (e) {
      // ignore
    }
  }, [property, agents]);

  // Check if property is already reserved
  useEffect(() => {
    if (property) {
      try {
        const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
        const isPropertyReserved = reserved.includes(String(property.id || property._id));
        setIsReserved(isPropertyReserved);
      } catch (e) {
        setIsReserved(false);
      }
    }
  }, [property]);

  // Listen for property-reserved event to update reservation status
  useEffect(() => {
    const handlePropertyReserved = (event) => {
      if (String(event.detail?.propertyId) === String(property?.id || property?._id)) {
        setIsReserved(true);
      }
    };
    
    window.addEventListener('property-reserved', handlePropertyReserved);
    return () => window.removeEventListener('property-reserved', handlePropertyReserved);
  }, [property]);

  // Neighborhood scores state (can be updated by evaluation)
  // Compute initial neighborhood deterministically without reading `property` when missing
  const initialNeighborhood = (() => {
    if (property && property.neighborhood) return property.neighborhood;
    // create a small deterministic numeric seed from the route id (works for numeric ids and hex strings)
    const idStr = String(id || '7');
    const seed = Math.abs(Array.from(idStr).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7));
    const clamp = v => Math.max(10, Math.min(95, v));
    return {
      eau: clamp((seed * 37) % 90),
      electricite: clamp((seed * 53 + 20) % 90),
      securite: clamp((seed * 29 + 10) % 90),
      route: clamp((seed * 41 + 5) % 90),
    };
  })();
  const [neighborhoodScores, setNeighborhoodScores] = useState(initialNeighborhood);

  // If property not found, render a friendly message instead of throwing
  if (!property) {
    return (
      <div>
        <HomeLayout />
        <div className="container" style={{ marginTop: 85 }}>
          <div className="alert alert-warning mt-4">Annonce introuvable. Le bien demandé n'existe pas ou a été supprimé.</div>
          <div className="mb-4">
            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Retour</button>
          </div>
        </div>
        <FooterPro />
      </div>
    );
  }

  const toYoutubeEmbed = (url) => {
    if (!url) return url;
    try {
      if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) { }
    return url;
  };

  // neighborhood scores: generate deterministic pseudo-scores if none provided
  // keep backward-compatible reference
  const neighborhood = neighborhoodScores;



  const evaluationQuestions = [
    {
      id: 'q1',
      q: 'À quelle fréquence voyez-vous des activités de voisinage (marchés, enfants, promenades) ?',
      options: [
        { label: 'Très fréquemment', score: 4 },
        { label: 'Fréquemment', score: 3 },
        { label: 'Parfois', score: 2 },
        { label: 'Rarement', score: 1 },
      ]
    },
    {
      id: 'q2',
      q: 'Comment jugez-vous la sécurité perçue du quartier ?',
      options: [
        { label: 'Très sûre', score: 4 },
        { label: 'Sûre', score: 3 },
        { label: 'Moyenne', score: 2 },
        { label: 'Peu sûre', score: 1 },
      ]
    },
    {
      id: 'q3',
      q: 'Accès aux services (eau, électricité, commerces) ?',
      options: [
        { label: 'Excellent', score: 4 },
        { label: 'Bon', score: 3 },
        { label: 'Limité', score: 2 },
        { label: 'Insuffisant', score: 1 },
      ]
    },
    {
      id: 'q4',
      q: 'Qualité des routes et accès ?',
      options: [
        { label: 'Très bon', score: 4 },
        { label: 'Bon', score: 3 },
        { label: 'Passable', score: 2 },
        { label: 'Mauvais', score: 1 },
      ]
    }
  ];

  const submitEvaluation = () => {
    // ensure all answered
    if (evaluationQuestions.some(q => typeof answers[q.id] === 'undefined')) {
      setEvaluationError('Veuillez répondre à toutes les questions.');
      return;
    }
    setEvaluationError('');
    const sum = evaluationQuestions.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
    const max = evaluationQuestions.length * 4;
    const percent = Math.round((sum / max) * 100);
    setEvaluationResult({ percent, message: percent > 75 ? 'Quartier très dynamique' : percent > 50 ? 'Quartier agréable' : percent > 30 ? 'Quartier moyen' : 'Quartier à améliorer' });

    // Blend the computed percent into neighborhood scores
    setNeighborhoodScores(prev => ({
      eau: Math.round((prev.eau + percent) / 2),
      electricite: Math.round((prev.electricite + percent) / 2),
      securite: Math.round((prev.securite + percent) / 2),
      route: Math.round((prev.route + percent) / 2),
    }));
  };

  // Custom marker icons
  const redIcon = new L.Icon({
    iconUrl: require('../img/leaflet/marker-icon-2x-red.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('../img/leaflet/marker-shadow.png'),
    shadowSize: [41, 41]
  });
  const blueIcon = new L.Icon({
    iconUrl: require('../img/leaflet/marker-icon-2x-blue.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('../img/leaflet/marker-shadow.png'),
    shadowSize: [41, 41]
  });
  const mainPos = resolvedAgent?.geoloc || { lat: -4.325, lng: 15.322 };
  const defaultPosition = {lat: -4.325, lng: 15.322};
const propertyPosition = property.geoloc?.lat && property.geoloc?.lng ? property.geoloc : defaultPosition;
const centerPosition = mainPos?.lat && mainPos?.lng ? mainPos : propertyPosition;


return (
  <div>
    <HomeLayout/>
    <div className="container" style={{ "marginTop": "25px" }}>
      {/* Page header */}
      <div className="mb-4">
          <div className="promo-breadcrumb">
                <Link to="/">Accueil</Link>
                <span className="breadcrumb-sep">/</span>
                <Link to="/appartement">Annonce</Link>
                <span className="breadcrumb-sep">/</span>
                <span>{property.type}</span>
              </div>
        <h1 className="display-6 fw-bold" style={{ marginTop: 6 }}>{property.name}</h1>
        <p className="text-muted small">{property.description || 'Découvrez les détails du bien, ses équipements, et contactez l\'agent pour plus d\'informations.'}</p>
      </div>
      
      {/* Layout principal - 3 colonnes (main content + right sidebar) */}
      <div className="row">
        {/* COLONNE GAUCHE - Images et détails principaux (70%) */}
        <div className="col-12 col-lg-7 mb-4 mb-lg-0">
          <div className="card border-0" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <ImageCarousel images={property.images} name={property.name} onOpen={(i) => { setLightboxIndex(i); setShowImageLightbox(true); }} />
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <h3 className="fw-bold text-primary mb-2">{property.name}</h3>
                  <div className="mb-2">
                    <span className="badge bg-info text-dark me-2">{property.type}</span>
                    {property.status && <span className="badge bg-secondary">{property.status}</span>}
                  </div>
                </div>
                <div className="text-end">
                  <div className="price-display">
                    <FaRegMoneyBillAlt />
                    <span className="price-value">{property.price.toLocaleString()}</span>
                    <span className="price-currency">$</span>
                  </div>
                </div>
              </div>

              <div className="mb-2 text-muted"><i className="bi bi-geo-alt me-1"></i> {property.address}</div>
              <p className="text-secondary small">{property.description}</p>

              {(property.type === 'Appartement' || property.type === 'Studio' || property.type === 'Maison') && (
                <div className="mb-2 d-flex flex-wrap gap-3 align-items-center justify-content-start">
                  <span title="Chambres" className="badge bg-light text-dark border me-1"><FaBed className="me-1 text-primary" /> {property.chambres}</span>
                  <span title="Douches" className="badge bg-light text-dark border me-1"><FaShower className="me-1 text-info" /> {property.douches}</span>
                  <span title="Salon" className="badge bg-light text-dark border me-1"><FaCouch className="me-1 text-warning" /> {property.salon}</span>
                  <span title="Cuisine" className="badge bg-light text-dark border me-1"><FaUtensils className="me-1 text-success" /> {property.cuisine}</span>
                  <span title="Salle de bain" className="badge bg-light text-dark border"><FaBath className="me-1 text-danger" /> {property.sdb}</span>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mb-3 mt-3">
                <Button variant="outlined" style={{color : '#00a8a7', border : '1px solid #00a8a7'}}
                  color="primary"
                  onClick={() => navigate(-1)}>Retour</Button>
                <Button variant="outlined" style={{color : '#00a8a7', border : '1px solid #00a8a7'}}
                  color="primary" onClick={() => setShowVirtual(true)}>Visite virtuelle</Button>
              </div>

              {/* Neighborhood indices */}
              <div className="card p-3 shadow-sm border-0 mb-3">
                <h6 className="fw-bold">Indice du quartier</h6>
                <p className="small text-muted">Évaluation des services et de la sécurité aux alentours (échelle 0-100).</p>
                <div className="d-flex flex-column gap-2">
                  {[{ key: 'eau', label: 'Eau' }, { key: 'electricite', label: 'Électricité' }, { key: 'securite', label: 'Sécurité' }, { key: 'route', label: 'Routes' }].map(item => (
                    <div key={item.key}>
                      <div className="d-flex justify-content-between small mb-1"><div>{item.label}</div><div className="text-muted">{neighborhood[item.key]}%</div></div>
                      <div className="progress" style={{ height: 8 }}>
                        <div className="progress-bar" role="progressbar" style={{ width: `${neighborhood[item.key]}%`, background: 'var(--ndaku-primary)' }} aria-valuenow={neighborhood[item.key]} aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {showEvaluation && (
                <div className="mt-3">
                  {evaluationError && <div className="alert alert-danger small">{evaluationError}</div>}
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={submitEvaluation}>Soumettre l'évaluation</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowEvaluation(false)}>Annuler</button>
                  </div>
                </div>
              )}

              {/* Amenities Section */}
              <AmenitiesSection property={property} />
            </div>
          </div>
        </div>

        {/* COLONNE DROITE - Profil agent et suggestions (30%) */}
        <div className="col-12 col-lg-5 mt-4 mt-lg-0">
          {/* Profil Agent enrichi */}
          {resolvedAgent && (
            <div className="mb-4">
              <AgentProfileCard 
                agent={resolvedAgent} 
                property={property}
                isReserved={isReserved}
                onContactClick={(type) => {
                  if (type === 'whatsapp' && resolvedAgent.whatsapp) {
                    window.open(`https://wa.me/${resolvedAgent.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
                  } else if (type === 'phone' && resolvedAgent.phone) {
                    window.location.href = `tel:${resolvedAgent.phone}`;
                  } else if (type === 'email' && resolvedAgent.email) {
                    window.location.href = `mailto:${resolvedAgent.email}`;
                  } else if (type === 'reservation') {
                    setShowBooking(true);
                  }
                }}
                onViewMoreClick={() => {
                  navigate(`/agents/${resolvedAgent.id || resolvedAgent._id}`);
                }}
              />
            </div>
          )}

          {/* Carte */}
          <div className="rounded-4 overflow-hidden border mb-4" style={{ height: 320, position: 'relative' }}>
            <MapContainer center={[centerPosition.lat, centerPosition.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {/* Main property marker */}
              <Marker position={[propertyPosition.lat, propertyPosition.lng]} icon={redIcon} eventHandlers={{ click: () => setSelectedMapProperty(property) }}>
                <Popup>
                  <div style={{ width: 220 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <img src={(property.images && property.images[0]) ? process.env.REACT_APP_BACKEND_APP_URL + property.images[0] : require('../img/property-1.jpg')} alt={property.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{property.titre || property.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{property.adresse || property.address}</div>
                        <div style={{ marginTop: 6, fontWeight: 700, color: '#0f5132' }}>{(property.prix || property.price || 0).toLocaleString()} $</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/properties/${property._id || property.id}`)}>Voir</button>
                      <button className="btn btn-sm btn-success" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-contact-agent', { detail: { agentId: property.agentId || property.agent } }))}>Contacter</button>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {suggestions.map(sug => {
                const sugAgent = agents.find(a => String(a.id) === String(sug.agentId) || String(a._id) === String(sug.agentId));
                let markerPosition;

                // Try to get position from property first
                if (sug.geoloc?.lat && sug.geoloc?.lng) {
                  markerPosition = { lat: sug.geoloc.lat, lng: sug.geoloc.lng };
                }
                // If property has separate lat/lng fields
                else if (sug.lat && sug.lng) {
                  markerPosition = { lat: sug.lat, lng: sug.lng };
                }
                // Try agent's position
                else if (sugAgent?.geoloc?.lat && sugAgent?.geoloc?.lng) {
                  markerPosition = sugAgent.geoloc;
                }
                // Default to central Kinshasa if no valid position found
                else {
                  markerPosition = defaultPosition;
                }

                return (
                  <Marker key={sug._id || sug.id} position={[markerPosition.lat, markerPosition.lng]} icon={blueIcon} eventHandlers={{ click: () => setSelectedMapProperty(sug) }}>
                    <Popup>
                      <div style={{ width: 200 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <img src={(sug.images && sug.images[0]) ? process.env.REACT_APP_BACKEND_APP_URL + sug.images[0] : require('../img/property-1.jpg')} alt={sug.name} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{sug.titre || sug.name}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{sug.adresse || sug.address}</div>
                            <div style={{ marginTop: 6, fontWeight: 700, color: '#0f5132' }}>{(sug.prix || sug.price || 0).toLocaleString()} $</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/properties/${sug._id || sug.id}`)}>Voir</button>
                          <button className="btn btn-sm btn-success" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-contact-agent', { detail: { agentId: sug.agentId || sug.agent } }))}>Contacter</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Floating detail panel when a marker is selected */}
            {selectedMapProperty && (
              <div style={{ position: 'absolute', right: 12, top: 12, width: 300, zIndex: 9999 }}>
                <div className="card shadow-lg" style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex' }}>
                    <img src={(selectedMapProperty.images && selectedMapProperty.images[0]) ? process.env.REACT_APP_BACKEND_APP_URL + selectedMapProperty.images[0] : require('../img/property-1.jpg')} alt={selectedMapProperty.titre || selectedMapProperty.name} style={{ width: 100, height: 80, objectFit: 'cover' }} />
                    <div style={{ padding: 12, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedMapProperty.titre || selectedMapProperty.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{selectedMapProperty.adresse || selectedMapProperty.address}</div>
                      <div style={{ marginTop: 6, fontWeight: 700, color: '#0f5132', fontSize: '0.9rem' }}>{(selectedMapProperty.prix || selectedMapProperty.price || 0).toLocaleString()} $</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => { navigate(`/properties/${selectedMapProperty._id || selectedMapProperty.id}`); }}>Voir</button>
                        <button className="btn btn-sm btn-success" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-contact-agent', { detail: { agentId: selectedMapProperty.agentId || selectedMapProperty.agent } }))}>Contacter</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedMapProperty(null)}>Fermer</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions enrichies */}
        </div>
      </div>

      {/* Virtual tour video gallery (bottom of page) */}
      {/* {videos && videos.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3">Visite virtuelle & vidéos</h4>
          <div className="card p-3 mb-3">
            <div style={{ height: 420 }} className="d-flex align-items-center justify-content-center bg-dark rounded">
              {videos[selectedVideo] && (videos[selectedVideo].includes('youtube') || videos[selectedVideo].includes('youtu') || videos[selectedVideo].includes('watch?v=') || videos[selectedVideo].includes('youtu.be')) ? (
                <iframe src={toYoutubeEmbed(videos[selectedVideo])} title="Visite virtuelle" style={{ width: '100%', height: 420, border: 0 }} />
              ) : (
                <video ref={(el) => setVirtualPlayerRef(el)} src={videos[selectedVideo]} controls style={{ width: '100%', height: 420, objectFit: 'cover' }} />
              )}
            </div>

            <div className="d-flex gap-2 mt-3 overflow-auto py-2">
              {videos.map((v, i) => (
                <div key={i} className={`border rounded ${i === selectedVideo ? 'border-success' : 'border-0'}`} style={{ width: 160, flex: '0 0 auto', cursor: 'pointer' }} onClick={() => setSelectedVideo(i)}>
                  {(v.includes('youtube') || v.includes('youtu')) ? (
                    <img src={`https://img.youtube.com/vi/${(v.split('v=')[1] || v.split('/').pop()).split('&')[0]}/hqdefault.jpg`} alt={`thumb-${i}`} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  ) : (
                    <video src={v} style={{ width: '100%', height: 90, objectFit: 'cover' }} muted />
                  )}
                  <div className="p-2 small text-truncate">Vidéo {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
      {/* Animated Virtual Tour Modal (also used when clicking Visite virtuelle button) */}
      <AnimatePresence>
        {showVirtual && (
          <VirtualTourModal
            videos={videos && videos.length ? videos : []}
            selectedIndex={selectedVideo}
            onClose={() => setShowVirtual(false)}
            onSelect={(i) => setSelectedVideo(i)}
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox for large image viewing */}
      <AnimatePresence>
        {showImageLightbox && property.images && property.images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 13000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowImageLightbox(false)} />
            <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ width: 'min(1100px,96%)', maxHeight: '92vh', zIndex: 13001 }}>
              <div style={{ position: 'relative' }}>
                <button className="lightbox-close" onClick={() => setShowImageLightbox(false)} style={{ position: 'absolute', right: 12, top: 12, zIndex: 2 }}>×</button>
                <img src={process.env.REACT_APP_BACKEND_APP_URL + property.images[lightboxIndex]} alt={`lightbox-${lightboxIndex}`} className="lightbox-img" style={{ display: 'block', margin: '0 auto' }} />
                <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + property.images.length) % property.images.length); }}>&lsaquo;</button>
                <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % property.images.length); }}>&rsaquo;</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <ChatWidget serverUrl={process.env.REACT_APP_WS_URL || 'ws://localhost:8081'} />
    {/* Call to action */}
    {/* Call to action */}
               <div className=" text-white text-center py-5" style={{
                   display: "flex",
                   flexDirection: "column",
                   justifyContent: "center",
                   alignItems: "center",
                   background : 'var(--ndaku-primary)',
               }}>
                   <div className="container">
                       <h5 className="fw-bold mb-3 fs-3 text-white">Vous êtes agent ou propriétaire ?</h5>
                       <p className="mb-4 fs-5 text-white">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
                      <Button variant="outlined" color="inherit" sx={{ fontSize: '1.05rem', minWidth: 'min(180px, 60vw)', borderColor: 'rgba(255,255,255,0.6)', color: 'white' }} >Devenir agent</Button>
                   </div>
               </div >


    {/* Dev-only debug controls (visible on localhost or with ?ndaku_debug=1) */}

    {/* Modal de réservation visite */}
    {showBooking && (
      <VisitBookingModal 
        open={showBooking}
        property={property}
        agent={resolvedAgent}
        onClose={() => setShowBooking(false)}
        onSubmit={(bookingData) => {
          console.log('Booking submitted:', bookingData);
          setShowBooking(false);
        }}
        onSuccess={(bookingData) => {
          console.log('Booking success:', bookingData);
          setShowBooking(false);
        }}
      />
    )}

    <FooterPro />
  </div>

);
};
export default PropertyDetails;
