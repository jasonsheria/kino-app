import React, { useState } from 'react';
import { registerAgency } from '../api/agencies';
import { useNavigate } from 'react-router-dom';

export default function AgencyOnboard(){
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const submit = async ()=>{
    const res = await registerAgency(form);
    if(res.error){ setStatus('exists'); } else { setStatus('ok'); navigate('/agency/login'); }
  };
  return (
    <div style={{maxWidth:700, margin:'0 auto'}}>
      <h3>Inscription agence</h3>
      <div className="card p-3">
        <input className="form-control" placeholder="Nom de l'agence" value={form.name} onChange={e=> setForm({...form,name:e.target.value})} />
        <input className="form-control" placeholder="Email" value={form.email} onChange={e=> setForm({...form,email:e.target.value})} style={{marginTop:8}} />
        <input className="form-control" placeholder="Téléphone" value={form.phone} onChange={e=> setForm({...form,phone:e.target.value})} style={{marginTop:8}} />
        <div style={{marginTop:12}}>
          <button className="btn owner-btn-primary" onClick={submit}>Créer mon espace agence (gratuit)</button>
        </div>
        {status==='exists' && <div className="small text-danger">Agence existante — connectez-vous.</div>}
      </div>
    </div>
  );
}
