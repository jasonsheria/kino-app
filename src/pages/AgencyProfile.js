import React, { useEffect, useRef, useState } from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { fetchAgency, updateAgency } from '../api/agencies';

export default function AgencyProfile(){
  const agencyId = (()=>{ try{ const s = JSON.parse(localStorage.getItem('ndaku_agency_session')||'null'); return s && s.id ? s.id : null; }catch(e){ return null; } })();
  const [agency, setAgency] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  useEffect(()=>{ let mounted = true; if(!agencyId) return; fetchAgency(agencyId).then(a=> mounted && setAgency(a)); return ()=> mounted = false; },[agencyId]);

  if(!agency) return (
    <AgencyLayout>
      <div className="p-3">Chargement du profil agence...</div>
    </AgencyLayout>
  );

  const onPick = (e)=>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=> setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const save = async ()=>{
    setSaving(true);
    const patch = { ...agency };
    if(preview) patch.avatar = preview;
    await updateAgency(agencyId, patch);
    const updated = await fetchAgency(agencyId);
    setAgency(updated);
    setPreview('');
    setSaving(false);
  };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4>Profil agence</h4>
            <div className="small text-muted">Gérez les informations publiques et les paramètres de votre agence.</div>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
            <div style={{width:220}}>
                <div style={{width:180,height:180,borderRadius:12,overflow:'hidden',boxShadow:'0 8px 20px rgba(2,6,23,0.06)'}}>
                <img src={preview || agency.avatar || '/img/logo.svg'} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              </div>
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <label className="btn btn-outline-secondary" style={{cursor:'pointer'}}>
                  Changer
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
                </label>
                <button className="btn btn-outline-danger" onClick={()=>{ setPreview('/img/logo.svg'); fileRef.current.value=''; }}>Supprimer</button>
              </div>
            </div>

            <div style={{flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={agency.name || ''} onChange={e=> setAgency({...agency,name:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-control" value={agency.email || ''} onChange={e=> setAgency({...agency,email:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" value={agency.phone || ''} onChange={e=> setAgency({...agency,phone:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Adresse</label>
                  <input className="form-control" value={agency.address || ''} onChange={e=> setAgency({...agency,address:e.target.value})} />
                </div>
              </div>

              <div style={{marginTop:14}}>
                <label className="form-label">Description publique</label>
                <textarea className="form-control" rows={5} value={agency.bio||''} onChange={e=> setAgency({...agency,bio:e.target.value})} />
              </div>

              <div style={{marginTop:18,display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button className="btn btn-outline-secondary" onClick={async ()=>{ const u = await fetchAgency(agencyId); setAgency(u); setPreview(''); }}>Annuler</button>
                <button className="btn owner-btn-primary" onClick={save} disabled={saving}>{saving? 'Sauvegarde...' : 'Sauvegarder les modifications'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
