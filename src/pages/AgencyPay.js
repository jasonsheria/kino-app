import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgencyLayout from '../components/agency/AgencyLayout';

export default function AgencyPay(){
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(()=>{
    try{ const raw = localStorage.getItem('agency_pending_payment'); if(raw) setPending(JSON.parse(raw)); }catch(e){ console.error(e); }
  },[]);

  const doPay = async ()=>{
    if(!pending) return setMessage('Aucun paiement en attente.');
    setProcessing(true); setMessage('Traitement du paiement...');
    try{
      await new Promise(r=>setTimeout(r, 900));
      // on success: persist ad draft as active ad
      try{
        const storeRaw = localStorage.getItem('ndaku_agencies') || '{}';
        const store = storeRaw ? JSON.parse(storeRaw) : {};
        const agency = store[pending.agencyId] || {};
        agency.ads = agency.ads || [];
        const draft = pending.adDraft || {};
        const ad = { id: 'ad-'+Math.random().toString(36).slice(2,9), ...draft, active:true, paidAt: Date.now() };
        agency.ads.push(ad);
        store[pending.agencyId] = agency;
        localStorage.setItem('ndaku_agencies', JSON.stringify(store));
        // add transaction record
        try{
          const txs = agency.transactions || [];
          const tx = { id: 'tx-'+Date.now().toString(36), amount: -pending.amount, ts: Date.now(), note: 'Lancement pub' };
          agency.transactions = [tx, ...(agency.transactions||[])];
          agency.wallet = (agency.wallet||0) - pending.amount;
          store[pending.agencyId] = agency;
          localStorage.setItem('ndaku_agencies', JSON.stringify(store));
        }catch(e){ console.error('tx fail', e); }
        // clear pending
        localStorage.removeItem('agency_pending_payment');
      }catch(e){ console.error('persist ad failed', e); }
      setMessage('Paiement réussi. Votre publicité est lancée (simulation).');
      setProcessing(false);
      window.dispatchEvent(new Event('ndaku-agency-change'));
      setTimeout(()=> navigate('/agency/ads'), 900);
    }catch(e){ setProcessing(false); setMessage('Erreur lors du paiement. Réessayez.'); }
  };

  if(!pending) return (
    <AgencyLayout>
      <div className="container py-4">
        <div className="card owner-card p-3">
          <div className="card-body">
            <h4>Aucun paiement en attente</h4>
            <p className="small text-muted">Aucun paiement n'a été trouvé pour le moment.</p>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-outline-secondary me-2" onClick={()=>navigate('/agency/ads')}>Voir publicités</button>
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );

  return (
    <AgencyLayout>
      <div className="container py-4">
        <div className="card owner-card p-3">
          <div className="card-body">
            <h4>Paiement promotion</h4>
            <p className="small text-muted">Montant: <strong>{pending.amount} €</strong></p>
            <p className="mt-2">Mode de paiement simulation (pas de transaction réelle). Cliquez sur Payer pour simuler un succès.</p>
            {message && <div className="alert alert-info small">{message}</div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={()=>navigate('/agency/ads')} disabled={processing}>Annuler</button>
              <button className="btn owner-btn-primary" onClick={doPay} disabled={processing}>{processing? 'Traitement...' : 'Payer'}</button>
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
