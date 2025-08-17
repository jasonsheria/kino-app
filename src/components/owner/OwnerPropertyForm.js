import React, { useState, useMemo, useEffect, useRef } from 'react';
import { agents, properties as sampleProps, owners as sampleOwners } from '../../data/fakedata';

export default function OwnerPropertyForm({onSave, initial={}}){
  const defaults = {
    title: initial.title || initial.name || '',
    type: initial.type || 'Appartement',
    price: initial.price || '',
    image: initial.image || (initial.images && initial.images[0]) || '',
    address: initial.address || '',
    description: initial.description || '',
    agentId: initial.agentId || (agents && agents[0] && agents[0].id) || null,
    chambres: initial.chambres || initial.bedrooms || 0,
    douches: initial.douches || 0,
    salon: initial.salon || 0,
    cuisine: initial.cuisine || 0,
    sdb: initial.sdb || 0,
  superficie: initial.superficie || initial.area || '',
    features: initial.features || [],
    status: initial.status || 'vente'
  ,
  geoloc: initial.geoloc || { lat: '', lng: '' }
  };

  const [p, setP] = useState(defaults);
  const [errors, setErrors] = useState({});

  // images as array for multi-upload
  const [images, setImages] = useState(initial.images ? initial.images.slice() : (defaults.image ? [defaults.image] : []));

  useEffect(()=>{ setP(prev => ({...prev, images})); }, [images]);


  const types = useMemo(()=>{
    const fromSample = Array.from(new Set((sampleProps||[]).map(x=>x.type).filter(Boolean)));
    const base = ['Appartement','Maison','Villa','Studio','Terrain','Terrain vide','Boutique','Place commerciale','Magasin','Penthouse','Salle de fête','Voiture'];
    const merged = Array.from(new Set([...fromSample, ...base]));
    return merged;
  }, []);

  const toggleFeature = (f)=>{
    const next = p.features && p.features.includes(f) ? p.features.filter(x=>x!==f) : [...(p.features||[]), f];
    setP({...p, features: next});
  };

  const submit = (e)=>{ e && e.preventDefault && e.preventDefault(); onSave(p); };

  const isResidential = ['Appartement','Maison','Villa','Studio','Penthouse'].includes(p.type);
  const isLand = p.type && p.type.toLowerCase().includes('terrain');
  const isCommercial = ['Boutique','Place commerciale','Magasin'].includes(p.type);

  // Simple client-side validation
  const validate = ()=>{
    const err = {};
    if(!p.title || !p.title.trim()) err.title = 'Le titre est requis';
    if(p.price && isNaN(Number(p.price))) err.price = 'Le prix doit être un nombre';
    if(isResidential && (!p.chambres || Number(p.chambres) < 0)) err.chambres = 'Nombre de chambres invalide';
    // geolocation validation: require both lat and lng to place on map
    const lat = p.geoloc && p.geoloc.lat !== undefined ? Number(p.geoloc.lat) : NaN;
    const lng = p.geoloc && p.geoloc.lng !== undefined ? Number(p.geoloc.lng) : NaN;
    if(Number.isNaN(lat) || Number.isNaN(lng)){
      err.geoloc = 'Coordonnées GPS (latitude et longitude) valides requises';
    } else {
      if(lat < -90 || lat > 90) err.geoloc = 'Latitude doit être entre -90 et 90';
      if(lng < -180 || lng > 180) err.geoloc = 'Longitude doit être entre -180 et 180';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = (e)=>{ e.preventDefault(); if(!validate()) return; onSave({...p, images}); };

  // Leaflet map preview refs/state
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && !!window.L);

  useEffect(()=>{
    if(leafletReady) return;
    // load leaflet css and script dynamically
    const cssId = 'leaflet-css';
    if(!document.getElementById(cssId)){
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const scriptId = 'leaflet-js';
    if(!document.getElementById(scriptId)){
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.onload = ()=> setLeafletReady(true);
      document.body.appendChild(s);
    } else {
      setLeafletReady(true);
    }
  }, [leafletReady]);

  // update map when coords change and leaflet is ready
  useEffect(()=>{
    const lat = p.geoloc && p.geoloc.lat !== undefined && p.geoloc.lat !== '' ? Number(p.geoloc.lat) : NaN;
    const lng = p.geoloc && p.geoloc.lng !== undefined && p.geoloc.lng !== '' ? Number(p.geoloc.lng) : NaN;
    if(!leafletReady || Number.isNaN(lat) || Number.isNaN(lng)) return;
    const L = window.L;
    if(!mapInstanceRef.current){
      // create map
      try{
        mapInstanceRef.current = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }catch(e){
        // silent
      }
    } else {
      mapInstanceRef.current.setView([lat, lng], 13);
      if(markerRef.current){ markerRef.current.setLatLng([lat, lng]); }
      else { markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current); }
    }
  }, [leafletReady, p.geoloc]);

  // determine preferred agents from owner draft or sampleOwners
  const ownerDraft = useMemo(()=>{
    try{ const raw = localStorage.getItem('owner_request_draft'); if(raw) return JSON.parse(raw); }catch(e){}
    return null;
  }, []);

  const preferredAgentIds = useMemo(()=>{
    if(ownerDraft && ownerDraft.preferredAgents) return ownerDraft.preferredAgents;
    if(sampleOwners && sampleOwners[0] && sampleOwners[0].preferredAgents) return sampleOwners[0].preferredAgents;
    return null;
  }, [ownerDraft]);

  const agentOptions = useMemo(()=>{
    if(preferredAgentIds && preferredAgentIds.length){ return agents.filter(a=> preferredAgentIds.includes(a.id)); }
    return agents;
  }, [preferredAgentIds]);

  // image helpers
  const addFiles = (fileList)=>{
    const files = Array.from(fileList).slice(0,8 - images.length); // limit to 8 images
    const readers = files.map(f=> new Promise(res=>{
      const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs=> setImages(prev=> [...prev, ...imgs]));
  };

  const removeImage = (idx)=> setImages(prev=> prev.filter((_,i)=> i!==idx));

  const useMyLocation = ()=>{
    if(!navigator.geolocation) { setErrors(prev=>({...prev, geoloc:'Géolocalisation non supportée par votre navigateur'})); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      setP(prev=> ({...prev, geoloc: { lat, lng }}));
      setErrors(prev=>{ const copy = {...prev}; delete copy.geoloc; return copy; });
    }, err=>{
      setErrors(prev=>({...prev, geoloc: 'Impossible d obtenir la position: ' + (err.message||err.code)}));
    }, {enableHighAccuracy:true, timeout:8000});
  };

  return (
    <div className="card mt-3 owner-card owner-form">
      <div className="card-body">
        <h5 className="mb-3">{defaults.title ? 'Modifier bien' : 'Ajouter un bien'}</h5>
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3"><input className="form-control" placeholder="Titre" value={p.title} onChange={e=>setP({...p,title:e.target.value})} required /></div>
            <div className="col-md-3 mb-3">
              <select className="form-select" value={p.type} onChange={e=>setP({...p,type:e.target.value})}>
                {types.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <input className="form-control" placeholder="Prix" value={p.price} onChange={e=>setP({...p,price:e.target.value})} />
            </div>
          </div>

          <div className="row">
            <div className="col-md-8 mb-3"><input className="form-control" placeholder="Adresse complète" value={p.address} onChange={e=>setP({...p,address:e.target.value})} /></div>
            <div className="col-md-4 mb-3">
              <select className="form-select" value={p.agentId||''} onChange={e=>setP({...p,agentId: Number(e.target.value)})}>
                {agentOptions.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {preferredAgentIds && preferredAgentIds.length>0 && <div className="small text-muted">Agents suggérés selon vos préférences</div>}
            </div>
          </div>

          <div className="mb-3"><textarea className="form-control" placeholder="Description" value={p.description} onChange={e=>setP({...p,description:e.target.value})} rows={3} /></div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="mb-2 small text-muted">Images (max 8) — glisser/déposer ou cliquez pour sélectionner</div>
              <div className="d-flex gap-2 flex-wrap">
                {images.map((src,idx)=> (
                  <div key={idx} style={{position:'relative'}}>
                    <img src={src} alt="preview" style={{width:100,height:70,objectFit:'cover',borderRadius:6}} />
                    <button type="button" className="btn btn-sm btn-danger" style={{position:'absolute',right:2,top:2}} onClick={()=>removeImage(idx)}>×</button>
                  </div>
                ))}
                {images.length < 8 && (
                  <label className="btn btn-outline-secondary btn-sm" style={{height:70,display:'inline-flex',alignItems:'center',padding:'0 12px',borderRadius:6, cursor:'pointer'}}>
                    Ajouter
                    <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=> addFiles(e.target.files)} />
                  </label>
                )}
              </div>
            </div>
            <div className="col-md-6 mb-3"><input className="form-control" placeholder="Superficie (m²)" value={p.superficie} onChange={e=>setP({...p,superficie:e.target.value})} /></div>
          </div>

          <div className="row">
            <div className="col-md-7 mb-3">
              <div className="row">
                <div className="col-md-6 mb-2"><input className="form-control" placeholder="Latitude" value={p.geoloc && p.geoloc.lat !== undefined ? p.geoloc.lat : ''} onChange={e=>setP({...p,geoloc:{...p.geoloc, lat: e.target.value}})} /></div>
                <div className="col-md-6 mb-2"><input className="form-control" placeholder="Longitude" value={p.geoloc && p.geoloc.lng !== undefined ? p.geoloc.lng : ''} onChange={e=>setP({...p,geoloc:{...p.geoloc, lng: e.target.value}})} /></div>
                <div className="col-12"><button type="button" className="btn btn-outline-secondary btn-sm mt-1" onClick={useMyLocation}>Utiliser ma position</button></div>
              </div>
            </div>
            <div className="col-md-5 mb-3">
              <div style={{width:'100%',height:160,borderRadius:6,overflow:'hidden',background:'#f3f3f3'}}>
                <div ref={mapDivRef} style={{width:'100%',height:'100%'}} />
              </div>
              <div className="small text-muted mt-1">Aperçu de la position (OpenStreetMap)</div>
            </div>
          </div>

          {isResidential && (
            <div className="row">
              <div className="col-md-2 mb-3"><input type="number" min="0" className="form-control" placeholder="Chambres" value={p.chambres} onChange={e=>setP({...p,chambres: Number(e.target.value)})} /></div>
              <div className="col-md-2 mb-3"><input type="number" min="0" className="form-control" placeholder="Douches" value={p.douches} onChange={e=>setP({...p,douches: Number(e.target.value)})} /></div>
              <div className="col-md-2 mb-3"><input type="number" min="0" className="form-control" placeholder="Salon" value={p.salon} onChange={e=>setP({...p,salon: Number(e.target.value)})} /></div>
              <div className="col-md-2 mb-3"><input type="number" min="0" className="form-control" placeholder="Cuisine" value={p.cuisine} onChange={e=>setP({...p,cuisine: Number(e.target.value)})} /></div>
              <div className="col-md-2 mb-3"><input type="number" min="0" className="form-control" placeholder="SDB" value={p.sdb} onChange={e=>setP({...p,sdb: Number(e.target.value)})} /></div>
            </div>
          )}

          {isCommercial && (
            <div className="mb-3">
              <div className="small text-muted">Caractéristiques</div>
              <div className="d-flex gap-2 flex-wrap mt-2">
                {['Parking','Cuisine','Sécurité','Vitrine'].map(f=> (
                  <button key={f} type="button" className={`btn btn-sm ${p.features && p.features.includes(f) ? 'owner-btn-primary' : 'btn-outline-secondary'}`} onClick={() => toggleFeature(f)}>{f}</button>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button className="btn owner-btn-primary" type="submit" disabled={Object.keys(errors).length>0}>Enregistrer</button>
            <button type="button" className="btn btn-outline-secondary" onClick={()=>onSave(initial)}>Annuler</button>
          </div>
          {Object.keys(errors).length>0 && (
            <div className="mt-2 text-danger small">
              {Object.values(errors).map((v,i)=>(<div key={i}>{v}</div>))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
