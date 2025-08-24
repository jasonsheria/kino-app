import React, { useEffect, useState, useMemo } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import Modal from '../components/common/Modal';
import '../styles/owner.css';
import { Button, useMediaQuery, useTheme } from '@mui/material';
// Chart.js
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function OwnerWallet(){
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  // determine current owner id (from localStorage draft or fallback to sample owner)
  const ownerDraft = (()=>{ try{ return JSON.parse(localStorage.getItem('owner_request_draft')||'null'); }catch(e){return null;} })();
  const owner = ownerDraft && ownerDraft.id ? ownerDraft : { id:1, name:'Propriétaire Demo' };
  const ownerId = owner.id;

  const [balance, setBalance] = useState(27238.00);
  const [spendings, setSpendings] = useState([1200, 7450, 3200, 4800, 3600, 4100, 5200]);
  const [transactions, setTransactions] = useState([
    { id:1, who: 'Marry Jador', note: 'Paiement reçu', amount: 450.00, sign:'+' },
    { id:2, who: 'Arcadiy Seberyak', note: 'Conversion', amount: 50.00, sign:'-' },
    { id:3, who: 'Anna Merly', note: 'Paiement', amount: 120.50, sign:'+' },
  ]);

  // persisted cards per owner
  const [cards, setCards] = useState([]);
  useEffect(()=>{ try{ const s = JSON.parse(localStorage.getItem(`owner_cards_${ownerId}`)||'[]'); setCards(Array.isArray(s)?s:[]); }catch(e){} },[ownerId]);
  const persistCards = (next)=>{ try{ localStorage.setItem(`owner_cards_${ownerId}`, JSON.stringify(next)); }catch(e){} setCards(next); };

  // modals and forms
  const [openAdd, setOpenAdd] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openCardModal, setOpenCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({ id:null, name:'', number:'', exp:'', cvv:'' });

  // simulate stripe-like payment (mock)
  const simulatePayment = async ({ amount, type='add' })=>{
    await new Promise(r=>setTimeout(r, 800));
    if(type==='add'){
      setBalance(b => Number((b + Number(amount)).toFixed(2)));
      setTransactions(t => [{ id: Date.now(), who: 'Ajout', note:'Ajout de fonds', amount: Number(amount), sign:'+' }, ...t]);
    } else {
      setBalance(b => Number((b - Number(amount)).toFixed(2)));
      setTransactions(t => [{ id: Date.now(), who: 'Retrait', note:'Retrait', amount: Number(amount), sign:'-' }, ...t]);
    }
  };
  const addFunds = async (amount)=>{ await simulatePayment({ amount, type:'add' }); setOpenAdd(false); };
  const withdrawFunds = async (amount)=>{ await simulatePayment({ amount, type:'withdraw' }); setOpenWithdraw(false); };

  const saveCard = (form)=>{ const next = form.id ? cards.map(c=> c.id===form.id ? form : c) : [{ ...form, id: Date.now() }, ...cards]; persistCards(next); setOpenCardModal(false); };
  const removeCard = (id)=>{ const next = cards.filter(c=> c.id!==id); persistCards(next); };

  // validate and save card with simple checks; new cards are not verified by default
  const saveCardWithValidation = (form)=>{
    const f = { ...form, number: String(form.number || '').replace(/\s+/g,'') };
    if(!f.name || !f.number || !f.exp || !f.cvv){ window.alert('Veuillez remplir tous les champs de la carte'); return; }
    if(f.number.length < 12){ window.alert('Numéro de carte invalide'); return; }
    if(!/^\d{2}\/\d{2}$/.test(f.exp)){ window.alert('Format d\'expiration invalide (MM/AA)'); return; }
    if(!/^\d{3,4}$/.test(String(f.cvv))){ window.alert('CVV invalide'); return; }

    let next;
    if(f.id){
      const existing = cards.find(c=>c.id===f.id);
      next = cards.map(c=> c.id===f.id ? { ...c, ...f, number: f.number, verified: existing?.verified || false } : c);
    } else {
      const newCard = { ...f, id: Date.now(), verified: false, primary: cards.length===0 };
      next = [newCard, ...cards];
    }
    persistCards(next);
    setOpenCardModal(false);
  };

  // simulate card verification (mock)
  const verifyCard = async (id)=>{
    const inProgress = cards.map(c=> c.id===id ? { ...c, verifying:true } : c);
    setCards(inProgress);
    try{
      await new Promise(r=>setTimeout(r, 1000 + Math.random()*1200));
      const ok = true; // always succeed in mock
      const done = inProgress.map(c=> c.id===id ? { ...c, verifying:false, verified: ok } : c);
      persistCards(done);
      window.alert(ok ? 'Carte vérifiée' : 'La vérification a échoué');
    }catch(e){
      const done = inProgress.map(c=> c.id===id ? { ...c, verifying:false } : c);
      persistCards(done);
      window.alert('Erreur lors de la vérification');
    }
  };

  const setPrimaryCard = (id)=>{ const next = cards.map(c=> ({ ...c, primary: c.id===id })); persistCards(next); };

  // invoices persisted per-owner
  const [invoices, setInvoices] = useState([]);

  useEffect(()=>{
    try{
      const key = `owner_invoices_${ownerId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if(Array.isArray(saved) && saved.length) setInvoices(saved);
      else setInvoices([{ id: '#1795474', vendor: 'Google, Inc.', due: '$744.00' }]);
    }catch(e){ setInvoices([{ id: '#1795474', vendor: 'Google, Inc.', due: '$744.00' }]); }
  },[ownerId]);

  const handleInvoiceUpload = async (e) =>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () =>{
      const dataUrl = reader.result;
      const inv = { id: `local-${Date.now()}`, name: f.name, dataUrl, time: Date.now() };
      const next = [inv, ...invoices];
      setInvoices(next);
      try{ localStorage.setItem(`owner_invoices_${ownerId}`, JSON.stringify(next)); }catch(e){}
    };
    reader.readAsDataURL(f);
    // reset input
    e.target.value = '';
  };

  const downloadInvoice = (inv)=>{
    if(!inv || !inv.dataUrl) return;
    const a = document.createElement('a'); a.href = inv.dataUrl; a.download = inv.name || 'invoice'; document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <OwnerLayout>
      <div>
        <h4>Wallet</h4>

        <div className="content-grid mt-3">
          <div className="left-block">
            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="small text-muted">Credit card</div>
                    <div className="h5 fw-bold">{owner.name}</div>
                  </div>
                  <div className="small text-muted">••••  3746</div>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:12,marginTop:18}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:28,fontWeight:900}}>${balance.toLocaleString()}</div>
                    <div className="small text-muted">Solde disponible</div>
                  </div>
                  <div className="credit-card">
                    <div className="credit-logo">ND</div>
                    <div className="credit-chip" />
                    <div className="credit-number">3746 •••• ••••</div>
                  </div>
                </div>

                <div className="mt-3 d-flex gap-2">
                  <Button variant="contained" className="owner-btn-primary" onClick={() => setOpenAdd(true)}>Ajouter des fonds</Button>
                  <Button variant="outlined" onClick={() => setOpenWithdraw(true)}>Retirer</Button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h6>Recent transactions</h6>
                <div style={{marginTop:12}}>
                  {transactions.map(t => (
                    <div key={t.id} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div style={{fontWeight:700}}>{t.who}</div>
                        <div className="small text-muted">{t.note}</div>
                      </div>
                      <div style={{fontWeight:800}}>{t.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="right-block">
            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="small text-muted">My spendings</div>
                    <div style={{fontSize:28,fontWeight:900}}>${spendings.reduce((a,b)=>a+b,0).toLocaleString()}</div>
                    <div className="small text-muted">USD / EUR</div>
                  </div>
                  <div>
                    <select className="form-select form-select-sm">
                      <option>Month</option>
                      <option>Year</option>
                    </select>
                  </div>
                </div>

                <div style={{marginTop:18}}>
                  <Bar
                    data={{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul'], datasets:[{ label:'Spendings', data: spendings, backgroundColor: spendings.map((_,i)=> i===1? '#2b1460' : '#6b5cf0') }] }}
                    options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <h6>Invoices</h6>
                    <div>
                      <input type="file" accept="application/pdf,image/*" id="invoiceUpload" style={{display:'none'}} onChange={handleInvoiceUpload} />
                      <Button size="small" variant="outlined" onClick={() => document.getElementById('invoiceUpload').click()}>Upload invoice</Button>
                    </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <Button size="small" variant="outlined" onClick={()=> setOpenAdd(true)}>Ajouter des fonds</Button>
                        <Button size="small" variant="outlined" className="ms-2" onClick={()=> setOpenWithdraw(true)}>Retirer</Button>
                      </div>
                      <div>
                        <input id="invoiceUpload2" type="file" accept="application/pdf,image/*" style={{display:'none'}} onChange={handleInvoiceUpload} />
                        <Button size="small" variant="outlined" onClick={() => document.getElementById('invoiceUpload2').click()}>Upload invoice</Button>
                      </div>
                  </div>

                  {invoices.map((inv, idx) => (
                    <div key={inv.id || idx} style={{border:'1px solid #eef2f6',padding:12,borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div className="small text-muted">{inv.id || inv.name}</div>
                        <div style={{fontWeight:800,marginTop:6}}>{inv.vendor || inv.name || 'Uploaded invoice'}</div>
                        <div className="small text-muted">{inv.due || (inv.time ? new Date(inv.time).toLocaleString() : '')}</div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        {inv.dataUrl && <Button size="small" variant="outlined" onClick={()=>downloadInvoice(inv)}>Download</Button>}
                      </div>
                    </div>
                  ))}

                  <div style={{marginTop:12}}>
                    <div className="fw-bold small">Cartes de paiement</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                      {cards.map(c=> (
                        <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #eef2f6',padding:8,borderRadius:8}}>
                          <div>
                            <div style={{fontWeight:800}}>{c.name} {c.primary && <span className="small text-primary">(Par défaut)</span>}</div>
                            <div className="small text-muted">•••• {(c.number||'').slice(-4)} • Exp {c.exp}</div>
                            <div className="small mt-1">
                              {c.verifying ? <span className="text-warning">Vérification en cours…</span> : (c.verified ? <span className="text-success">Carte vérifiée</span> : <span className="text-muted">Non vérifiée</span>)}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            {!c.verified && !c.verifying && <Button size="small" variant="outlined" color="success" onClick={()=> verifyCard(c.id)}>Vérifier</Button>}
                            <Button size="small" variant="outlined" onClick={()=>{ setCardForm(c); setOpenCardModal(true); }}>Modifier</Button>
                            <Button size="small" variant="outlined" color="error" onClick={()=> removeCard(c.id)}>Supprimer</Button>
                            {!c.primary && <Button size="small" variant="outlined" onClick={()=> setPrimaryCard(c.id)}>Définir par défaut</Button>}
                          </div>
                        </div>
                      ))}
                      <div>
                        <Button size="small" variant="contained" onClick={()=>{ setCardForm({ id:null, name:'', number:'', exp:'', cvv:'' }); setOpenCardModal(true); }}>Ajouter une carte</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal open={openAdd} onClose={()=>setOpenAdd(false)}>
          <div style={{minWidth:320}}>
            <h5>Ajouter des fonds</h5>
            <div className="mb-2 small text-muted">Simulation de paiement (Stripe mock)</div>
            <input className="form-control mb-2" placeholder="Montant en USD" id="addAmount" type="number" />
            <div className="d-flex gap-2" style={{marginTop:8}}>
              <Button variant="contained" className="owner-btn-primary" onClick={()=>{ const v = document.getElementById('addAmount').value || 0; addFunds(Number(v)); }} fullWidth={isSmall}>Payer</Button>
              <Button variant="outlined" onClick={()=>setOpenAdd(false)} fullWidth={isSmall}>Annuler</Button>
            </div>
          </div>
        </Modal>

        <Modal open={openWithdraw} onClose={()=>setOpenWithdraw(false)}>
          <div style={{minWidth:320}}>
            <h5>Retirer des fonds</h5>
            <div className="mb-2 small text-muted">Simulation de retrait</div>
            <input className="form-control mb-2" placeholder="Montant en USD" id="withdrawAmount" type="number" />
            <div className="d-flex gap-2" style={{marginTop:8}}>
              <Button variant="contained" className="owner-btn-primary" onClick={()=>{ const v = document.getElementById('withdrawAmount').value || 0; withdrawFunds(Number(v)); }} fullWidth={isSmall}>Retirer</Button>
              <Button variant="outlined" onClick={()=>setOpenWithdraw(false)} fullWidth={isSmall}>Annuler</Button>
            </div>
          </div>
        </Modal>

        <Modal open={openCardModal} onClose={()=>setOpenCardModal(false)}>
          <div style={{minWidth:360}}>
            <h5>{cardForm.id ? 'Modifier la carte' : 'Ajouter une carte'}</h5>
            <input className="form-control mb-2" placeholder="Nom sur la carte" value={cardForm.name} onChange={e=>setCardForm({...cardForm, name:e.target.value})} />
            <input className="form-control mb-2" placeholder="Numéro de carte" value={cardForm.number} onChange={e=>setCardForm({...cardForm, number:e.target.value})} />
            <div className="d-flex gap-2">
              <input className="form-control mb-2" placeholder="MM/AA" value={cardForm.exp} onChange={e=>setCardForm({...cardForm, exp:e.target.value})} />
              <input className="form-control mb-2" placeholder="CVV" value={cardForm.cvv} onChange={e=>setCardForm({...cardForm, cvv:e.target.value})} />
            </div>
            <div className="d-flex gap-2" style={{marginTop:8}}>
              <Button variant="contained" className="owner-btn-primary" onClick={()=>saveCardWithValidation(cardForm)} fullWidth={isSmall}>Enregistrer</Button>
              <Button variant="outlined" onClick={()=>setOpenCardModal(false)} fullWidth={isSmall}>Annuler</Button>
            </div>
          </div>
        </Modal>
      </div>
    </OwnerLayout>
  );
}
