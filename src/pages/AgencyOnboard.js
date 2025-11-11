import React, { useState } from 'react';
import { registerAgency, updateAgency } from '../api/agencies';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaBuilding, FaUserTie, FaArrowRight, FaCamera, FaCheckCircle, FaBars, FaTimes,
  FaChartLine, FaClipboard, FaClock, FaGlobe, FaHeadset, FaShieldAlt, FaLock
} from 'react-icons/fa';
import './AgencyOnboard.css';

export default function AgencyOnboard() {
  // steps: 0 = presentation, 1 = form, 2 = choose plan, 3 = success
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phone: '' });
  const [avatar, setAvatar] = useState(null); // data URL preview
  const [agency, setAgency] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const plans = [
    { id: 'freemium', title: 'Freemium', price: 0, desc: 'Gratuit, visibilité de base.', features: ['Jusqu\'à 10 annonces', 'Support par email', 'Analytics basique'] },
    { id: 'monthly', title: 'Mensuel', price: 9.99, desc: 'Visibilité prioritaire et outils avancés.', features: ['Annonces illimitées', 'Support prioritaire', 'Analytics avancées', 'Badge professionnel'] },
    { id: 'revshare', title: 'Rétro-commission', price: 0, desc: 'Paiement à la performance, contactez-nous.', features: ['Annonces illimitées', 'Support dédié', 'Analytics complet', 'Assistance commerciale'] }
  ];

  function onFile(e){
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=> setAvatar(reader.result);
    reader.readAsDataURL(f);
  }

  async function createAgency(){
    setStatus(null);
    if(!form.name || !form.email) return setStatus('Veuillez saisir le nom et l\'email de l\'agence');
    setLoading(true);
    try{
      const res = await registerAgency({ name: form.name, email: form.email, phone: form.phone });
      setLoading(false);
      if(res.error){
        setStatus('exists');
        return;
      }
      setAgency(res.agency);
      // proceed to plan selection
      setStep(2);
    }catch(err){
      setLoading(false);
      setStatus('error');
    }
  }

  async function confirmPlan(){
    if(!agency) return setStatus('Aucune agence trouvée');
    if(!selectedPlan) return setStatus('Veuillez choisir une formule');
    setLoading(true);
    try{
      // attach extra details and selected subscription
      const patch = { address: form.address || '', phone: form.phone || '', subscription: selectedPlan.id, avatar: avatar || '/logo192.png' };
      await updateAgency(agency.id, patch);
      // create session
      try{ localStorage.setItem('ndaku_agency_session', JSON.stringify({ id: agency.id, email: agency.email })); }catch(e){}
      setLoading(false);
      setStep(3);
      // short delay then go to dashboard
      setTimeout(()=> navigate('/agency/dashboard'), 900);
    }catch(e){
      setLoading(false);
      setStatus('failed');
    }
  }

  return (
    <div className="agency-onboard-container">
      {/* Titre pRINCIPALE */}
      <header className="agency-onboard-header">
        <div className="header-content">
          <div className="header-logo">
            <FaBuilding className="header-icon" />
            <span className="header-title">Ndaku - Espace Agence</span>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">Accueil</Link>
            <Link to="/properties" className="nav-link">Annonces</Link>
            <Link to="/agency/login" className="nav-link">Connexion Agence</Link>
          </nav>
        </div>

      </header>
     

      {/* Main Content */}
      <main className="agency-onboard-main">
        <div className="onboard-content-wrapper">
          {step === 0 && (
            <div className="onboard-step-intro">
              <div className="intro-header">
                <div className="intro-icon">
                  <FaBuilding />
                </div>
                <h1 className="intro-title">Espace Agence Ndaku</h1>
                <p className="intro-subtitle">Gérez vos biens, publiez des offres, suivez les leads et boostez votre visibilité locale</p>
              </div>

              <div className="intro-features">
                <div className="intro-feature">
                  <div className="feature-icon-box">
                    <FaClipboard />
                  </div>
                  <h3>Publier & Gérer</h3>
                  <p>Publiez et gérez facilement vos annonces immobilières</p>
                </div>
                <div className="intro-feature">
                  <div className="feature-icon-box">
                    <FaClock />
                  </div>
                  <h3>Suivi Temps Réel</h3>
                  <p>Recevez et organisez les demandes de vos clients</p>
                </div>
                <div className="intro-feature">
                  <div className="feature-icon-box">
                    <FaChartLine />
                  </div>
                  <h3>Analytics Pro</h3>
                  <p>Statistiques et rapport de performance détaillés</p>
                </div>
                <div className="intro-feature">
                  <div className="feature-icon-box">
                    <FaGlobe />
                  </div>
                  <h3>Visibilité Max</h3>
                  <p>Options d'abonnement adaptées à votre agence</p>
                </div>
              </div>

              <div className="intro-actions">
                <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
                  <FaArrowRight className="me-2" />
                  Créer une agence
                </button>
                <Link to="/agency/login" className="btn btn-secondary btn-lg">
                  Se connecter
                </Link>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboard-step-form">
              <div className="step-header">
                <h2>Informations de l'agence</h2>
                <p>Remplissez vos informations pour créer votre agence</p>
              </div>

              <form className="agency-form">
                <div className="form-group">
                  <label>Nom de l'agence *</label>
                  <input 
                    type="text"
                    placeholder="Votre nom d'agence"
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email professionnel *</label>
                  <input 
                    type="email"
                    placeholder="votre@email.com"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input 
                      type="tel"
                      placeholder="+243 XXX XXX XXX"
                      value={form.phone} 
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input 
                      type="password"
                      placeholder="Créez un mot de passe"
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Adresse (ville, quartier)</label>
                  <input 
                    type="text"
                    placeholder="Kinshasa, Gombe"
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Logo / Photo de profil</label>
                  <div className="file-upload-box">
                    <label className="file-upload-label">
                      <FaCamera className="upload-icon" />
                      <span>Cliquez pour télécharger</span>
                      <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
                    </label>
                    {avatar && (
                      <div className="avatar-preview">
                        <img src={avatar} alt="preview" />
                        <button type="button" className="btn-remove" onClick={() => setAvatar(null)}>
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {status === 'exists' && (
                  <div className="alert alert-error">
                    Une agence existe déjà avec ce nom ou cet email — essayez de vous connecter.
                  </div>
                )}
                {status && typeof status === 'string' && status !== 'exists' && (
                  <div className="alert alert-info">{status}</div>
                )}

                <div className="form-actions">
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setStep(0)}
                    disabled={loading}
                  >
                    Retour
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={createAgency}
                    disabled={loading}
                  >
                    {loading ? 'Création...' : 'Suivant: Choisir une formule'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="onboard-step-plans">
              <div className="step-header">
                <h2>Choisissez votre formule</h2>
                <p>Sélectionnez le plan qui convient le mieux à votre agence</p>
              </div>

              <div className="plans-grid">
                {plans.map(p => (
                  <div 
                    key={p.id}
                    className={`plan-card ${selectedPlan && selectedPlan.id === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(p)}
                  >
                    <div className="plan-header">
                      <h3 className="plan-title">{p.title}</h3>
                      <div className="plan-price">
                        {p.price > 0 ? (
                          <>
                            <span className="currency">$</span>
                            <span className="amount">{p.price}</span>
                            <span className="period">/mois</span>
                          </>
                        ) : (
                          <span className="free">Gratuit</span>
                        )}
                      </div>
                    </div>
                    <p className="plan-description">{p.desc}</p>
                    <div className="plan-features">
                      {p.features && p.features.map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <span className="check">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="plan-select">
                      {selectedPlan && selectedPlan.id === p.id ? (
                        <div className="selected-badge">
                          <FaCheckCircle /> Sélectionné
                        </div>
                      ) : (
                        <span>Cliquez pour sélectionner</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {status === 'failed' && (
                <div className="alert alert-error">
                  Échec lors de la création. Réessayez.
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Retour
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={confirmPlan}
                  disabled={loading || !selectedPlan}
                >
                  {loading ? 'Enregistrement...' : 'Confirmer et terminer'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboard-step-success">
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <h2>Votre agence est prête!</h2>
              <p>Félicitations! Votre agence est maintenant active.</p>
              <p className="redirect-text">Vous serez redirigé vers votre tableau de bord...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
