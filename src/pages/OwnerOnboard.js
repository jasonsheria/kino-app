import React, { useState, useEffect } from 'react';
import '../styles/owner.css';
import { useNavigate } from 'react-router-dom';

export default function OwnerOnboard(){
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerAccount, setOwnerAccount] = useState(null);

  useEffect(() => {
    const checkOwnerAccount = async () => {
      try {
        const token = localStorage.getItem('ndaku_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/check-account`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la vérification du compte');
        }

        const data = await response.json();
        setOwnerAccount(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkOwnerAccount();
  }, [navigate]);

  return (
  <div className="container owner-hero">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card owner-card shadow-sm p-2">
            <div className="card-body owner-form">
              <div style={{display:'flex', justifyContent:'flex-end', marginBottom:8}}>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/')}>Quitter</button>
              </div>
              <h2 className="mb-2 text-center">Devenir propriétaire partenaire</h2>
              <p className="text-center text-muted mb-4">Sélectionnez l'option la plus adaptée à votre situation pour commencer le processus — simple, sécurisé et rapide.</p>

              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-2">Vérification de votre compte...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : ownerAccount?.hasAccount ? (
                <div className="text-center p-4">
                  {ownerAccount.owner.isActive ? (
                    <>
                      <div className="alert alert-success mb-4" role="alert">
                        <h4 className="alert-heading">Compte propriétaire existant!</h4>
                        <p>Votre compte est actif et vous pouvez y accéder.</p>
                      </div>
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/owner/dashboard')}
                      >
                        Accéder à mon espace propriétaire
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="alert alert-warning mb-4" role="alert">
                        <h4 className="alert-heading">Activation requise!</h4>
                        <p>Votre compte propriétaire a été créé mais nécessite une activation via un abonnement.</p>
                      </div>
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate(`/owner/subscribe?id=${ownerAccount.owner._id}&type=owner`)}
                      >
                        Choisir un abonnement pour activer mon compte
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="owner-doors-wrapper mb-4">
                  <div className="owner-door" role="button" tabIndex={0} onClick={() => navigate('/owner/request')} onKeyDown={(e)=>{ if(e.key==='Enter') navigate('/owner/request'); }}>
                    <div className="door-panel right">
                      <div className="door-content">
                        <h4>Faire ma demande</h4>
                        <p className="small text-muted">Demandez à devenir partenaire et publiez vos biens en quelques étapes guidées.</p>
                        <div className="door-cta owner-btn-primary">Commencer</div>
                      </div>
                    </div>
                  </div>
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
