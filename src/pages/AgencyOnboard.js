import React, { useState } from 'react';
import { registerAgency, updateAgency } from '../api/agencies';
import { useNavigate, Link } from 'react-router-dom';
import { FaBuilding, FaUserTie, FaArrowRight, FaCamera, FaCheckCircle } from 'react-icons/fa';

export default function AgencyOnboard() {
  // steps: 0 = presentation, 1 = form, 2 = choose plan, 3 = success
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phone: '' });
  const [avatar, setAvatar] = useState(null); // data URL preview
  const [agency, setAgency] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const plans = [
    { id: 'freemium', title: 'Freemium', price: 0, desc: 'Gratuit, visibilité de base.' },
    { id: 'monthly', title: 'Mensuel', price: 9.99, desc: 'Visibilité prioritaire et outils avancés.' },
    { id: 'revshare', title: 'Rétro-commission', price: 0, desc: 'Paiement à la performance, contactez-nous.' }
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
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f4fbf9 60%, #ffffff 100%)' }}>
      <div className="card shadow-lg border-0 p-4" style={{ maxWidth: 980, width: '100%', borderRadius: 16 }}>
        <div className="row g-0">
          <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center" style={{ padding: 28 }}>
            <div className="text-center">
              <FaBuilding size={56} className="text-success mb-3" />
              <h2 className="fw-bold mb-2" style={{ color: '#138f6b' }}>Espace Agence Ndaku</h2>
              <p className="text-secondary">Gérez vos biens, publiez des offres, suivez les leads et boostez votre visibilité locale.</p>
              <ul className="list-unstyled text-muted" style={{ lineHeight: 1.7, textAlign: 'left', maxWidth: 320, margin: '18px auto 0' }}>
                <li>• Publier et gérer des annonces</li>
                <li>• Recevoir et organiser des demandes</li>
                <li>• Statistiques et rapport de performance</li>
                <li>• Options d'abonnement adaptées aux agences</li>
              </ul>
              <div className="mt-3"><Link to="/" className="small">Retour à l'accueil</Link></div>
            </div>
          </div>

          <div className="col-md-6 col-12" style={{ padding: 24 }}>
            {step === 0 && (
              <div>
                <div className="text-center mb-4">
                  <h4 className="fw-bold">Pourquoi créer une agence sur Ndaku ?</h4>
                  <p className="text-muted">Un espace dédié pour vos agents et vos produits marketing. Créez votre agence en quelques minutes.</p>
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-success btn-lg fw-bold" onClick={() => setStep(1)}><FaArrowRight className="me-2" />Créer une agence</button>
                  <Link to="/agency/login" className="btn btn-outline-secondary btn-lg text-start">Se connecter à mon agence</Link>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h5 className="fw-bold mb-3">Informations de l'agence</h5>
                <div className="mb-3">
                  <input className="form-control mb-2" placeholder="Nom de l'agence *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="form-control mb-2" placeholder="Email professionnel *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input className="form-control mb-2" placeholder="Téléphone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <input className="form-control mb-2" placeholder="Adresse (ville, quartier)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  <input className="form-control mb-2" placeholder="Mot de passe (pour l'accès)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Logo / photo (optionnel)</label>
                  <div className="d-flex align-items-center gap-2">
                    <label className="btn btn-outline-secondary btn-sm mb-0">
                      <FaCamera className="me-2" /> Choisir une image
                      <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
                    </label>
                    {avatar && <img src={avatar} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />}
                  </div>
                </div>

                {status === 'exists' && <div className="small text-danger mb-2">Une agence existe déjà avec ce nom ou cet email — essayez de vous connecter.</div>}
                {status && typeof status === 'string' && status !== 'exists' && <div className="small text-muted mb-2">{status}</div>}

                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-grow-1" onClick={createAgency} disabled={loading}>{loading ? 'Création...' : 'Suivant: Choisir une formule'}</button>
                  <button className="btn btn-link text-secondary" onClick={() => setStep(0)}>Annuler</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h5 className="fw-bold mb-3">Choisissez une formule</h5>
                <div className="mb-3">
                  <div className="row">
                    {plans.map(p => (
                      <div className="col-12 mb-3" key={p.id}>
                        <div className={`card ${selectedPlan && selectedPlan.id===p.id ? 'border-success':''}`} style={{ padding: 12 }} onClick={() => setSelectedPlan(p)}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-semibold">{p.title} {p.price ? `- $${p.price}/mois` : ''}</div>
                              <div className="text-muted small">{p.desc}</div>
                            </div>
                            <div>
                              {selectedPlan && selectedPlan.id===p.id ? <FaCheckCircle className="text-success" /> : <span className="small text-muted">Sélectionner</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {status === 'failed' && <div className="small text-danger mb-2">Échec lors de la création. Réessayez.</div>}

                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>Retour</button>
                  <button className="btn btn-success" onClick={confirmPlan} disabled={loading}>{loading ? 'Enregistrement...' : 'Confirmer et terminer'}</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-4">
                <FaCheckCircle size={48} className="text-success mb-3" />
                <h5 className="fw-bold">Votre agence est prête</h5>
                <p className="text-muted">Vous serez redirigé vers votre tableau de bord.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
