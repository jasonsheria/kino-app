import React, { useState } from 'react';
import { loginAgency } from '../api/agencies';
import { useNavigate, Link } from 'react-router-dom';
import { FaBuilding, FaArrowRight, FaGoogle, FaSignInAlt } from 'react-icons/fa';

export default function AgencyLogin(){
  const [email, setEmail] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) =>{
    e?.preventDefault?.();
    setErr(null);
    if(!email) return setErr('Veuillez entrer l\'email de l\'agence');
    setLoading(true);
    const res = await loginAgency({ email });
    setLoading(false);
    if(res.error) setErr('Aucune agence trouvée'); else navigate('/agency/dashboard');
  };

  return (
    <div className="auth-page" style={{paddingTop:40,paddingBottom:40}}>
      <div className="auth-card shadow-sm" style={{maxWidth:960}}>
        <div className="auth-illustration" aria-hidden>
          <img src={require('../img/header.jpg')} alt="illustration" />
          <div className="illustration-caption">
            <h4>Gestion agence</h4>
            <p className="small">Accédez à votre espace agence pour gérer annonces et clients.</p>
          </div>
        </div>

        <div className="auth-form">
          <div className="auth-logo mb-2 text-center">
            <FaBuilding size={36} className="text-success" />
          </div>
          <h3 className="fw-bold mb-1 text-center">Connexion agence</h3>
          <p className="auth-small mb-3 text-center">Entrez l'email enregistré pour ouvrir votre espace.</p>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="agency-email" className="form-label small">Email de l'agence</label>
              <input id="agency-email" type="email" className="form-control" value={email} onChange={e=> setEmail(e.target.value)} placeholder="contact@agence.cd" autoComplete="email" />
            </div>

            {err && <div className="alert alert-danger py-2 mb-3 small">{err}</div>}

            <div className="d-grid mb-2">
              <button className="btn btn-success btn-lg" disabled={loading}>{loading? 'Connexion...' : (<><FaSignInAlt className="me-2" /> Se connecter</>)}</button>
            </div>
          </form>

          <div className="text-center mt-2 small text-muted">Vous n'avez pas d'espace ? <Link to="/agency/onboard">Créer une agence</Link></div>
          <div className="text-center mt-3">
            <Link to="/" className="small">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
