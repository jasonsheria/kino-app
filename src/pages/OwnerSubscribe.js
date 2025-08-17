import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/owner.css';

export default function OwnerSubscribe(){
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || null; // e.g. 'dashboard'
  const [currentSub, setCurrentSub] = useState(null);

  useEffect(()=>{
    try{ const raw = localStorage.getItem('owner_subscription'); if(raw) setCurrentSub(JSON.parse(raw)); }catch(e){}
  }, []);

  const plans = [
    { id: 'freemium', title: 'Freemium', price: 0, desc: 'Gratuit, fonctionnalités restreintes (max 2 biens).' },
    { id: 'monthly', title: 'Mensuel', price: 9.99, desc: 'Accès complet à toutes les fonctionnalités.' },
    { id: 'revshare', title: 'Rétro-commission', price: 0, desc: 'Paiement par commission sur ventes, informations privées — achat via agent.' }
  ];

  const choose = (p)=> setSelected(p);

  const continueFlow = ()=>{
    if(!selected) return alert('Veuillez choisir une formule');
    // save subscription selection; monthly requires payment
    // if changing subscription from dashboard, handle redirect differently
    if(from === 'dashboard'){
      if(selected.id === 'monthly'){
        // go to payment flow and indicate we came from dashboard
        navigate('/owner/pay?plan=monthly&from=dashboard');
        return;
      }
      // immediate change for free/revshare when from dashboard
      const entry = { type: selected.id, title: selected.title, chosenAt: Date.now(), paid: false, validUntil: null };
      try{ localStorage.setItem('owner_subscription', JSON.stringify(entry)); }catch(e){}
      // navigate back to dashboard to show updated info
      navigate('/owner/dashboard');
      return;
    }

    // default onboarding flow: store selection and continue
    const entry = { type: selected.id, title: selected.title, chosenAt: Date.now(), validUntil: selected.id === 'monthly' ? null : null };
    localStorage.setItem('owner_subscription', JSON.stringify(entry));
    if(selected.id === 'monthly'){
      // proceed to payment page (will set resume flag after successful payment)
      navigate('/owner/pay?plan=monthly');
    }else{
      // free or revshare: no immediate payment, mark resume so request page auto-submits
      try{ localStorage.setItem('owner_resume_submission', 'true'); }catch(e){}
      navigate('/owner/request');
    }
  };

  return (
    <div className="container py-5 pricing-section">
      <div className="row justify-content-center">
        <div className="col-12 text-center mb-4">
          <h3 className="mb-1">Choisissez une formule</h3>
          <p className="text-muted">Sélectionnez le plan qui correspond le mieux à vos besoins. Vous pouvez le modifier à tout moment.</p>
        </div>

        <div className="col-12 mb-4">
          {currentSub && (
            <div className="pricing-current">
              <div>
                <div className="small text-muted">Votre abonnement actuel</div>
                <div className="fw-bold">{currentSub.title || currentSub.type}</div>
                <div className="small text-muted">{currentSub.paid ? `Valide jusqu'au ${new Date(currentSub.validUntil).toLocaleDateString()}` : (currentSub.validUntil ? `Valide jusqu'au ${new Date(currentSub.validUntil).toLocaleDateString()}` : 'Aucune date de validité')}</div>
              </div>
              <div>
                <span className="owner-badge">{currentSub.type}</span>
              </div>
            </div>
          )}
        </div>

        <div className="col-12">
          <div className="pricing-grid">
            {/* Freemium */}
            <div className={`pricing-card ${selected && selected.id===plans[0].id ? 'selected':''}`} onClick={() => choose(plans[0])} role="button">
              <div className="pricing-illustration" />
              <div className="pricing-title small">Personnel</div>
              <div className="pricing-name">Gratuit</div>
              <div className="pricing-desc">{plans[0].desc}</div>
              <ul className="pricing-bullets">
                <li>Jusqu'à 10 participants</li>
                <li>Événements illimités</li>
                <li>Organisateurs illimités</li>
              </ul>
              <div className="pricing-cta-wrap"><button className="pricing-cta" onClick={continueFlow}>Commencer gratuitement</button></div>
            </div>

            {/* Premium featured */}
            <div className={`pricing-card pricing-featured ${selected && selected.id===plans[1].id ? 'selected':''}`} onClick={() => choose(plans[1])} role="button">
              <div className="pricing-illustration featured" />
              <div className="pricing-title">Premium</div>
              <div className="pricing-price">{plans[1].price ? `$${plans[1].price}` : ''}</div>
              <div className="small text-muted">par participant, par mois</div>
              <div className="pricing-desc">Accès complet à toutes les fonctionnalités.</div>
              <ul className="pricing-bullets light">
                <li>Tout dans Gratuit</li>
                <li>Jusqu'à 200 participants</li>
                <li>Export des données</li>
              </ul>
              <div className="pricing-cta-wrap"><button className="pricing-cta featured-cta" onClick={continueFlow}>Commencer Premium</button></div>
              <div className="small text-muted mt-2">Si vous ne pouvez pas payer, <u style={{cursor:'pointer'}}>contactez-nous</u>.</div>
            </div>

            {/* Enterprise / Revshare */}
            <div className={`pricing-card ${selected && selected.id===plans[2].id ? 'selected':''}`} onClick={() => choose(plans[2])} role="button">
              <div className="pricing-illustration alt" />
              <div className="pricing-title small">Entreprise</div>
              <div className="pricing-name">Contactez-nous</div>
              <div className="pricing-desc">{plans[2].desc}</div>
              <ul className="pricing-bullets">
                <li>SSO (SAML 2.0)</li>
                <li>Support personnalisé</li>
              </ul>
              <div className="pricing-cta-wrap"><button className="pricing-cta" onClick={continueFlow}>Contactez-nous</button></div>
            </div>
          </div>

          <div className="d-flex justify-content-between" style={{maxWidth:980,margin:'18px auto 0'}}>
            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Retour</button>
            <button className="btn owner-btn-primary" onClick={continueFlow}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
