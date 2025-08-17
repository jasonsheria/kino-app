import React, { useState } from 'react';
import { loginAgency } from '../api/agencies';
import { useNavigate } from 'react-router-dom';

export default function AgencyLogin(){
  const [email, setEmail] = useState('');
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const submit = async ()=>{
    const res = await loginAgency({ email });
    if(res.error) setErr('Aucune agence trouvée'); else navigate('/agency/dashboard');
  };
  return (
    <div style={{maxWidth:640, margin:'0 auto'}}>
      <h3>Connexion agence</h3>
      <div className="card p-3">
        <input className="form-control" placeholder="Email d'agence" value={email} onChange={e=> setEmail(e.target.value)} />
        <div style={{marginTop:12}}>
          <button className="btn owner-btn-primary" onClick={submit}>Se connecter</button>
        </div>
        {err && <div className="small text-danger">{err}</div>}
      </div>
    </div>
  );
}
