import React, { useState, useEffect } from 'react';
import '../styles/owner.css';
import { useNavigate } from 'react-router-dom';

export default function OwnerOnboard(){
  const [hasCode, setHasCode] = useState(null);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const [codeError, setCodeError] = useState('');
  const [applicationSummary, setApplicationSummary] = useState(null);

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('owner_application');
      if(raw){
        const arr = JSON.parse(raw);
        if(Array.isArray(arr) && arr.length){ setApplicationSummary(arr[0]); }
        else if(arr && arr.id) setApplicationSummary(arr);
      }
    }catch(e){ console.error(e); }
  }, []);
  const verifyCode = (e)=>{
    e.preventDefault();
    // mock verification - in real app call backend
    if(code && code.trim().length>3){
      // assume valid
      navigate('/owner/dashboard');
    } else {
      setCodeError("Code invalide. Si vous n\'avez pas de code, choisissez 'Faire ma demande de partenariat'.");
    }
  };

  return (
  <div className="container owner-hero">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card owner-card shadow-sm p-4">
            <div className="card-body owner-form">
              <div style={{display:'flex', justifyContent:'flex-end', marginBottom:8}}>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/')}>Quitter</button>
              </div>
              <h2 className="mb-2 text-center">Devenir propriétaire partenaire</h2>
              <p className="text-center text-muted mb-4">Sélectionnez l'option la plus adaptée à votre situation pour commencer le processus — simple, sécurisé et rapide.</p>

              <div className="owner-doors-wrapper mb-4">
                <div className="owner-door" role="button" tabIndex={0} onClick={() => setHasCode(true)} onKeyDown={(e)=>{ if(e.key==='Enter') setHasCode(true); }}>
                  <div className="door-panel left">
                    <div className="door-content">
                      <h4>J'ai un code</h4>
                      <p className="small text-muted">Vous avez reçu un code partenaire ? Ouvrez la porte et accédez directement à votre espace.</p>
                      <div className="door-cta">Entrer</div>
                    </div>
                  </div>
                </div>

                <div className="owner-door" role="button" tabIndex={0} onClick={() => navigate('/owner/request')} onKeyDown={(e)=>{ if(e.key==='Enter') navigate('/owner/request'); }}>
                  <div className="door-panel right">
                    <div className="door-content">
                      <h4>Faire ma demande</h4>
                      <p className="small text-muted">Demandez à devenir partenaire et publiez vos biens en quelques étapes guidées.</p>
                      <div className="door-cta owner-btn-primary">Demander</div>
                    </div>
                  </div>
                </div>
              </div>

              {hasCode === true && (
                <form onSubmit={verifyCode} className="mt-3">
                  <div className="mb-3">
                    <label className="form-label">Entrez votre code propriétaire</label>
                    <input className="form-control" value={code} onChange={e=>setCode(e.target.value)} />
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary">Vérifier</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setHasCode(null)}>Annuler</button>
                  </div>
                </form>
              )}
              {codeError && <div className="mt-2 alert alert-danger small">{codeError}</div>}

              {applicationSummary && (
                <div className="mt-3 alert alert-info">
                  <strong>État de votre demande:</strong> <span className="fw-bold">{applicationSummary.status}</span>
                  <div className="small text-muted">{applicationSummary.message}</div>
                  <div className="mt-1">Code: <code>{applicationSummary.code}</code> • Envoyée le: {new Date(applicationSummary.submittedAt).toLocaleString()}</div>
                </div>
              )}

              <hr />

              <div className="row">
                <div className="col-md-6">
                  <h5>Pourquoi devenir partenaire ?</h5>
                  <p>Publiez plusieurs biens, suivez les performances, gérez les réservations et accédez à des outils marketing dédiés pour maximiser vos revenus.</p>
                  <ul>
                    <li>Publication multi-biens illimitée</li>
                    <li>Statistiques & rapports</li>
                    <li>Support prioritaire pour vos annonces</li>
                    <li>Portefeuille (wallet) intégré</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Types de biens pris en charge</h6>
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    <span className="badge bg-light border">Voiture</span>
                    <span className="badge bg-light border">Terrain</span>
                    <span className="badge bg-light border">Appartement</span>
                    <span className="badge bg-light border">Salle de fête</span>
                    <span className="badge bg-light border">Boutique</span>
                  </div>
                  <div className="mt-3 owner-empty">
                    <small className="text-muted">Processus guidé, vérification documentaire et activation rapide — tout est expliqué après la demande.</small>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
