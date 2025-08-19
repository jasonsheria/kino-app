import React, { useEffect, useState } from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { fetchAgency, updateAgency } from '../api/agencies';

export default function AgencySecurity(){
  const agencyId = (()=>{ try{ const s = JSON.parse(localStorage.getItem('ndaku_agency_session')||'null'); return s && s.id ? s.id : null; }catch(e){ return null; } })();
  const [agency, setAgency] = useState(null);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [changing, setChanging] = useState(false);

  useEffect(()=>{
    if(!agencyId) return;
    (async ()=>{
      const a = await fetchAgency(agencyId);
      setAgency(a);
      setTwoFA(!!(a && a.security && a.security.twoFA));
      // load sessions from agency or localStorage
      const sess = (a && a.sessions) || JSON.parse(localStorage.getItem(`agency_sessions_${agencyId}`) || '[]');
      setSessions(sess);
    })();
  },[agencyId]);

  const toggle2FA = async ()=>{
    if(!agencyId) return;
    setChanging(true);
    const next = !twoFA;
    await updateAgency(agencyId, { security: { ...(agency.security||{}), twoFA: next } });
    const a = await fetchAgency(agencyId); setAgency(a); setTwoFA(next); setChanging(false);
  };

  const revokeSession = (id)=>{ if(!window.confirm('Terminer cette session ?')) return; const next = sessions.filter(x=> x.id !== id); setSessions(next); try{ localStorage.setItem(`agency_sessions_${agencyId}`, JSON.stringify(next)); }catch(e){} };

  const changePassword = async (current, next, confirm)=>{
    if(!next || next.length < 6){ window.alert('Le nouveau mot de passe doit contenir au moins 6 caractères'); return; }
    if(next !== confirm){ window.alert('Les mots de passe ne correspondent pas'); return; }
    // mock: just persist hash-less and pretend changed
    await updateAgency(agencyId, { security: { ...(agency.security||{}), passwordChangedAt: new Date().toISOString() } });
    const a = await fetchAgency(agencyId); setAgency(a); window.alert('Mot de passe mis à jour (simulation)');
  };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h4>Sécurité</h4>
            <div className="small text-muted">Gérez le mot de passe, l'authentification à deux facteurs et les sessions actives.</div>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
            <div>
              <h6>Changer le mot de passe</h6>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                <input id="currentPwd" className="form-control" type="password" placeholder="Mot de passe actuel" />
                <input id="newPwd" className="form-control" type="password" placeholder="Nouveau mot de passe" />
                <input id="confirmPwd" className="form-control" type="password" placeholder="Confirmer le nouveau" />
                <div>
                  <button className="btn owner-btn-primary" onClick={()=> changePassword(document.getElementById('currentPwd').value, document.getElementById('newPwd').value, document.getElementById('confirmPwd').value)}>Mettre à jour le mot de passe</button>
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
                {sessions.length===0 && <div className="small text-muted">Aucune session active</div>}
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
    </AgencyLayout>
  );
}
  
