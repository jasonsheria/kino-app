import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import Modal from '../components/common/Modal';
import { currentAgencySession, getTransactions, addTransaction, fetchAgency } from '../api/agencies';

export default function AgencyWallet(){
  const [txs, setTxs] = React.useState([]);
  const [balance, setBalance] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const agencyId = currentAgencySession()?.id;

  React.useEffect(()=>{ if(!agencyId) return; (async ()=>{ setTxs(await getTransactions(agencyId)); const a = await fetchAgency(agencyId); setBalance(a?.wallet||0); })(); }, [agencyId]);

  const deposit = async ()=>{
    const amt = parseFloat(amount); if(!amt) return;
    await addTransaction(agencyId, { amount: amt, type: 'deposit', date: new Date().toISOString() });
    setTxs(await getTransactions(agencyId)); const a = await fetchAgency(agencyId); setBalance(a?.wallet||0); setOpen(false); setAmount('');
  };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between">
          <h4>Wallet agence</h4>
          <div>
            <strong>Solde: {balance} €</strong>
            <button className="btn owner-btn-primary ml-2" onClick={()=> setOpen(true)}>Ajouter</button>
          </div>
        </div>
        <div className="small text-muted mb-2">Solde, transactions et retrait.</div>
        <div>
          {txs.length===0 && <div className="small text-muted">Aucune transaction</div>}
          {txs.map(t=> (
            <div key={t.id} className="card p-2 mb-2 d-flex justify-content-between align-items-center">
              <div>
                <div><strong>{t.type}</strong> {t.amount} €</div>
                <div className="small text-muted">{t.date}</div>
              </div>
              <div>Balance: {t.balance} €</div>
            </div>
          ))}
        </div>

        <Modal open={open} onClose={()=> setOpen(false)}>
          <div style={{minWidth:320}}>
            <h5>Ajouter fonds</h5>
            <input className="form-control" value={amount} onChange={e=> setAmount(e.target.value)} placeholder="Montant" />
            <div style={{marginTop:12}}>
              <button className="btn owner-btn-primary" onClick={deposit}>Ajouter</button>
              <button className="btn btn-link" onClick={()=> setOpen(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      </div>
    </AgencyLayout>
  );
}
