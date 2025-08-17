
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { properties, agents } from '../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../pages/HomeSection.css';
import ChatWidget from '../components/common/ChatWidget';
import FooterPro from '../components/common/FooterPro';

// Redesigned image carousel (thumbnail strip + main image + simple autoplay)
function ImageCarousel({ images = [], name = '' }) {
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
      <div className="carousel-main position-relative rounded overflow-hidden" style={{height:420}}>
        <img src={images[current]} alt={`${name}-${current}`} className="w-100 h-100" style={{objectFit:'cover'}} />
        {images.length > 1 && (
          <>
            <button className="btn btn-outline-light position-absolute top-50 start-0 translate-middle-y ms-2 shadow" onClick={prev}>&lsaquo;</button>
            <button className="btn btn-outline-light position-absolute top-50 end-0 translate-middle-y me-2 shadow" onClick={next}>&rsaquo;</button>
          </>
        )}
        <div className="carousel-dots position-absolute bottom-0 w-100 d-flex justify-content-center gap-1 mb-2">
          {images.map((_, i) => (
            <button key={i} className={`dot btn btn-sm ${i===current? 'btn-success': 'btn-light'}`} onClick={()=>setCurrent(i)} style={{width:10,height:10, padding:0, borderRadius:20}} />
          ))}
        </div>
      </div>

      <div className="d-flex gap-2 mt-2 overflow-auto py-2">
        {images.map((img, idx) => (
          <div key={idx} className={`thumb rounded overflow-hidden ${idx===current? 'border-success':'border-0'}`} style={{width:120, flex:'0 0 auto', cursor:'pointer'}} onClick={() => setCurrent(idx)}>
            <img src={img} alt={`${name}-thumb-${idx}`} style={{width:'100%', height:70, objectFit:'cover'}} />
          </div>
        ))}
      </div>
    </div>
  );
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // compute property and derived values first
  const property = properties.find(p => p.id === Number(id));
  const agent = property ? agents.find(a => a.id === property.agentId) : null;
  const suggestions = property ? properties.filter(p => p.id !== property.id).slice(0, 2) : [];
  const videos = property?.virtualTourVideos && property.virtualTourVideos.length ? property.virtualTourVideos : (property?.virtualTour ? [property.virtualTour] : []);

  // Hooks - declared unconditionally to satisfy rules of hooks
  const [showVirtual, setShowVirtual] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(0);

  // Neighborhood scores state (can be updated by evaluation)
  const initialNeighborhood = (() => {
    if (property.neighborhood) return property.neighborhood;
    const seed = property.id || 7;
    const clamp = v => Math.max(10, Math.min(95, v));
    return {
      eau: clamp((seed * 37) % 90),
      electricite: clamp((seed * 53 + 20) % 90),
      securite: clamp((seed * 29 + 10) % 90),
      route: clamp((seed * 41 + 5) % 90),
    };
  })();
  const [neighborhoodScores, setNeighborhoodScores] = useState(initialNeighborhood);

  const toYoutubeEmbed = (url) => {
    if (!url) return url;
    try {
      if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) {}
    return url;
  };

  // neighborhood scores: generate deterministic pseudo-scores if none provided
  // keep backward-compatible reference
  const neighborhood = neighborhoodScores;

  // Evaluation modal state
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answers, setAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');

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
  const mainPos = agent?.geoloc || { lat: -4.325, lng: 15.322 };

  return (
    <div>
      <Navbar />
      <div className="container" style={{"marginTop": "150px"}}>
        {/* Page header */}
        <div className="mb-4">
          <div className="small text-muted">Accueil / Annonces / Détails</div>
          <h1 className="display-6 fw-bold" style={{marginTop:6}}>{property.name}</h1>
          <p className="text-muted small">{property.description || 'Découvrez les détails du bien, ses équipements, et contactez l\'agent pour plus d\'informations.'}</p>
        </div>
        <div className="row">
          <div className="col-12 col-lg-7 mb-4 mb-lg-0">
            <div className="card shadow-lg border-0" style={{borderRadius:18, overflow:'hidden'}}>
              <ImageCarousel images={property.images} name={property.name} />
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
                    <div className="fs-5 text-success fw-bold"><FaRegMoneyBillAlt className="me-2"/>{property.price.toLocaleString()} $</div>
                  </div>
                </div>

                <div className="mb-2 text-muted"><i className="bi bi-geo-alt me-1"></i> {property.address}</div>
                <p className="text-secondary small">{property.description}</p>

                {(property.type === 'Appartement' || property.type === 'Studio' || property.type === 'Maison') && (
                  <div className="mb-2 d-flex flex-wrap gap-3 align-items-center justify-content-start">
                    <span title="Chambres" className="badge bg-light text-dark border me-1"><FaBed className="me-1 text-primary"/> {property.chambres}</span>
                    <span title="Douches" className="badge bg-light text-dark border me-1"><FaShower className="me-1 text-info"/> {property.douches}</span>
                    <span title="Salon" className="badge bg-light text-dark border me-1"><FaCouch className="me-1 text-warning"/> {property.salon}</span>
                    <span title="Cuisine" className="badge bg-light text-dark border me-1"><FaUtensils className="me-1 text-success"/> {property.cuisine}</span>
                    <span title="Salle de bain" className="badge bg-light text-dark border"><FaBath className="me-1 text-danger"/> {property.sdb}</span>
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
                    {[{key:'eau',label:'Eau'},{key:'electricite',label:'Électricité'},{key:'securite',label:'Sécurité'},{key:'route',label:'Routes'}].map(item => (
                      <div key={item.key}>
                        <div className="d-flex justify-content-between small mb-1"><div>{item.label}</div><div className="text-muted">{neighborhood[item.key]}%</div></div>
                        <div className="progress" style={{height:8}}>
                          <div className="progress-bar" role="progressbar" style={{width:`${neighborhood[item.key]}%`, background:'#13c296'}} aria-valuenow={neighborhood[item.key]} aria-valuemin="0" aria-valuemax="100"></div>
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

                {/* Agent block */}
                {agent && (
                  <div className="d-flex align-items-center mt-3 p-2 rounded-3 bg-light" style={{boxShadow:'0 2px 8px #0001'}}>
                    <img src={agent.photo} alt={agent.name} className="rounded-circle me-2 border" style={{width:44, height:44, objectFit:'cover', border:'2px solid #13c296'}} />
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-success small">{agent.name}</div>
                      <div className="small text-muted">{agent.phone}</div>
                    </div>
                    <a href={`https://wa.me/${agent.whatsapp.replace('+','')}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-success btn-sm ms-2" title="WhatsApp"><FaWhatsapp /></a>
                    <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm ms-2" title="Facebook"><FaFacebook /></a>
                    <button className="btn btn-outline-dark btn-sm ms-2" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, propertyId: property.id } } }))}><FaPhone /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5 mt-4 mt-lg-0">
            <div className="mb-4">
              <h5 className="fw-bold text-primary mb-2">Suggestions</h5>
              <div className="row g-3">
                {suggestions.map(sug => {
                  const sugAgent = agents.find(a => a.id === sug.agentId);
                  return (
                    <div className="col-12" key={sug.id}>
                      <div className="card border-0 shadow-sm h-100" style={{cursor:'pointer'}} onClick={() => navigate(`/properties/${sug.id}`)}>
                        <div className="d-flex align-items-center gap-2 p-2">
                          <img src={sug.images[0]} alt={sug.name} className="rounded" style={{width:110, height:80, objectFit:'cover'}} />
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

            <div className="rounded-4 overflow-hidden border" style={{height:260}}>
              <MapContainer center={[mainPos.lat, mainPos.lng]} zoom={13} style={{height:'100%',width:'100%'}} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[mainPos.lat, mainPos.lng]} icon={new L.Icon({iconUrl: require('../img/leaflet/marker-icon-2x-red.png'), iconSize:[25,41], iconAnchor:[12,41], shadowUrl: require('../img/leaflet/marker-shadow.png'), shadowSize:[41,41]})}>
                  <Popup><b>{property.name}</b><br/>{property.address}</Popup>
                </Marker>
                {suggestions.map(sug => {
                  const sugAgent = agents.find(a => a.id === sug.agentId);
                  const pos = sugAgent?.geoloc || { lat: -4.325, lng: 15.322 };
                  return (
                    <Marker key={sug.id} position={[pos.lat, pos.lng]} icon={new L.Icon({iconUrl: require('../img/leaflet/marker-icon-2x-blue.png'), iconSize:[25,41], iconAnchor:[12,41], shadowUrl: require('../img/leaflet/marker-shadow.png'), shadowSize:[41,41]})}>
                      <Popup><b>{sug.name}</b><br/>{sug.address}</Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Virtual tour video gallery (bottom of page) */}
        {videos && videos.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-3">Visite virtuelle & vidéos</h4>
            <div className="card p-3 mb-3">
              <div style={{height:420}} className="d-flex align-items-center justify-content-center bg-dark rounded">
                {videos[selectedVideo] && (videos[selectedVideo].includes('youtube') || videos[selectedVideo].includes('youtu') || videos[selectedVideo].includes('watch?v=' ) || videos[selectedVideo].includes('youtu.be')) ? (
                  <iframe src={toYoutubeEmbed(videos[selectedVideo])} title="Visite virtuelle" style={{width:'100%', height:420, border:0}} />
                ) : (
                  <video src={videos[selectedVideo]} controls style={{width:'100%', height:420, objectFit:'cover'}} />
                )}
              </div>

              <div className="d-flex gap-2 mt-3 overflow-auto py-2">
                {videos.map((v, i) => (
                  <div key={i} className={`border rounded ${i===selectedVideo? 'border-success':'border-0'}`} style={{width:160, flex:'0 0 auto', cursor:'pointer'}} onClick={()=>setSelectedVideo(i)}>
                    { (v.includes('youtube') || v.includes('youtu')) ? (
                      <img src={`https://img.youtube.com/vi/${(v.split('v=')[1]||v.split('/').pop()).split('&')[0]}/hqdefault.jpg`} alt={`thumb-${i}`} style={{width:'100%', height:90, objectFit:'cover'}}/>
                    ) : (
                      <video src={v} style={{width:'100%', height:90, objectFit:'cover'}} muted/>
                    )}
                    <div className="p-2 small text-truncate">Vidéo {i+1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
