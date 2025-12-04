import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { properties, agents } from '../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWifi, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt, FaStepBackward, FaStepForward, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand, FaTimes, FaRegImage } from 'react-icons/fa';
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
// Simple ImageCarousel: main image with small thumb strip
function ImageCarousel({ images = [], name = '', onOpen = () => {} }) {
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
  const defaultPosition = { lat: -4.325, lng: 15.322 };
  const propertyPosition = property.geoloc?.lat && property.geoloc?.lng ? property.geoloc : defaultPosition;
  const centerPosition = mainPos?.lat && mainPos?.lng ? mainPos : propertyPosition;


  return (
    <div className="property-details-reset pd-clean-root">
      <HomeLayout />
      <div className="container pd-clean-container">
        <div className="pd-breadcrumb"><Link to="/">&lt; Back to Home</Link> / <strong>Details</strong></div>
        <div className="pd-actions">
          <button className="btn pd-secondary">Share</button>
          <button className="btn pd-secondary">Favorite</button>
          <button className="btn pd-secondary">Browse nearby listings</button>
        </div>

        <div className="pd-page-grid">
          {/* LEFT: Main content */}
          <div>
            <div className="pd-hero">
              <div className="pd-hero-main">
                <motion.img src={(property.images && property.images[0]) ? property.images[0] : require('../img/property-1.jpg')} alt={property.name} initial={{ opacity: 0.95 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} />

                {/* Video / virtual tour CTA overlay */}
                {videos && videos.length > 0 ? (
                  <button
                    className="pd-video-btn"
                    onClick={() => setShowVirtual(true)}
                    aria-label="Ouvrir la visite virtuelle"
                    title="Visite virtuelle"
                  >
                    <span className="icon"><FaPlay /></span>
                    <span>Visite virtuelle</span>
                  </button>
                ) : (
                  <button
                    className="pd-video-btn"
                    onClick={() => setShowVirtual(true)}
                    aria-label="Voir les photos"
                    title="Voir les photos"
                  >
                    <span className="icon"><FaRegImage /></span>
                    <span>Voir les photos</span>
                  </button>
                )}
              </div>
              <div className="pd-hero-thumbs">
                {(property.images || []).slice(1, 3).map((img, i) => (
                  <div key={i} className="pd-thumb">
                    <motion.img src={img} alt={`${property.name}-thumb-${i}`} initial={{ x: 20, opacity: 0.8 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.06 * i }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pd-main">
              <div className="pd-meta-row">
                <div>
                  <div className="pd-type">{property.type || 'Apartment'}</div>
                  {/* (video CTA moved into hero image overlay) */}
                  <div className="pd-title">{property.name}</div>
                </div>
                <div className="pd-star-row">
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{property.rating || 4.6}</span>
                  <span>★</span><span>★</span><span>★</span><span>★</span><span style={{ opacity: 0.35 }}>★</span>
                </div>
              </div>

              <div className="pd-facilities">
                <div className="pd-facility"><FaBed /> 2 Beds</div>
                <div className="pd-facility"><FaShower /> 3 Baths</div>
                <div className="pd-facility"><FaUtensils /> Kitchen</div>
                <div className="pd-facility"><FaWifi /> Wifi</div>
                <div className="pd-facility"><FaMapMarkerAlt /> Parking Area</div>
              </div>

              <div className="pd-desc">
                <h4>Description</h4>
                <p>{property.description}</p>
              </div>

              <div className="pd-reviews">
                <h5>Customer Review</h5>
                {(property.reviews || []).slice(0,2).map((r, i) => (
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
              </div>

              <div style={{ marginTop: 20 }}>
                <h5>Location</h5>
                <div className="pd-map" style={{ height: 260 }}>
                  <MapContainer center={[centerPosition.lat, centerPosition.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[propertyPosition.lat, propertyPosition.lng]} icon={redIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Side panel (price + agent + CTAs) */}
          <aside className="pd-sidepanel">
            <div style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
              <div className="pd-type" style={{ textTransform: 'uppercase', fontSize: 12 }}>{property.type}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{property.name}</div>
                <div className="pd-price" style={{ fontSize: 20 }}>{property.price ? `${property.price.toLocaleString()}` : ''}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <AgentProfileCard agent={resolvedAgent} property={property} isReserved={isReserved} onContactClick={(t) => { if (t === 'whatsapp') setShowContact(true); }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn pd-primary" style={{ flex: 1 }}>Message</button>
                <button className="btn" style={{ flex: 1, background: '#22c55e', color: '#fff' }}>Call</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <FooterPro />
    </div>
  );
};

export default PropertyDetails;
