import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { properties, agents } from '../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWifi, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaStepBackward, FaStepForward, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand, FaTimes, FaRegImage } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../pages/HomeSection.css';
import '../pages/PropertyDetails.css';
import ChatWidget from '../components/common/Messenger';
import ModernVirtualTourModal from '../components/property/ModernVirtualTourModal';
import AgentContactModal from '../components/common/AgentContactModal';
import FooterPro from '../components/common/Footer';
import '../components/property/PropertyCard.css';
import VisitBookingModal from '../components/common/VisitBookingModal';
import { Button, IconButton } from '@mui/material';
import HomeLayout from '../components/homeComponent/HomeLayout';
import AgentProfileCard from '../components/property/AgentProfileCard';
import SuggestionsEnhanced from '../components/property/SuggestionsEnhanced';
import AmenitiesSection from '../components/property/AmenitiesSection';
// Simple ImageCarousel: main image with small thumb strip
function ImageCarousel({ images = [], name = '', onOpen = () => { } }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = () => setCurrent((s) => (s - 1 + images.length) % images.length);
  const next = () => setCurrent((s) => (s + 1) % images.length);

  return (
    <div className="image-carousel">
      <div className="carousel-main position-relative rounded overflow-hidden">
        <img
          src={images[current]}
          alt={`${name}-${current}`}
          className="w-100"
          style={{ objectFit: 'cover', cursor: 'zoom-in', height: '420px' }}
          onClick={() => onOpen(current)}
        />
      </div>
      <div className="d-flex gap-2 mt-3">
        {images.slice(0, 3).map((img, i) => (
          <img key={i} src={img} alt={`thumb-${i}`} style={{ width: i === 0 ? '60%' : '20%', height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', opacity: i === current ? 1 : 0.8 }} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // local state for the property so we can refresh when global `properties` array is updated
  const [property, setProperty] = useState(() => properties.find(p => String(p.id || p._id) === String(id)));
  // Evaluation modal state
  const [showContact, setShowContact] = useState(false);

  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answers, setAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  // refresh property when fakedata finishes loading and emits an event
  useEffect(() => {
    console.log("listes des agents", agents);
    console.log("listes de propriety", properties);
    const refresh = () => {
      const found = properties.find(p => String(p.id) === String(id));
      if (!found) {
        // if previously had a property, remove it, otherwise keep as-is
        setProperty(prev => prev ? null : prev);
        return;
      }
      setProperty(prev => {
        const prevId = String(prev?.id || prev?._id || '');
        const foundId = String(found?.id || found?._id || '');
        if (prevId === foundId) return prev; // avoid setting same object
        return found;
      });
    };
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
  // keep a ref of current resolvedAgent to avoid including it in effect deps and causing ping-pong updates
  const resolvedAgentRef = useRef(resolvedAgent);
  useEffect(() => { resolvedAgentRef.current = resolvedAgent; }, [resolvedAgent]);


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

  // === DEBUG: detect excessive renders and log useful state (remove this in prod) ===
  const _renderCount = useRef(0);
  _renderCount.current += 1;
  useEffect(() => {
    // reset count after a short idle so we only capture bursts
    const t = setTimeout(() => { _renderCount.current = 0; }, 2500);
    if (_renderCount.current > 30) {
      console.warn('PropertyDetails: excessive renders detected', {
        renders: _renderCount.current,
        propertyId: property?.id || property?._id,
        resolvedAgentId: resolvedAgentRef.current?.id || resolvedAgentRef.current?._id,
        isReserved
      });
    }
    return () => clearTimeout(t);
  }, [property, isReserved]);
  // === end debug ===

  // Map and user geolocation state (declared unconditionally)
  const mapRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState('');

  // Compute distance between two lat/lng points (km)
  const getDistanceKm = (a, b) => {
    if (!a || !b) return null;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return (R * c).toFixed(2);
  };

  // Try to get user's current location early (unconditional hook)
  useEffect(() => {
    if (!navigator || !navigator.geolocation) {
      setGeoError('Géolocalisation non supportée');
      return;
    }
    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (!mounted) return;
        setGeoError(err.message || 'Permission refusée');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => { mounted = false; };
  }, []);

  // Try fetching user-scoped agents if we couldn't resolve and local agents list is empty
  // NOTE: depend only on `property` and use `resolvedAgentRef` for current value to avoid ping-pong
  useEffect(() => {
    let mounted = true;
    const tryFetch = async () => {
      if (resolvedAgentRef.current) return;
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
          if (found) {
            const foundId = String(found.id || found._id || '');
            const currentId = String(resolvedAgentRef.current?.id || resolvedAgentRef.current?._id || '');
            if (foundId && foundId !== currentId) {
              setResolvedAgent(found);
              resolvedAgentRef.current = found;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };
    tryFetch();
    return () => { mounted = false; };
  }, [property]);

  // Recompute resolvedAgent when property or agents change (use ref to avoid ping-pong)
  // Guard updates so we don't keep writing the same value and trigger re-renders
  useEffect(() => {
    try {
      if (!property) return;

      // If property embeds an agent object, set it only when it changes compared to ref
      if (property.agent && typeof property.agent === 'object') {
        const incomingId = String(property.agent.id || property.agent._id || '');
        const currentId = String(resolvedAgentRef.current?.id || resolvedAgentRef.current?._id || '');
        if (incomingId && incomingId !== currentId) {
          setResolvedAgent(property.agent);
          resolvedAgentRef.current = property.agent;
        }
        return;
      }

      // Otherwise try to match from local agents but only update when different
      if (agents && agents.length) {
        const pid = String(property.agentId || property.agent || property.agent_id || property._id || property.id || '');
        if (!pid) return;
        const found = agents.find(a => [a.id, a._id, a.agentId, a.raw && a.raw._id, a.raw && a.raw.id].some(x => x && String(x) === pid));
        if (found) {
          const foundId = String(found.id || found._id || '');
          const currentId = String(resolvedAgentRef.current?.id || resolvedAgentRef.current?._id || '');
          if (foundId && foundId !== currentId) {
            setResolvedAgent(found);
            resolvedAgentRef.current = found;
          }
        }
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
        setIsReserved(prev => (prev === isPropertyReserved ? prev : isPropertyReserved));
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
  const defaultPosition = { lat: -4.325, lng: 15.322 };
  const propertyPosition = property.geoloc?.lat && property.geoloc?.lng ? property.geoloc : defaultPosition;
  const centerPosition = mainPos?.lat && mainPos?.lng ? mainPos : propertyPosition;



  return (
    <div className="property-details-reset pd-clean-root">
      <HomeLayout />
      <div className="container pd-clean-container">
        <div className="pd-breadcrumb"><Link to="/">← Retour à l'accueil</Link> / <strong>Détails</strong></div>
       

        <div className="pd-page-grid">
          {/* LEFT: Main content */}
          <div>
            {/* Header: title + big price */}
            <div className="pd-header d-flex justify-content-between align-items-start mb-4">
              <div>
                <h1 className="pd-title" style={{ margin: 0 }}>{property.name || 'Appartement'}</h1>
                <div className="pd-sub text-muted mt-2" style={{ fontSize: '0.98rem' }}><FaMapMarkerAlt style={{ marginRight: 6 }} />{property.address || ''}</div>
              </div>

              <div className="pd-price-hero text-end">
                <div className="pd-price-big">{property.price ? Number(property.price).toLocaleString() : '—'} <span className="pd-price-currency">USD</span></div>
                <div className="pd-price-meta text-muted" style={{ fontSize: '0.95rem', marginTop: 8 }}>{property.type || ''} • {property.status || (property.isAvailable ? 'En location' : 'À vendre')}</div>
              </div>
            </div>

            <div className="pd-hero">
              
              <div className="pd-hero-main">
                <motion.img
                  src={(property.images && property.images[0]) ? property.images[0] : require('../img/property-1.jpg')}
                  alt={property.name}
                  initial={{ opacity: 0.95 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45 }}
                  style={{ cursor: 'zoom-in' }}
                  onClick={() => { setLightboxIndex(0); setShowImageLightbox(true); }}
                />

                {/* View media CTA overlay - shows total medias */}
                <button
                  className="pd-view-media"
                  onClick={() => { setLightboxIndex(0); setShowImageLightbox(true); }}
                  aria-label="Voir tous les médias"
                >
                  Voir les {((property.images && property.images.length) ? property.images.length : 0) + (videos && videos.length ? videos.length : 0)} médias
                </button>

                {/* Video / virtual tour CTA overlay (kept but secondary) */}
                {videos && videos.length > 0 ? (
                  <button
                    className="pd-video-btn"
                    onClick={() => { setSelectedVideo(0); setShowVirtual(true); }}
                    aria-label="Ouvrir la visite virtuelle"
                    title="Visite virtuelle"
                  >
                    <span className="icon"><FaPlay /></span>
                    <span>Visite virtuelle</span>
                  </button>
                ) : null}
              </div>
              <div className="pd-hero-thumbs">
                {(property.images || []).slice(1, 3).map((img, i) => (
                  <div key={i} className="pd-thumb">
                    <motion.img
                      src={img}
                      alt={`${property.name}-thumb-${i}`}
                      initial={{ x: 20, opacity: 0.8 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.06 * i }}
                      onClick={() => { setLightboxIndex(i + 1); setShowImageLightbox(true); }}
                      style={{ cursor: 'zoom-in' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pd-main">
              <div className="pd-meta-grid">
                <div className="pd-meta-item">
                  <div className="meta-label">Prix</div>
                  <div className="meta-value price-value">{property.price ? `${Number(property.price).toLocaleString()} USD` : '—'}</div>
                </div>

                <div className="pd-meta-item">
                  <div className="meta-label">Chambres</div>
                  <div className="meta-value">{property.chambres || property.bedrooms || 0}</div>
                </div>

                <div className="pd-meta-item">
                  <div className="meta-label">Salles de bain</div>
                  <div className="meta-value">{property.douches || property.bathrooms || 0}</div>
                </div>

                <div className="pd-meta-item">
                  <div className="meta-label">Surface</div>
                  <div className="meta-value">{property.surface || property.area || property.m2 ? `${property.surface || property.area || property.m2} m²` : '—'}</div>
                </div>

                <div className="pd-meta-item">
                  <div className="meta-label">Quartier</div>
                  <div className="meta-value">{property.neighborhood || property.quartier || property.zone || '—'}</div>
                </div>

                <div className="pd-meta-item">
                  <div className="meta-label">Médias</div>
                  <div className="meta-value">
                    <button className="btn btn-sm btn-outline-primary meta-media-btn" onClick={() => { setLightboxIndex(0); setShowImageLightbox(true); }}>
                      Voir {((property.images && property.images.length) ? property.images.length : 0) + (videos && videos.length ? videos.length : 0)} médias
                    </button>
                  </div>
                </div>
              </div>

              <div className="pd-star-row">
                <span style={{ fontWeight: 700, marginRight: 8 }}>{property.rating || 4.6}</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span style={{ opacity: 0.35 }}>★</span>
              </div>

             

              <div className="pd-desc ">
                <h4>Description</h4>
                <p style={{color : "black"}}>{property.description}</p>
              </div>

              {/* <div className="pd-reviews">
                <h5>Avis clients</h5>
                {(property.reviews || []).slice(0, 2).map((r, i) => (
                  <div className="pd-review-card" key={i}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={r.avatar || require('../img/property-1.jpg')} alt={r.name} style={{ width: 44, height: 44, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{r.company || ''}</div>
                        <div style={{ marginTop: 8 }}>{'★'.repeat(Math.round(r.rating || 5))}</div>
                        <div style={{ marginTop: 6 }} className="small text-muted">{r.comment}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div> */}

              <div style={{ marginTop: 20 }}>
                <h4>Localisation</h4>
                <div className="pd-map" style={{ height: 260, position: 'relative' }}>
                  {/* small control to focus on user/property */}
                  <div style={{ position: 'absolute', right: 10, top: 10, zIndex: 5000 }}>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => {
                        if (mapRef.current) {
                          if (userPosition) {
                            const b = L.latLngBounds([[propertyPosition.lat, propertyPosition.lng], [userPosition.lat, userPosition.lng]]);
                            mapRef.current.fitBounds(b, { padding: [40, 40] });
                          } else if (navigator && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((p) => {
                              const up = { lat: p.coords.latitude, lng: p.coords.longitude };
                              setUserPosition(up);
                              const b = L.latLngBounds([[propertyPosition.lat, propertyPosition.lng], [up.lat, up.lng]]);
                              mapRef.current.fitBounds(b, { padding: [40, 40] });
                            });
                          }
                        }
                      }}
                      title="Localiser moi et afficher le trajet"
                      style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 8px', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', color : '' }}
                    >
                      Localiser
                    </button>
                  </div>

                  <MapContainer whenCreated={(m) => (mapRef.current = m)} center={[centerPosition.lat, centerPosition.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Property marker with popup showing distance if user known */}
                    <Marker position={[propertyPosition.lat, propertyPosition.lng]} icon={redIcon} eventHandlers={{ click: (e) => { if (mapRef.current) mapRef.current.flyTo([propertyPosition.lat, propertyPosition.lng], 15); } }}>
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <strong>{property.name}</strong>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{property.address || ''}</div>
                          {userPosition && (
                            <div style={{ marginTop: 8, fontSize: 13 }}>
                              Vous êtes à ~ {getDistanceKm(userPosition, propertyPosition)} km d'ici
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>

                    {/* If we have user position, show it and draw a line */}
                    {userPosition && (
                      <>
                        <Marker position={[userPosition.lat, userPosition.lng]} icon={blueIcon}>
                          <Popup>
                            <div>
                              <strong>Votre position</strong>
                              <div style={{ fontSize: 13, color: '#6b7280' }}>{getDistanceKm(userPosition, propertyPosition)} km du bien</div>
                            </div>
                          </Popup>
                        </Marker>
                        <Polyline positions={[[userPosition.lat, userPosition.lng], [propertyPosition.lat, propertyPosition.lng]]} pathOptions={{ color: '#0daebe', weight: 3, opacity: 0.8 }} />
                        <Circle center={[userPosition.lat, userPosition.lng]} radius={40} pathOptions={{ color: '#1e90ff', fillOpacity: 0.08 }} />
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Side panel (price + agent + CTAs) */}
          <aside className="pd-sidepanel">
            <div >
              <div style={{ marginTop: 12 }}>
                <AgentProfileCard setShowBooking={setShowBooking} agent={resolvedAgent} property={property} isReserved={isReserved} onContactClick={(t) => { if (t === 'whatsapp') setShowContact(true); }} />
              </div>

            

              {/* subtle separator */}
              <div className="card-separator" style={{ height: 14 }} />

              {/* Security tips card */}
              <div className="safety-tips-card" style={{ marginTop: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: 'brown' }} />
                  <div style={{ fontWeight: 800, color: 'brown' }}>Conseils de sécurité</div>
                </div>
                <ul style={{ paddingLeft: 16, margin: 0, color: '#374151' }}>
                  <li>Rencontrez-vous dans un lieu public sûr</li>
                  <li>Inspectez l'article avant l'achat</li>
                  <li>Ne payez jamais à l'avance sans voir l'article</li>
                  <li>
                    Signalez les annonces suspectes. <a href={`mailto:support@ndaku.app?subject=Signalement%20annonce%20${property.id}`} className="contact-link" onClick={(e)=>{ /* dispatch event then allow mailto */ window.dispatchEvent(new CustomEvent('ndaku:report-issue',{ detail: { propertyId: property.id } })); }}>
                      Contactez-nous
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* Virtual tour modal */}
      {showVirtual && (
        <ModernVirtualTourModal
          videos={videos}
          selectedIndex={selectedVideo}
          onClose={() => setShowVirtual(false)}
          onSelect={(i) => setSelectedVideo(i)}
        />
      )}

      {/* Simple Image Lightbox */}
      {showImageLightbox && (property.images && property.images.length) && (
        <div
          className="lightbox-full"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000 }}
          onClick={() => setShowImageLightbox(false)}
        >
          <div style={{ position: 'relative', maxWidth: '96vw', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={property.images[lightboxIndex]} alt={`lightbox-${lightboxIndex}`} className="lightbox-img" style={{ maxWidth: '96vw', maxHeight: '88vh', borderRadius: 8 }} />

            <button className="lightbox-close" onClick={() => setShowImageLightbox(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: 8, borderRadius: 8 }}>
              ✕
            </button>

            <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + property.images.length - 1) % property.images.length); }} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: 10, borderRadius: 8 }}>
              ‹
            </button>

            <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % property.images.length); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: 10, borderRadius: 8 }}>
              ›
            </button>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {showBooking && (
        <VisitBookingModal
          open={showBooking}
          onClose={() => setShowBooking(false)}
          onSuccess={(data) => { setIsReserved(true); setShowBooking(false); }}
          property={property}
          agent={resolvedAgent}
        />
      )}

      <FooterPro />
    </div>
  );
};

export default PropertyDetails;
