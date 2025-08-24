import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agents } from '../../data/fakedata';
import AgentContactModal from '../common/AgentContactModal';
import VisitUnlockModal from '../common/VisitUnlockModal';
import { FaWhatsapp } from 'react-icons/fa';
import { FaCar, FaTachometerAlt, FaPalette, FaCalendarAlt, FaGasPump, FaCogs, FaUserTie, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

const VehicleCard = ({ vehicle }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const agent = agents.find(a => a.id === vehicle.agentId);
  const nextImg = () => setImgIdx((imgIdx + 1) % vehicle.images.length);
  const prevImg = () => setImgIdx((imgIdx - 1 + vehicle.images.length) % vehicle.images.length);
  const [showContact, setShowContact] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlocked, setUnlocked] = useState(()=>{
    try{ const raw = localStorage.getItem('unlocked_contacts'); return raw ? JSON.parse(raw).includes(vehicle.id) : false; }catch(e){return false}
  });
  const navigate = useNavigate();

  return (
  <div className="card shadow-lg border-0 mb-4 vehicle-card animate__animated animate__fadeInUp" style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(120deg, rgba(19,194,150,0.03) 40%, rgba(25,118,210,0.03) 100%)', minHeight: 160 }}>
      <div className="position-relative">
        <img
          src={vehicle.images[imgIdx]}
          alt={vehicle.name}
          className="card-img-top animate__animated animate__zoomIn"
          style={{ height: 180, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18, cursor: 'pointer', transition: 'transform .4s' }}
          onClick={nextImg}
        />
        {vehicle.images.length > 1 && (
          <>
            <button className="btns btn-light position-absolute top-50 start-0 translate-middle-y ms-2 shadow" style={{zIndex:2}} onClick={prevImg}><i className="bi bi-chevron-left"></i></button>
            <button className="btns btn-light position-absolute top-50 end-0 translate-middle-y me-2 shadow" style={{zIndex:2}} onClick={nextImg}><i className="bi bi-chevron-right"></i></button>
          </>
        )}
  <span className="badge position-absolute top-0 end-0 m-2 fs-6 shadow" style={{background:'#13c296', color:'#fff'}}>{vehicle.type}</span>
  <span className="badge position-absolute top-0 start-0 m-2 fs-6 shadow" style={{background:'#1976d2', color:'#fff'}}>{vehicle.status}</span>
      </div>
      <div className="card-body">
        <h6 className="card-title fw-bold text-primary mb-1">{vehicle.name}</h6>
        <div className="mb-2 text-muted small d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> {vehicle.address}</div>
        <div className="mb-2">
          <span className="d-block fs-6 text-dark mb-1" style={{ fontWeight: 500 }}>
            <FaCar className="me-2 text-success" style={{ fontSize: 22 }} />
            <span className="fs-5 text-success fw-bold">{vehicle.price.toLocaleString()} $</span>
          </span>
          <span className="text-secondary small">{vehicle.description}</span>
        </div>
        <div className="mb-2 d-flex flex-wrap gap-2 align-items-center justify-content-start">
          <span className="badge bg-light text-dark border me-1" title="Couleur"><FaPalette className="me-1 text-primary" /> {vehicle.couleur}</span>
          <span className="badge bg-light text-dark border me-1" title="Kilométrage"><FaTachometerAlt className="me-1 text-info" /> {vehicle.kilometrage} km</span>
          <span className="badge bg-light text-dark border me-1" title="Année"><FaCalendarAlt className="me-1 text-warning" /> {vehicle.annee}</span>
          <span className="badge bg-light text-dark border me-1" title="Carburant"><FaGasPump className="me-1 text-success" /> {vehicle.carburant}</span>
          <span className="badge bg-light text-dark border me-1" title="Transmission"><FaCogs className="me-1 text-danger" /> {vehicle.transmission}</span>
          <span className="badge bg-light text-dark border me-1" title="Places"><FaUsers className="me-1 text-secondary" /> {vehicle.places}</span>
        </div>
  {agent && (
          <div className="d-flex align-items-center mt-3 p-2 rounded-3 bg-light animate__animated animate__fadeIn animate__delay-1s" style={{ boxShadow: '0 2px 8px #0001', position:'relative' }}>
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
                    <button className="btns btn-outline-dark btn-sm ms-2" title="Téléphone" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, vehicleId: vehicle.id } } }))}><FaUserTie /></button>
                    <button className="btns btn-success btn-sm ms-2" title="WhatsApp" onClick={()=>setShowContact(true)}><FaWhatsapp /></button>
                    {showContact && <AgentContactModal agent={agent} open={showContact} onClose={()=>setShowContact(false)} />}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      {showUnlock && <VisitUnlockModal open={showUnlock} onClose={()=>setShowUnlock(false)} agent={agent} property={vehicle} onUnlocked={(pid)=>{ setUnlocked(true); setShowUnlock(false); }} />}
        {/* Bouton Visiter (comme pour les biens immobiliers) */}
        <div className="d-flex justify-content-end mt-3">
          <button className="btns btn-outline-primary btn-sm px-3 fw-bold" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
            Visiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
