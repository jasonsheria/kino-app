



import React, { useState } from 'react';
import { agents, properties } from '../../data/fakedata';
import { FaBed, FaShower, FaCouch, FaUtensils, FaBath, FaWhatsapp, FaFacebook, FaPhone, FaMapMarkerAlt, FaRegMoneyBillAlt } from 'react-icons/fa';
import AgentContactModal from '../common/AgentContactModal';
import VisitUnlockModal from '../common/VisitUnlockModal';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const PropertyCard = ({ property }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const agent = agents.find(a => a.id === property.agentId);
  const [showContact, setShowContact] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlocked, setUnlocked] = useState(()=>{
    try{ const raw = localStorage.getItem('unlocked_contacts'); return raw ? JSON.parse(raw).includes(property.id) : false; }catch(e){return false}
  });
  const navigate = useNavigate();

  // safe images array (fallback to property.image or a bundled placeholder)
  const imgs = Array.isArray(property.images) && property.images.length
    ? property.images
    : (property.image ? [property.image] : [require('../../img/property-1.jpg')]);
  const displayName = property.name || property.title || 'Bien immobilier';

  // Suggestions (autres biens, exclure le courant)
  const suggestions = properties.filter(p => p.id !== property.id).slice(0, 3);

  // Custom marker icons
  const redIcon = new L.Icon({
    iconUrl: require('../../img/leaflet/marker-icon-2x-red.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('../../img/leaflet/marker-shadow.png'),
    shadowSize: [41, 41]
  });
  const blueIcon = new L.Icon({
      iconUrl: require('../../img/leaflet/marker-icon-2x-blue.png'),
  shadowUrl: require('../../img/leaflet/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setShowLightbox(true);
  };
  const closeLightbox = () => setShowLightbox(false);
  const nextImg = () => { const l = imgs.length || 1; setLightboxIndex((lightboxIndex + 1) % l); };
  const prevImg = () => { const l = imgs.length || 1; setLightboxIndex((lightboxIndex - 1 + l) % l); };

  // Pour la map, on prend la géoloc de l'agent (sinon défaut Kinshasa)
  const mainPos = agent?.geoloc || { lat: -4.325, lng: 15.322 };

  return (
    <div className="card shadow-lg border-0 mb-4 property-card animate__animated animate__fadeInUp" style={{borderRadius:18, overflow:'hidden', transition:'box-shadow .3s'}}>
      <div className="position-relative">
          <img
          src={imgs[0]}
          alt={displayName}
          className="card-img-top property-img animate__animated animate__zoomIn"
          style={{height: 200, objectFit: 'cover', cursor: 'pointer', borderTopLeftRadius:18, borderTopRightRadius:18, transition:'transform .4s'}}
          onClick={() => imgs.length && openLightbox(0)}
        />
  <span className="badge position-absolute top-0 end-0 m-2 fs-6 shadow" style={{background:'#13c296', color:'#fff'}}>{property.type}</span>
  <span className="badge position-absolute top-0 start-0 m-2 fs-6 shadow" style={{background:'#1976d2', color:'#fff'}}>{property.status}</span>
      </div>
      <div className="card-body">
  <h6 className="card-title fw-bold text-primary mb-1">{displayName}</h6>
        <div className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1"></i> {property.address}</div>
        <div className="mb-2">
            <span className="d-block fs-6 text-dark mb-1" style={{fontWeight:500}}>
            <FaRegMoneyBillAlt className="me-2 text-success" style={{fontSize:22}}/>
            <span className="fs-5 text-success fw-bold">{(property.price || 0).toLocaleString()} $</span>
          </span>
          <span className="text-secondary small">{property.description}</span>
        </div>
        {/* Spécificités pour Appartement, Studio, Maison */}
  {(property.type === 'Appartement' || property.type === 'Studio' || property.type === 'Maison') && (
          <div className="mb-2 d-flex flex-wrap gap-3 align-items-center justify-content-start">
            <span title="Chambres" className="badge bg-light text-dark border me-1"><FaBed className="me-1 text-primary"/> {property.chambres}</span>
            <span title="Douches" className="badge bg-light text-dark border me-1"><FaShower className="me-1 text-info"/> {property.douches}</span>
            <span title="Salon" className="badge bg-light text-dark border me-1"><FaCouch className="me-1 text-warning"/> {property.salon}</span>
            <span title="Cuisine" className="badge bg-light text-dark border me-1"><FaUtensils className="me-1 text-success"/> {property.cuisine}</span>
            <span title="Salle de bain" className="badge bg-light text-dark border"><FaBath className="me-1 text-danger"/> {property.sdb}</span>
          </div>
        )}
        {/* Bouton Voir plus */}
        <div className="d-flex justify-content-end mb-2">
          <button className="btns btn-outline-primary btn-sm px-3 fw-bold" onClick={() => navigate(`/properties/${property.id}`)}>
            Visiter <FaMapMarkerAlt className="ms-1"/>
          </button>
        </div>
        {/* Agent lié */}
        {agent && (
          <div className="d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s" style={{boxShadow:'0 2px 8px #0001', position:'relative'}}>
            <div style={{position:'relative', display:'flex', alignItems:'center', gap:12, width:'100%'}}>
              <div style={{display:'flex',alignItems:'center',gap:12, flex:1}}>
                <div style={{width:38, height:38, borderRadius:999, overflow:'hidden', border:'2px solid var(--ndaku-primary)', flex:'0 0 38px', filter: unlocked ? 'none' : 'blur(4px) grayscale(.15)', transition:'filter .32s ease'}}>
                  <img src={agent.photo} alt={agent.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
                <div style={{flex:1}}>
                  <div className="fw-semibold small" style={{color: unlocked ? 'var(--ndaku-primary)' : 'rgba(0,0,0,0.6)', fontWeight:700}}>{agent.name}</div>
                  <div className="small text-muted" style={{filter: unlocked ? 'none' : 'blur(3px)'}}>{unlocked ? agent.phone : '••• ••• •••'}</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                {!unlocked ? (
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:42,height:42, borderRadius:8, background:'var(--ndaku-primary-100)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="var(--ndaku-primary)" d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                    </div>
                    <button className="btns btn-primary btn-sm" title="Réserver" onClick={()=>setShowUnlock(true)} style={{padding:'6px 10px', borderRadius:8, fontWeight:700, transform:'translateY(0)', transition:'transform .18s'}} onMouseEnter={(e)=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={(e)=>e.currentTarget.style.transform='translateY(0)'}>Réserver</button>
                  </div>
                ) : (
                  <>
                    <button className="btns btn-outline-success btn-sm ms-2" title="WhatsApp" onClick={()=>setShowContact(true)}><FaWhatsapp /></button>
                    {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
                    <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="btns btn-outline-primary btn-sm ms-2" title="Facebook"><FaFacebook /></a>
                    <button className="btns btn-outline-dark btn-sm ms-2" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, propertyId: property.id } } }))}><FaPhone /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      {showUnlock && <VisitUnlockModal open={showUnlock} onClose={()=>setShowUnlock(false)} agent={agent} property={property} onUnlocked={(pid)=>{ setUnlocked(true); setShowUnlock(false); }} />}
      </div>
      {/* Lightbox */}
      {showLightbox && imgs.length > 0 && (
        <div className="lightbox position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate__animated animate__fadeIn" style={{background:'rgba(0,0,0,0.8)',zIndex:2000}}>
          <button className="btns btn-light position-absolute top-0 end-0 m-3" onClick={closeLightbox}>&times;</button>
          <button className="btns btn-light position-absolute start-0 top-50 translate-middle-y ms-3" onClick={prevImg}><i className="bi bi-chevron-left"></i></button>
          <img src={imgs[lightboxIndex % imgs.length]} alt="" style={{maxHeight:'80vh', maxWidth:'90vw', borderRadius:8, boxShadow:'0 4px 32px #0008'}} />
          <button className="btns btn-light position-absolute end-0 top-50 translate-middle-y me-3" onClick={nextImg}><i className="bi bi-chevron-right"></i></button>
        </div>
      )}

  {/* ...aucune carte ni suggestions ici, à déplacer dans PropertyDetails... */}
    </div>
  );
};

export default PropertyCard;
