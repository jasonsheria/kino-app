import  { useEffect, useRef, useState } from 'react';
import { fetchOwner, updateOwner } from '../api/owners';
import { fetchReviews, addReview } from '../api/reviews';
import React from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';

export default function OwnerProfile(){
  const ownerId = (()=>{ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id? d.id : 'owner-123'; }catch(e){ return 'owner-123'; } })();
  const [owner, setOwner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating:5, text:'' });
  const [isAdminView, setIsAdminView] = useState(() => !!localStorage.getItem('ndaku_admin_mode'));
  const fileRef = useRef(null);

  useEffect(()=>{ let mounted = true; fetchOwner(ownerId).then(o=> mounted && setOwner(o)); return ()=> mounted = false; },[ownerId]);
  useEffect(()=>{ let m=true; fetchReviews(ownerId).then(r=> m && setReviews(r)); return ()=> m=false; },[ownerId]);

  if(!owner) return (
    <OwnerLayout>
      <div className="p-3">Chargement du profil...</div>
    </OwnerLayout>
  );

  const onPick = (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=> setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const save = async ()=>{
    setSaving(true);
    const patch = { ...owner };
    if(preview) patch.avatar = preview;
    await updateOwner(ownerId, patch);
    const updated = await fetchOwner(ownerId);
    setOwner(updated);
    setPreview('');
    setSaving(false);
  };

  const submitReview = async ()=>{
    const rev = { id: 'r'+Math.random().toString(36).slice(2,9), rating: newReview.rating, text: newReview.text, date: new Date().toISOString() };
    await addReview(ownerId, rev);
    const updated = await fetchReviews(ownerId);
    setReviews(updated);
    // recompute rating and persist
    const avg = (updated.reduce((s,x)=> s + (Number(x.rating)||0),0) / (updated.length||1));
    await updateOwner(ownerId, { rating: Math.round(avg*10)/10 });
    const o = await fetchOwner(ownerId); setOwner(o);
    setNewReview({ rating:5, text:'' });
  };

  const approveCertification = async (approve, note='') =>{
    await updateOwner(ownerId, { certified: approve, certificationNote: note, certRequested: false });
    const o = await fetchOwner(ownerId); setOwner(o);
  };

  return (
    <OwnerLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4>Mon profil professionnel</h4>
            <div className="small text-muted">Gérez vos informations publiques et les paramètres de compte.</div>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
            <div style={{width:220}}>
              <div style={{width:180,height:180,borderRadius:12,overflow:'hidden',boxShadow:'0 8px 20px rgba(2,6,23,0.06)'}}>
                <img src={preview || owner.avatar || '/logo192.png'} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              </div>
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <label className="btn btn-outline-secondary" style={{cursor:'pointer'}}>
                  Changer
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
                </label>
                <button className="btn btn-outline-danger" onClick={()=>{ setPreview('/logo192.png'); fileRef.current.value=''; }}>Supprimer</button>
              </div>

              <div style={{marginTop:18}}>
                <div className="small text-muted">Statut de certification</div>
                <div style={{marginTop:6}}>
                  {owner.certified ? <span className="owner-badge">Certifié</span> : owner.certRequested ? <span className="owner-badge" style={{background:'#fff7ed',color:'#b45309'}}>En attente</span> : <span className="owner-badge" style={{background:'#f8fafc',color:'#64748b'}}>Non certifié</span>}
                </div>
                {owner.certified && owner.certificationNote && <div className="small text-muted mt-2">Note admin: {owner.certificationNote}</div>}
                {!owner.certified && !owner.certRequested && (
                  <div style={{marginTop:8}}>
                    <button className="btn btn-sm owner-btn-primary" onClick={async ()=>{ await updateOwner(ownerId, { certRequested:true }); const u = await fetchOwner(ownerId); setOwner(u); }}>Demander certification</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={owner.name} onChange={e=> setOwner({...owner,name:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-control" value={owner.email} onChange={e=> setOwner({...owner,email:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" value={owner.phone} onChange={e=> setOwner({...owner,phone:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Abonnement</label>
                  <select className="form-select" value={owner.subscription} onChange={e=> setOwner({...owner,subscription:e.target.value})}>
                    <option value="basic">Basique</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div style={{marginTop:14}}>
                <div className="small text-muted">Cotation du profil</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <div style={{fontSize:28,fontWeight:800}}>{owner.rating?.toFixed(1) || '0.0'}</div>
                  <div className="small text-muted">(basé sur les avis)</div>
                </div>
              </div>

              <div style={{marginTop:14}}>
                <label className="form-label">Biographie / Présentation publique</label>
                <textarea className="form-control" rows={5} value={owner.bio||''} onChange={e=> setOwner({...owner,bio:e.target.value})} />
              </div>

              <div style={{marginTop:18}}>
                <h6>Avis & évaluations</h6>
                <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:10}}>
                  {reviews.length===0 && <div className="small text-muted">Aucun avis pour le moment</div>}
                  {reviews.map(r => (
                    <div key={r.id} style={{padding:10,borderRadius:8,border:'1px solid #eef4f7'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontWeight:800}}>Note: {r.rating}/5</div>
                        <div className="small text-muted">{new Date(r.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{marginTop:6}}>{r.text}</div>
                    </div>
                  ))}

                  <div style={{padding:10,borderRadius:8,border:'1px dashed #e6eef3'}}>
                    <div className="small text-muted">Laisser un avis</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
                      <select className="form-select" value={newReview.rating} onChange={e=> setNewReview(n=>({...n,rating: Number(e.target.value)}))} style={{width:120}}>
                        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} étoiles</option>)}
                      </select>
                      <input className="form-control" placeholder="Votre commentaire" value={newReview.text} onChange={e=> setNewReview(n=>({...n,text:e.target.value}))} />
                      <button className="btn btn-outline-primary" onClick={submitReview}>Envoyer</button>
                    </div>
                  </div>
                </div>
              </div>

              {isAdminView && (
                <div style={{marginTop:18}}>
                  <h6>Administration: certification</h6>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <button className="btn btn-success" onClick={()=> approveCertification(true,'Approuvé par admin')}>Approuver</button>
                    <button className="btn btn-outline-danger" onClick={()=> approveCertification(false,'Rejeté par admin')}>Rejeter</button>
                    <button className="btn btn-sm btn-secondary" onClick={()=> { localStorage.removeItem('ndaku_admin_mode'); setIsAdminView(false); }}>Quitter mode admin</button>
                  </div>
                </div>
              )}

              <div style={{marginTop:18,display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button className="btn btn-outline-secondary" onClick={async ()=>{ const u = await fetchOwner(ownerId); setOwner(u); setPreview(''); }}>Annuler</button>
                <button className="btn owner-btn-primary" onClick={save} disabled={saving}>{saving? 'Sauvegarde...' : 'Sauvegarder les modifications'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}


