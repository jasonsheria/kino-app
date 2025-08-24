import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { processPayment } from '../../api/mockFrespay';

export default function VisitUnlockModal({ open, onClose, agent, property, onUnlocked }){
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [amount, setAmount] = useState(property?.visitFee ?? 5000);
  const [method, setMethod] = useState('mpesa');
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState('selectDate'); // selectDate | payment | processing | done
  const [showPaymentAnim, setShowPaymentAnim] = useState(false);

  // fake busy dates from agent (if any)
  const busy = agent?.busyDates || [];

  const days = useMemo(()=>{
    const arr = [];
    const now = new Date();
    for(let i=0;i<14;i++){
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()+i);
      const key = d.toISOString().slice(0,10);
      arr.push({ date:d, key, busy: busy.includes(key) });
    }
    return arr;
  }, [busy]);

  useEffect(()=>{
    if(!open){
      setSelectedDate(null);
      setSelectedTime('10:00');
      setProcessing(false);
      setStage('selectDate');
      setShowPaymentAnim(false);
    }
  }, [open]);

  // when user picks a date, transition to payment UI with animation
  useEffect(()=>{
    if(selectedDate){
      // small delay before showing payment UI for animation
      setStage('payment');
      setShowPaymentAnim(false);
      const t = setTimeout(()=> setShowPaymentAnim(true), 80);
      return ()=> clearTimeout(t);
    }
  }, [selectedDate]);

  const doPayment = async ()=>{
    if(!selectedDate) return alert('Choisissez une date disponible.');
    setProcessing(true);
    setStage('processing');
    try{
      const resp = await processPayment({ amount, method, reference: `visit-${property.id}-${Date.now()}` });
      if(!resp.success) throw new Error(resp.error || 'Payment failed');
      // store booking and unlocked marker
      const key = 'ndaku_bookings';
      const raw = localStorage.getItem(key); const list = raw ? JSON.parse(raw) : [];
      list.push({ id: Date.now(), propertyId: property.id, agentId: agent.id, date: selectedDate, time: selectedTime, amount, method, tx: resp.transactionId });
      localStorage.setItem(key, JSON.stringify(list));
      const unlockedRaw = localStorage.getItem('unlocked_contacts'); const unlocked = unlockedRaw ? JSON.parse(unlockedRaw) : [];
      if(!unlocked.includes(property.id)) unlocked.push(property.id);
      localStorage.setItem('unlocked_contacts', JSON.stringify(unlocked));
      // show success briefly then close
      setStage('done');
      setProcessing(false);
      onUnlocked && onUnlocked(property.id);
      setTimeout(()=>{ onClose(); alert('Paiement effectué, contact débloqué.'); }, 450);
    }catch(err){
      console.error(err);
      setProcessing(false);
      setStage('payment');
      alert('Erreur de paiement: ' + (err.message || 'unknown'));
    }
  };

  const agentBlurred = stage !== 'done';

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Réserver une visite & payer</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{fontWeight:800}}>{property?.name || property?.title}</Typography>
        <Typography color="text.secondary" sx={{mb:2}}>{property?.address}</Typography>

        {/* Agent preview - blurred until payment completes */}
        {agent && (
          <Box sx={{display:'flex', alignItems:'center', gap:2, mb:2, position:'relative'}}>
            <Box sx={{width:64, height:64, borderRadius:'50%', overflow:'hidden', border:`2px solid var(--ndaku-primary)`, flex:'0 0 64px', filter: agentBlurred ? 'blur(5px) grayscale(.15)' : 'none', transition:'filter .35s ease'}}>
              <img src={agent.photo} alt={agent.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
            </Box>
            <Box sx={{flex:1}}>
              <Typography sx={{fontWeight:700}}>{agent.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{fontSize:13}}>{agent.title || 'Agent'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{mt:0.5, fontSize:13}}>{agentBlurred ? 'Informations cachées — payez pour débloquer' : agent.phone}</Typography>
            </Box>
            {agentBlurred && (
              <Box sx={{position:'absolute', right:8, top:8, bgcolor:'rgba(0,0,0,0.06)', px:1.2, py:0.5, borderRadius:1, fontSize:12}}>🔒 Verrouillé</Box>
            )}
          </Box>
        )}

        {/* Date selector - hidden when payment UI is active */}
        <Box sx={{mb:2, transition:'opacity .28s ease, transform .28s ease', opacity: stage==='selectDate' ? 1 : 0, transform: stage==='selectDate' ? 'none' : 'translateY(-6px)', display: stage==='selectDate' ? 'block' : 'none' }}>
          <Typography variant="subtitle2">Choisissez une date</Typography>
          <Box sx={{display:'flex', gap:1, flexWrap:'wrap', mt:1}}>
            {days.map(d=> (
              <Button key={d.key} size="small" variant={selectedDate===d.key ? 'contained' : 'outlined'} disabled={d.busy} onClick={()=>setSelectedDate(d.key)}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontWeight:700}}>{d.date.toLocaleDateString(undefined,{weekday:'short'})}</div>
                  <div style={{fontSize:11}}>{d.date.toLocaleDateString()}</div>
                </div>
              </Button>
            ))}
          </Box>

          <Box sx={{mt:2}}>
            <FormControl fullWidth>
              <InputLabel id="time-label">Heure</InputLabel>
              <Select labelId="time-label" value={selectedTime} label="Heure" onChange={(e)=>setSelectedTime(e.target.value)}>
                {['09:00','10:00','11:00','13:00','14:00','15:00','16:00'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Payment UI - appears with slide animation after date selection */}
        <Box sx={{mb:2, minHeight: 10}}>
          <Box sx={{
            transform: showPaymentAnim ? 'translateX(0)' : 'translateX(14px)',
            opacity: showPaymentAnim ? 1 : 0,
            transition: 'all .36s cubic-bezier(.2,.9,.28,1)',
            display: stage==='payment' || stage==='processing' || stage==='done' ? 'block' : 'none'
          }}>
            <Typography variant="subtitle2">Paiement (Frespay)</Typography>
            <Box sx={{display:'flex', gap:1, mt:1}}>
              <Chip label="Airtel" clickable color={method==='airtel' ? 'primary' : 'default'} onClick={()=>setMethod('airtel')} />
              <Chip label="Orange" clickable color={method==='orange' ? 'primary' : 'default'} onClick={()=>setMethod('orange')} />
              <Chip label="M-Pesa" clickable color={method==='mpesa' ? 'primary' : 'default'} onClick={()=>setMethod('mpesa')} />
            </Box>
            <Box sx={{mt:1}}>
              <FormControl fullWidth>
                <InputLabel id="amount-label">Montant</InputLabel>
                <Select labelId="amount-label" value={amount} label="Montant" onChange={(e)=>setAmount(e.target.value)}>
                  <MenuItem value={2500}>2 500</MenuItem>
                  <MenuItem value={5000}>5 000</MenuItem>
                  <MenuItem value={10000}>10 000</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{mt:2, display:'flex', gap:1, alignItems:'center'}}>
              <Typography variant="body2" color="text.secondary">Date choisie:</Typography>
              <Typography sx={{fontWeight:700}}>{selectedDate}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ml:2}}>Heure: <strong>{selectedTime}</strong></Typography>
            </Box>

            {stage==='processing' && (
              <Typography variant="body2" color="text.secondary" sx={{mt:1}}>Traitement du paiement...</Typography>
            )}
          </Box>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Annuler</Button>
        <Button variant="contained" onClick={doPayment} disabled={processing || stage!=='payment'}>{processing ? 'Traitement...' : 'Payer & Débloquer'}</Button>
      </DialogActions>
    </Dialog>
  );
}
