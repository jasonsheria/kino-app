
import React, { useEffect, useState } from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import Modal from '../components/common/Modal';
import { currentAgencySession } from '../api/agencies';
import * as api from '../api/agencyProducts';

const PROPERTY_TYPES = [
  'Appartement', 'Voiture', 'Bureau', 'Salle de fête', 'Terrain', 'Magasin', 'Place commerciale'
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES = 6;

export default function AgencyProducts(){
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    name:'',
    type: PROPERTY_TYPES[0],
    price:'',
    description:'',
    images: [], // data URLs
    agentId: '',
    address: '',
    saleType: 'vente',
    location: { lat:'', lng:'' },
    car: { make:'', model:'', year:'', mileage:'' },
    apartment: { bedrooms:'', bathrooms:'', area:'' }
  });
  const [agents, setAgents] = useState([]);
  const agencyId = currentAgencySession()?.id || 'demo-agency';

  const load = async ()=>{
    setLoading(true);
    const list = await api.fetchProducts(agencyId);
    setProducts(list || []);
    // load agents if stored in agency store
    try{
      const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
      const a = store[agencyId] || {};
      setAgents(a.agents || []);
    }catch(e){ setAgents([]); }
    setLoading(false);
  };

  useEffect(()=>{ load(); const h = ()=> load(); window.addEventListener('ndaku-agency-change', h); return () => window.removeEventListener('ndaku-agency-change', h); }, [agencyId]);

  const openCreate = ()=>{
    setEdit(null);
    setForm({ name:'', type: PROPERTY_TYPES[0], price:'', description:'', images:[], agentId:'', address:'', saleType:'vente', location:{lat:'',lng:''}, car:{make:'',model:'',year:'',mileage:''}, apartment:{bedrooms:'',bathrooms:'',area:''} });
    setOpen(true);
  };

  const openEdit = (p)=>{
    setEdit(p);
    setForm({ name:p.name||'', type:p.type||PROPERTY_TYPES[0], price:p.price||'', description:p.description||'', images:p.images||[], agentId:p.agentId||'', address:p.address||'', saleType:p.saleType||'vente', location:p.location||{lat:'',lng:''}, car:p.car||{make:'',model:'',year:'',mileage:''}, apartment:p.apartment||{bedrooms:'',bathrooms:'',area:''} });
    setOpen(true);
  };

  const handleImage = (e)=>{
    const files = Array.from(e.target.files || []);
    if(!files.length) return;
    const allowed = files.filter(f => f.type.startsWith('image/'));
    const oversized = allowed.filter(f => f.size > MAX_IMAGE_BYTES);
    if(oversized.length){ window.alert(`${oversized.length} image(s) trop volumineuse(s) (max ${MAX_IMAGE_BYTES/1024/1024}MB)`); }
    const toProcess = allowed.filter(f => f.size <= MAX_IMAGE_BYTES).slice(0, MAX_IMAGES - form.images.length);
    if(toProcess.length===0){ e.target.value=''; return; }
    let remaining = toProcess.length;
    const images = [...form.images];
    toProcess.forEach(file => {
      const r = new FileReader();
      r.onload = ()=>{
        images.push(r.result);
        remaining -= 1;
        if(remaining===0) setForm({...form, images});
      };
      r.readAsDataURL(file);
    });
    e.target.value='';
  };

  const removeImageAt = (idx)=>{ const images = [...form.images]; images.splice(idx,1); setForm({...form, images}); };

  const save = async ()=>{
    if(!form.name){ window.alert('Nom requis'); return; }
    if(form.images.length > MAX_IMAGES){ window.alert(`Max ${MAX_IMAGES} images`); return; }
    if(edit){
      await api.updateProduct(agencyId, edit.id, { ...form });
    } else {
      const now = new Date().toISOString();
      await api.createProduct(agencyId, { ...form, created: now });
    }
    await load();
    setOpen(false);
  };

  const remove = async (id)=>{ if(!window.confirm('Supprimer ce produit ?')) return; await api.deleteProduct(agencyId, id); await load(); };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between">
          <h4>Produits</h4>
          <button className="btn owner-btn-primary" onClick={openCreate}>Nouveau produit</button>
        </div>
        <div className="small text-muted mb-2">Liste et gestion des produits de l'agence.</div>

        {loading ? <div>Chargement...</div> : (
          <div className="row">
            {products.length===0 && <div className="small text-muted">Aucun produit</div>}
            {products.map(p=> (
              <div className="col-12 col-md-6" key={p.id}>
                <div className="card p-3 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{width:120,height:90,flex:'0 0 120px'}}>
                      {p.images && p.images.length>0 ? <img src={p.images[0]} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} alt="" /> : <div style={{width:'100%',height:'100%',background:'#f1f5f9',borderRadius:8}} />}
                    </div>
                    <div style={{flex:1}}>
                      <div className="fw-bold">{p.name}</div>
                      <div className="small text-muted">Type: {p.type} • {p.saleType === 'vente' ? 'À vendre' : 'Location'} • Prix: {p.price || '—'}</div>
                      <div className="small text-muted">{p.address || ''} {p.location && p.location.lat ? `• (${p.location.lat}, ${p.location.lng})` : ''}</div>
                      <div className="small mt-2">{p.description}</div>
                      <div className="small text-muted mt-2">Agent: {agents.find(a=> a.id===p.agentId)?.name || '—'}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <button className="btn btn-sm btn-link" onClick={()=> openEdit(p)}>Éditer</button>
                      <button className="btn btn-sm btn-danger" onClick={()=> remove(p.id)}>Supprimer</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={open} onClose={()=> setOpen(false)}>
          <div style={{minWidth:420}}>
            <h5>{edit? 'Modifier produit':'Nouveau produit'}</h5>
            <input data-testid="name-input" className="form-control mb-2" placeholder="Nom du produit" value={form.name} onChange={e=> setForm({...form, name: e.target.value})} />
            <div className="d-flex gap-2 mb-2">
              <select className="form-select" value={form.type} onChange={e=> setForm({...form, type: e.target.value})}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="form-select" value={form.saleType} onChange={e=> setForm({...form, saleType: e.target.value})}>
                <option value="vente">Vente</option>
                <option value="location">Location</option>
              </select>
            </div>
            <input className="form-control mb-2" placeholder="Prix" value={form.price} onChange={e=> setForm({...form, price: e.target.value})} />
            <input className="form-control mb-2" placeholder="Adresse (ex: Rue, ville)" value={form.address} onChange={e=> setForm({...form, address: e.target.value})} />
            <div className="d-flex gap-2 mb-2">
              <input className="form-control" placeholder="Latitude" value={form.location.lat} onChange={e=> setForm({...form, location:{...form.location, lat: e.target.value}})} />
              <input className="form-control" placeholder="Longitude" value={form.location.lng} onChange={e=> setForm({...form, location:{...form.location, lng: e.target.value}})} />
            </div>

            <div className="mb-2">
              <label className="form-label small">Agent associé</label>
              <select className="form-select" value={form.agentId} onChange={e=> setForm({...form, agentId: e.target.value})}>
                <option value="">-- Aucun --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <textarea className="form-control mb-2" placeholder="Description" value={form.description} onChange={e=> setForm({...form, description: e.target.value})} />

            <div className="mb-2">
              <label className="form-label small">Images (max {MAX_IMAGES}, {MAX_IMAGE_BYTES/1024/1024}MB chacune)</label>
              <input data-testid="image-input" type="file" accept="image/*" multiple onChange={handleImage} />
              <div className="d-flex gap-2 flex-wrap mt-2">
                {form.images.map((src, idx)=> (
                  <div key={idx} style={{position:'relative'}}>
                    <img src={src} alt="preview" style={{width:92,height:72,objectFit:'cover',borderRadius:6}} />
                    <button className="btn btn-sm btn-link" style={{position:'absolute',right:2,top:2}} onClick={()=> removeImageAt(idx)}>x</button>
                  </div>
                ))}
              </div>
            </div>

            {/* type-specific fields */}
            {form.type === 'Voiture' && (
              <div className="mb-2">
                <div className="d-flex gap-2">
                  <input className="form-control" placeholder="Marque" value={form.car.make} onChange={e=> setForm({...form, car:{...form.car, make: e.target.value}})} />
                  <input className="form-control" placeholder="Modèle" value={form.car.model} onChange={e=> setForm({...form, car:{...form.car, model: e.target.value}})} />
                </div>
                <div className="d-flex gap-2 mt-2">
                  <input className="form-control" placeholder="Année" value={form.car.year} onChange={e=> setForm({...form, car:{...form.car, year: e.target.value}})} />
                  <input className="form-control" placeholder="Kilométrage" value={form.car.mileage} onChange={e=> setForm({...form, car:{...form.car, mileage: e.target.value}})} />
                </div>
              </div>
            )}

            {form.type === 'Appartement' && (
              <div className="mb-2">
                <div className="d-flex gap-2">
                  <input className="form-control" placeholder="Chambres" value={form.apartment.bedrooms} onChange={e=> setForm({...form, apartment:{...form.apartment, bedrooms: e.target.value}})} />
                  <input className="form-control" placeholder="Salles de bain" value={form.apartment.bathrooms} onChange={e=> setForm({...form, apartment:{...form.apartment, bathrooms: e.target.value}})} />
                </div>
                <div className="mt-2">
                  <input className="form-control" placeholder="Surface (m²)" value={form.apartment.area} onChange={e=> setForm({...form, apartment:{...form.apartment, area: e.target.value}})} />
                </div>
              </div>
            )}

            <div style={{marginTop:12}}>
              <button data-testid="save-btn" className="btn owner-btn-primary" onClick={save}>Enregistrer</button>
              <button className="btn btn-link" onClick={()=> setOpen(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      </div>
    </AgencyLayout>
  );
}
            
