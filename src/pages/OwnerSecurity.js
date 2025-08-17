import React, { useEffect, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import { listSessions, updateOwner } from '../api/owners';

export default function OwnerSecurity(){
  const ownerId = (()=>{ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id? d.id : 'owner-123'; }catch(e){ return 'owner-123'; } })();
  const [sessions, setSessions] = useState([]);
  const [twoFA, setTwoFA] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(()=>{ let m=true; listSessions(ownerId).then(s=> m && setSessions(s)); return ()=> m=false; },[ownerId]);

  const toggle2FA = async ()=>{
    setChanging(true);
    await updateOwner(ownerId, { twoFA: !twoFA });
    setTwoFA(s => !s);
    setChanging(false);
  };

  const revokeSession = (id)=>{ if(!window.confirm('Terminer cette session ?')) return; setSessions(s => s.filter(x=> x.id !== id)); };

  return (
    <OwnerLayout>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h4>Sécurité</h4>
            <div className="small text-muted">Gérez votre mot de passe, 2FA et vos sessions actives.</div>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
            <div>
              <h6>Changer le mot de passe</h6>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                <input className="form-control" type="password" placeholder="Mot de passe actuel" />
                <input className="form-control" type="password" placeholder="Nouveau mot de passe" />
                <input className="form-control" type="password" placeholder="Confirmer le nouveau" />
                <div>
                  <button className="btn owner-btn-primary">Mettre à jour le mot de passe</button>
                </div>
              </div>

              <h6 style={{marginTop:14}}>Authentification à deux facteurs (2FA)</h6>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                <div className="small text-muted">Activer la 2FA (via application d'authentification)</div>
                <button className="btn btn-sm btn-outline-secondary" onClick={toggle2FA} disabled={changing}>{twoFA? 'Désactiver' : 'Activer'}</button>
              </div>
            </div>

            <div>
              <h6>Sessions actives</h6>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                {sessions.map(s=> (
                  <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,borderRadius:8,border:'1px solid #eef4f7'}}>
                    <div>
                      <div style={{fontWeight:800}}>{s.device}</div>
                      <div className="small text-muted">IP: {s.ip} — {s.last}</div>
                    </div>
                    <div>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=> revokeSession(s.id)}>Terminer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
