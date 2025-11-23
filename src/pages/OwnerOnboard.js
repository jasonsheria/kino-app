import React, { useState, useEffect } from 'react';
import '../styles/owner.css';
import '../styles/owner-onboard-modern.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCheckCircle, FaExclamationCircle, FaBuilding, FaCar, FaTree, FaShoppingBag, FaMusic } from 'react-icons/fa';

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

  const propertyTypes = [
    { icon: <FaBuilding />, label: 'Appartement' },
    { icon: <FaCar />, label: 'Voiture' },
    { icon: <FaTree />, label: 'Terrain' },
    { icon: <FaMusic />, label: 'Salle de fête' },
    { icon: <FaShoppingBag />, label: 'Boutique' }
  ];

  return (
    <div className="owner-onboard-container">
      {/* Header Section */}
      <div className="onboard-header mt-5">
        <h1>Devenir propriétaire partenaire</h1>
        <p className="subtitle">
          Sélectionnez l'option la plus adaptée à votre situation pour commencer le processus — simple, sécurisé et rapide.
        </p>
        <div className="badge-row">
          <div className="badge-item">✓ Vérification rapide</div>
          <div className="badge-item">✓ Documentation simple</div>
          <div className="badge-item">✓ Activation immédiate</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="onboard-card" style={{ maxWidth: '100%', margin: '0 auto 3rem', width: '100%', boxSizing: 'border-box' }}>
        <div className="onboard-card-header">
          <h2>Mon Compte</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={() => navigate('/')}
          >
            ← Retour
          </button>
        </div>

        <div className="onboard-card-body">
          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Vérification de votre compte...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="status-alert warning" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <FaExclamationCircle style={{ fontSize: '1.5rem', marginTop: '4px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Erreur</h4>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            </div>
          )}

          {/* Existing Account States */}
          {!loading && !error && ownerAccount?.hasAccount && (
            <>
              {ownerAccount.owner.isActive ? (
                <div className="status-alert success">
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Compte propriétaire existant</h4>
                    <p style={{ margin: '0 0 1.5rem 0' }}>Votre compte est actif et vous pouvez y accéder immédiatement pour gérer vos annonces et suivre vos réservations.</p>
                    <button 
                      className="status-btn"
                      onClick={() => navigate('/owner/dashboard')}
                    >
                      Accéder au dashboard <FaArrowRight style={{ marginLeft: '8px' }} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="status-alert warning" style={{ display: 'flex', gap: '1rem', alignItems: 'center', textAlign : 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Activation requise</h4>
                    <p style={{ margin: '0 0 1.5rem 0' }}>Votre compte propriétaire a été créé avec succès. Pour commencer à publier vos annonces, veuillez choisir un abonnement qui correspond à vos besoins.</p>
                    <button 
                      className="status-btn"
                      onClick={() => navigate(`/owner/subscribe?id=${ownerAccount.owner._id}&type=owner`)}
                    >
                      Choisir un abonnement <FaArrowRight style={{ marginLeft: '8px' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* New Account - Doors Wrapper */}
          {!loading && !error && !ownerAccount?.hasAccount && (
            <>
              <div className="owner-doors-wrapper">
                <div 
                  className="owner-door" 
                  role="button" 
                  tabIndex={0} 
                  onClick={() => navigate('/owner/request')} 
                  onKeyDown={(e) => { if(e.key === 'Enter') navigate('/owner/request'); }}
                >
                  <div className="door-panel">
                    <div className="door-content">
                      <div style={{ fontSize: '2.5rem', color: '#00cdf2', marginBottom: '0.5rem' }}>
                        📝
                      </div>
                      <h4>Devenir Administrateur</h4>
                      <button className="door-cta">
                        Commencer <FaArrowRight style={{ marginLeft: '8px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Sections */}
              <div className="info-section">
                {/* Benefits */}
                <div className="info-box">
                  <h5>✨ Pourquoi devenir partenaire ?</h5>
                  <p>Publiez plusieurs biens, suivez les performances, gérez les réservations et accédez à des outils marketing dédiés pour maximiser vos revenus.</p>
                  <ul>
                    <li>Publication multi-biens illimitée</li>
                    <li>Statistiques & rapports détaillés</li>
                    <li>Support prioritaire pour vos annonces</li>
                    <li>Portefeuille (wallet) intégré</li>
                  </ul>
                </div>

                {/* Supported Properties */}
                <div className="info-box">
                  <h5>🏠 Types de biens pris en charge</h5>
                  <p>Nous acceptons une large gamme de propriétés pour vous offrir les meilleures opportunités de revenus.</p>
                  <div className="badge-list">
                    {propertyTypes.map((type, idx) => (
                      <div key={idx} className="badge-item-type">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="note-box">
                    <small>💡 <strong>Processus guidé:</strong> Vérification documentaire et activation rapide — tout est expliqué après votre demande.</small>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
