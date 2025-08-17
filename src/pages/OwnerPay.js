import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../components/owner/OwnerLayout';
import '../styles/owner.css';

export default function OwnerPay(){
	const navigate = useNavigate();
	const [pending, setPending] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(()=>{
		try{
			const raw = localStorage.getItem('owner_pending_payment');
			if(raw) setPending(JSON.parse(raw));
		}catch(e){ console.error(e); }
	},[]);

	const doPay = async ()=>{
		if(!pending) return setMessage('Aucun paiement en attente.');
		setProcessing(true); setMessage('Traitement du paiement...');
		try{
			await new Promise(r=>setTimeout(r, 900));
			// simulate success: attach subscription to owner draft
			try{
				const draftRaw = localStorage.getItem('owner_request_draft') || '{}';
				const draft = draftRaw ? JSON.parse(draftRaw) : {};
				draft.subscription = { id: pending.plan.id, name: pending.plan.name, paidAt: Date.now(), validUntil: Date.now() + 1000*60*60*24*30 };
				localStorage.setItem('owner_request_draft', JSON.stringify(draft));
				// clear pending
				localStorage.removeItem('owner_pending_payment');
			}catch(e){ console.error('persist subscription failed', e); }
			setMessage('Paiement réussi. Votre abonnement est activé (simulation).');
			setProcessing(false);
			// redirect back to request (resume onboarding)
			setTimeout(()=> navigate('/owner/request'), 900);
		}catch(e){ setProcessing(false); setMessage('Erreur lors du paiement. Réessayez.'); }
	};

	if(!pending) return (
		<OwnerLayout>
			<div className="container py-4">
				<div className="card owner-card p-3">
					<div className="card-body">
						<h4>Aucun paiement en attente</h4>
						<p className="small text-muted">Aucun paiement n'a été trouvé pour le moment. Retournez à la page d'abonnement pour en choisir un.</p>
						<div className="d-flex justify-content-end mt-3">
							<button className="btn btn-outline-secondary me-2" onClick={()=>navigate('/owner/subscription')}>Choisir un abonnement</button>
							<button className="btn owner-btn-primary" onClick={()=>navigate('/owner/request')}>Retour à ma demande</button>
						</div>
					</div>
				</div>
			</div>
		</OwnerLayout>
	);

	return (
		<OwnerLayout>
			<div className="container py-4">
				<div className="card owner-card p-3">
					<div className="card-body">
						<h4>Paiement de l'abonnement</h4>
						<p className="small text-muted">Plan: <strong>{pending.plan.name}</strong> • Montant: <strong>${pending.amount}</strong></p>
						<p className="mt-2">Mode de paiement simulation (pas de transaction réelle). Cliquez sur Payer pour simuler un succès.</p>
						{message && <div className="alert alert-info small">{message}</div>}
						<div className="d-flex justify-content-end gap-2 mt-3">
							<button className="btn btn-outline-secondary" onClick={()=>navigate('/owner/subscription')} disabled={processing}>Annuler</button>
							<button className="btn owner-btn-primary" onClick={doPay} disabled={processing}>{processing? 'Traitement...' : 'Payer'}</button>
						</div>
					</div>
				</div>
			</div>
		</OwnerLayout>
	);
}
