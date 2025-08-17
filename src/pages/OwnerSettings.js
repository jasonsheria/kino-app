import React, { useEffect, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import { fetchOwner, updateOwner, deleteOwner } from '../api/owners';
import { useNavigate } from 'react-router-dom';

export default function OwnerSettings(){
  const ownerId = (()=>{ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id? d.id : 'owner-123'; }catch(e){ return 'owner-123'; } })();
  const [owner, setOwner] = useState(null);
  const [prefs, setPrefs] = useState({ emailNotifs:true, smsNotifs:false, language:'fr' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ let m=true; fetchOwner(ownerId).then(o=> { if(m && o) setOwner(o); }); return ()=> m=false; },[ownerId]);

  useEffect(()=>{ if(owner && owner.prefs) setPrefs(owner.prefs); },[owner]);

  const save = async ()=>{ setSaving(true); await updateOwner(ownerId, { prefs }); const o = await fetchOwner(ownerId); setOwner(o); setSaving(false); };

  const navigate = useNavigate();

  const removeAccount = async ()=>{
    if(!window.confirm('Confirmer la suppression de votre compte et toutes les données associées ? Cette action est irréversible.')) return;
    const ok = await deleteOwner(ownerId);
    if(ok){ alert('Compte supprimé. Vous serez redirigé.'); navigate('/'); }
    else alert('Suppression impossible.');
  };

  return (
    <OwnerLayout>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h4>Paramètres</h4>
            <div className="small text-muted">Préférences du compte, notifications et langue.</div>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
            <div>
              <h6>Notifications</h6>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                <label><input type="checkbox" checked={prefs.emailNotifs} onChange={e=> setPrefs({...prefs,emailNotifs:e.target.checked})} /> Recevoir les notifications par email</label>
                <label><input type="checkbox" checked={prefs.smsNotifs} onChange={e=> setPrefs({...prefs,smsNotifs:e.target.checked})} /> Recevoir les SMS</label>
              </div>

              <h6 style={{marginTop:14}}>Langue</h6>
              <select className="form-select" value={prefs.language} onChange={e=> setPrefs({...prefs,language:e.target.value})} style={{width:180,marginTop:8}}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>

              <div style={{marginTop:18,display:'flex',gap:8}}>
                <button className="btn btn-outline-secondary" onClick={()=> { fetchOwner(ownerId).then(o=> setOwner(o)); }}>Annuler</button>
                <button className="btn owner-btn-primary" onClick={save} disabled={saving}>{saving? 'Sauvegarde...' : 'Sauvegarder'}</button>
              </div>
            </div>

            <div>
              <h6>Supprimer le compte</h6>
              <div className="small text-muted">Supprimer votre compte supprime toutes vos données et ne peut pas être annulé.</div>
              <div style={{marginTop:12}}>
                <button className="btn btn-danger" onClick={removeAccount}>Supprimer mon compte</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
