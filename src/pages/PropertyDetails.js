import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { properties, agents } from '../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../pages/HomeSection.css';
import ChatWidget from '../components/common/ChatWidget';
import AgentContactModal from '../components/common/AgentContactModal';
import FooterPro from '../components/common/Footer';
import '../components/property/PropertyCard.css';
import VisitBookingModal from '../components/common/VisitBookingModal';

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
        <img src={process.env.REACT_APP_BACKEND_APP_URL + images[current]} alt={`${name}-${current}`} className="w-100 h-100" style={{ objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => onOpen(current)} />
        {images.length > 1 && (
          <>
            <button className="btn btn-outline-light position-absolute top-50 start-0 translate-middle-y ms-2 shadow" onClick={prev}>&lsaquo;</button>
            <button className="btn btn-outline-light position-absolute top-50 end-0 translate-middle-y me-2 shadow" onClick={next}>&rsaquo;</button>
          </>
        )}
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

  useEffect(() => { setIndex(selectedIndex || 0); }, [selectedIndex]);

  const toYoutubeEmbedLocal = (url) => {
    if (!url) return url;
    try {
      if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) { }
    return url;
  };

  const current = videos[index];
  const isYoutube = (url) => url && (url.includes('youtube') || url.includes('youtu') || url.includes('watch?v=') || url.includes('youtu.be'));

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); } else { videoRef.current.pause(); setPlaying(false); }
  };
  const toggleMute = () => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); };
  const next = () => { const nextIdx = (index + 1) % videos.length; setIndex(nextIdx); onSelect(nextIdx); };
  const prev = () => { const prevIdx = (index - 1 + videos.length) % videos.length; setIndex(prevIdx); onSelect(prevIdx); };
  const goFull = () => { if (!videoRef.current) return; if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen(); else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen(); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <motion.div initial={{ y: 40, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.99 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ width: 'min(1100px,96%)', maxHeight: '92vh', background: '#fff', borderRadius: 12, overflow: 'hidden', zIndex: 12001 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700 }}>Visite virtuelle</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline-secondary" onClick={prev}>Préc.</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={next}>Suiv.</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={toggleMute}>{muted ? 'Activer son' : 'Couper'}</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={goFull}>Plein écran</button>
              <button className="btn btn-sm btn-danger" onClick={onClose}>Fermer</button>
            </div>
          </div>

          <div style={{ padding: 12, display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              {current && isYoutube(current) ? (
                <iframe src={toYoutubeEmbedLocal(current)} title={`video-${index}`} style={{ width: '100%', height: '100%', border: 0 }} />
              ) : (
                <video ref={videoRef} src={current} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted={muted} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
              )}
            </div>

            <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Liste des vidéos</div>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6 }}>
                {videos.map((v, i) => (
                  <div key={i} className={`d-flex gap-2 align-items-center p-2 rounded ${i === index ? 'border border-success' : 'border-0'}`} style={{ cursor: 'pointer' }} onClick={() => { setIndex(i); onSelect(i); }}>
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
                    <div style={{ flex: '0 0 auto' }}>
                      <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); setIndex(i); onSelect(i); if (videoRef.current && !isYoutube(v)) { videoRef.current.play(); } }}>Lire</button>
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

// Local helper component for agent block with reservation logic
const AgentBlockWithReservation = ({ agent, property }) => {
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [isReserved, setIsReserved] = useState(() => {
    try { 
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String); return reserved.includes(String(property.id)) || Boolean(property.isReserved); } catch (e) { return Boolean(property.isReserved); 
      }
  });

  useEffect(() => {
    console.log("agent is :", agent);
    const handler = (e) => { const reservedId = e?.detail?.propertyId; if (String(reservedId) === String(property.id)) setIsReserved(true); };
    const storageHandler = (e) => { if (e.key === 'reserved_properties') { try { const reserved = JSON.parse(e.newValue || '[]').map(String); if (reserved.includes(String(property.id))) setIsReserved(true); } catch (_) { } } };
    window.addEventListener('property-reserved', handler); window.addEventListener('storage', storageHandler);
    return () => { window.removeEventListener('property-reserved', handler); window.removeEventListener('storage', storageHandler); };
  }, [property.id]);

  const handleSuccess = () => {
    setIsReserved(true);
    setShowBooking(false);
    try {
      const reserved = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
      if (!reserved.includes(String(property.id))) {
        reserved.push(String(property.id));
        localStorage.setItem('reserved_properties', JSON.stringify(reserved));
      }
    } catch (e) { }
  };


  const agentName = agent?.prenom || agent?.name || 'Agent';
  const agentPhoto = (process.env.REACT_APP_BACKEND_APP_URL || '') + (agent?.photo || agent?.image || agent?.avatar || '');
  const agentPhone = agent?.whatsapp || agent?.phone || '';
  const agentFacebook = agent?.facebook || agent?.fb || '';

  return (
    <div className="property-agent d-flex align-items-center mt-3 p-2 rounded-3 bg-light">
      <div className="property-agent-inner">
        <div className="agent-left">
          <div className="agent-avatar-wrapper"><img src={agentPhoto} alt={agentName} className="agent-thumb" /></div>
          <div className="agent-meta"><div className="fw-semibold small agent-name">{agentName}</div><div className="small text-muted agent-phone">{agentPhone}</div></div>
        </div>
        <div className="agent-right">
          {!isReserved ? (
            <button className="btns btn-primary reserve-btn" onClick={() => setShowBooking(true)}>Réserver une visite</button>
          ) : (
            <div className="agent-contact-buttons">
              <span className="badge bg-success reserve-badge">Réservé</span>
              <button className="btns btn-outline-success ms-2 contact-icon" onClick={() => setShowContact(true)} title="WhatsApp"><FaWhatsapp /></button>
              {agentFacebook ? (
                <a href={agentFacebook} className="btns btn-outline-primary ms-2 contact-icon" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
              ) : null}
              <button className="btns btn-outline-dark ms-2 contact-icon" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent?.id || agent?._id, propertyId: property.id } } }))}><FaPhone /></button>
            </div>
          )}
        </div>
      </div>
      {showContact && <AgentContactModal agent={agent} open={showContact} onClose={() => setShowContact(false)} />}
      {showBooking && <VisitBookingModal open={showBooking} onClose={() => setShowBooking(false)} onSuccess={handleSuccess} agent={agent} property={property} />}
    </div>
  );
};

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
  const videos = property?.virtualTourVideos && property.virtualTourVideos.length ? property.virtualTourVideos : (property?.virtualTour ? [property.virtualTour] : []);

  // Hooks - declared unconditionally to satisfy rules of hooks
  const [showVirtual, setShowVirtual] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [virtualPlayerRef, setVirtualPlayerRef] = useState(null);
  // image lightbox
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // map selection state for floating detail panel
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);

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
        <Navbar />
        <div className="container" style={{ marginTop: 150 }}>
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

  return (
    <div>
      <Navbar />
      <div className="container" style={{ "marginTop": "150px" }}>
        {/* Page header */}
        <div className="mb-4">
          <div className="small text-muted">Accueil / Annonces / Détails</div>
          <h1 className="display-6 fw-bold" style={{ marginTop: 6 }}>{property.name}</h1>
          <p className="text-muted small">{property.description || 'Découvrez les détails du bien, ses équipements, et contactez l\'agent pour plus d\'informations.'}</p>
        </div>
        <div className="row">
          <div className="col-12 col-lg-7 mb-4 mb-lg-0">
            <div className="card shadow-lg border-0" style={{ borderRadius: 18, overflow: 'hidden' }}>
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
                    <div className="fs-5 text-success fw-bold"><FaRegMoneyBillAlt className="me-2" />{property.price.toLocaleString()} $</div>
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

                <div className="d-flex justify-content-end gap-2 mb-3">
                  <button className="btn btn-outline-secondary btn-sm px-3 fw-bold" onClick={() => navigate(-1)}>Retour</button>
                  <button className="btn btn-success btn-sm px-3 fw-bold" onClick={() => setShowVirtual(true)}>Visite virtuelle</button>
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

                {/* Agent block (responsive, reuse property styles) */}
                {resolvedAgent && (
                  <AgentBlockWithReservation agent={resolvedAgent} property={property} />
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5 mt-4 mt-lg-0">
            <div className="mb-4">
              <h5 className="fw-bold text-primary mb-2">Suggestions</h5>
              <div className="row g-3">
                {suggestions.map(sug => {
                  const sugAgent = agents.find(a => String(a.id) === String(sug.agentId));
                  return (
                    <div className="col-12" key={sug.id}>
                      <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/properties/${sug.id}`)}>
                        <div className="d-flex align-items-center gap-2 p-2">
                          <img src={process.env.REACT_APP_BACKEND_APP_URL + sug.images[0]} alt={sug.name} className="rounded" style={{ width: 110, height: 80, objectFit: 'cover' }} />
                          <div className="flex-grow-1">
                            <div className="fw-semibold small text-success">{sug.name}</div>
                            <div className="small text-muted">{sug.type} • {sug.price.toLocaleString()} $</div>
                            {sugAgent && <div className="small text-secondary">{sugAgent.name}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-4 overflow-hidden border" style={{ height: 260, position: 'relative' }}>
              <MapContainer center={[mainPos.lat, mainPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Main property marker */}
                <Marker position={[property.geoloc?.lat || mainPos.lat, property.geoloc?.lng || mainPos.lng]} icon={new L.Icon({ iconUrl: require('../img/leaflet/marker-icon-2x-red.png'), iconSize: [25, 41], iconAnchor: [12, 41], shadowUrl: require('../img/leaflet/marker-shadow.png'), shadowSize: [41, 41] })} eventHandlers={{ click: () => setSelectedMapProperty(property) }}>
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
                  const posSrc = sug.geoloc || sug.lat && sug.lng ? { lat: sug.geoloc?.lat || sug.lat, lng: sug.geoloc?.lng || sug.lng } : sugAgent?.geoloc;
                  const pos = posSrc || { lat: -4.325, lng: 15.322 };
                  return (
                    <Marker key={sug._id || sug.id} position={[pos.lat, pos.lng]} icon={new L.Icon({ iconUrl: require('../img/leaflet/marker-icon-2x-blue.png'), iconSize: [25, 41], iconAnchor: [12, 41], shadowUrl: require('../img/leaflet/marker-shadow.png'), shadowSize: [41, 41] })} eventHandlers={{ click: () => setSelectedMapProperty(sug) }}>
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
                <div style={{ position: 'absolute', right: 12, top: 12, width: 320, zIndex: 9999 }}>
                  <div className="card shadow-lg" style={{ borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex' }}>
                      <img src={(selectedMapProperty.images && selectedMapProperty.images[0]) ? process.env.REACT_APP_BACKEND_APP_URL + selectedMapProperty.images[0] : require('../img/property-1.jpg')} alt={selectedMapProperty.titre || selectedMapProperty.name} style={{ width: 120, height: 90, objectFit: 'cover' }} />
                      <div style={{ padding: 12, flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{selectedMapProperty.titre || selectedMapProperty.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{selectedMapProperty.adresse || selectedMapProperty.address}</div>
                        <div style={{ marginTop: 6, fontWeight: 700, color: '#0f5132' }}>{(selectedMapProperty.prix || selectedMapProperty.price || 0).toLocaleString()} $</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
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
          </div>
        </div>

        {/* Virtual tour video gallery (bottom of page) */}
        {videos && videos.length > 0 && (
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
        )}
        {/* Animated Virtual Tour Modal (also used when clicking Visite virtuelle button) */}
        <AnimatePresence>
          {showVirtual && videos && videos.length > 0 && (
            <VirtualTourModal
              videos={videos}
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
      <div className="bg-success text-white text-center py-5">
        <div className="container">
          <h5 className="fw-bold mb-3 fs-3">Vous êtes agent ou propriétaire ?</h5>
          <p className="mb-4 fs-5">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
          <a href="#" className="btn btn-outline-light btn-lg px-4 py-2 fw-bold rounded-pill" style={{ fontSize: '1.2rem', minWidth: 180 }}>Devenir agent</a>
        </div>
      </div>


      {/* Dev-only debug controls (visible on localhost or with ?ndaku_debug=1) */}


      <FooterPro />
    </div>

  );
};
export default PropertyDetails;
