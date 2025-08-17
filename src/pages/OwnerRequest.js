import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/owner.css';
import FileUploadPreview from '../components/common/FileUploadPreview';
import ConfirmModal from '../components/common/ConfirmModal';
import InfoModal from '../components/common/InfoModal';

export default function OwnerRequest(){
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({nom:'',postnom:'',prenom:'',email:'',phone:'',address:''});
  const [idFile, setIdFile] = useState(null);
  const [propTitles, setPropTitles] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [completion, setCompletion] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(()=>{
    const fields = ['nom','prenom','email','phone','address'];
    let filled = 0;
    fields.forEach(k => { if(form[k] && String(form[k]).trim().length>0) filled++; });
    if(types.length) filled += 1;
    if(idFile) filled += 1;
    if(propTitles.length) filled += 1;
    const total = fields.length + 3;
    const pct = Math.round((filled / total) * 100);
    setCompletion(pct);
    try{ localStorage.setItem('owner_profile_completion', JSON.stringify({pct, updated: Date.now()})); }catch(e){}
  }, [form, types, idFile, propTitles]);

  // on mount: restore draft if any
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('owner_request_draft');
      if(raw){
        const draft = JSON.parse(raw || '{}');
        if(draft.types) setTypes(draft.types);
        if(draft.form) setForm(draft.form);
        if(draft.propTitles) setPropTitles(draft.propTitles);
      }
    }catch(e){ console.error('restore draft failed', e); }

    // if we have a resume flag and a subscription, auto-continue
    // DO NOT clear the resume flag here; only remove it when we actually submit to avoid losing state
    try{
      const resume = localStorage.getItem('owner_resume_submission');
      const sub = JSON.parse(localStorage.getItem('owner_subscription') || 'null');
      if(resume && sub && sub.type){
        // if form looks filled enough, open confirm directly to finalize
        // Note: we restored draft above, but state updates are async, so allow a short timeout
        setTimeout(()=>{
          const looksReady = (typeof form.nom === 'string' && form.nom.trim().length>0) || (typeof form.prenom === 'string' && form.prenom.trim().length>0) || (typeof form.email === 'string' && form.email.trim().length>0) || types.length;
          if(looksReady){
            setConfirmOpen(true);
          }
        }, 300);
      }
    }catch(e){ console.error('resume check failed', e); }
  }, []);

  const toggleType = (t)=> setTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);

  const submitApplication = async (e)=>{
    if(e && e.preventDefault) e.preventDefault();
    if(!form.nom || !form.prenom || !form.email){ setValidationError('Veuillez remplir les champs obligatoires'); return; }
    setValidationError('');
    // check subscription: if owner hasn't chosen subscription, save draft and redirect to subscription page
    try{
      const sub = JSON.parse(localStorage.getItem('owner_subscription')||'null');
      if(!sub || !sub.type){
        // save draft (files cannot be serialized fully) - keep meta and ids
        const draft = { types, form, propTitles, savedAt: Date.now() };
        localStorage.setItem('owner_request_draft', JSON.stringify(draft));
        // navigate to subscription selection before final submit
        navigate('/owner/subscribe');
        return;
      }
    }catch(e){ console.error('subscription check failed', e); }

    setConfirmOpen(true);
  };

  const doSubmit = async ()=>{
    // prevent double execution
    if(sessionStorage.getItem('owner_submission_lock') === '1'){
      // already submitting
      return;
    }
    sessionStorage.setItem('owner_submission_lock','1');
    setConfirmOpen(false);
    const payload = new FormData();
    payload.append('meta', JSON.stringify({types,form,propTitles}));
    if(idFile) payload.append('idFile', idFile);
    let saveStatus = 'pending';
    let serverMessage = 'Votre demande a été envoyée avec succès. Vous recevrez un code sous 48h.';
    try{
      const res = await fetch('/api/owner/apply', { method:'POST', body: payload });
      if(!res.ok){ saveStatus = 'submitted_local'; serverMessage = 'Demande enregistrée localement (serveur indisponible).'; }
    }catch(e){ console.error(e); saveStatus = 'submitted_local'; serverMessage = 'Demande enregistrée localement (erreur réseau).'; }

    // persist a local application record so OwnerOnboard can display status/message
    try{
      const code = Math.random().toString(36).slice(2,8).toUpperCase();
      let subscription = null;
      try{ subscription = JSON.parse(localStorage.getItem('owner_subscription')||'null'); }catch(e){}

      // dedupe: avoid creating duplicates if a very recent application with same email+name exists
      const existingRaw = localStorage.getItem('owner_application');
      let existing = existingRaw ? JSON.parse(existingRaw) : [];
      if(!Array.isArray(existing)) existing = [existing];
      const now = Date.now();
      const similar = existing.find(it => it && it.meta && it.meta.form && it.meta.form.email === form.email && it.meta.form.nom === form.nom && (now - it.submittedAt) < (15*1000));
      if(similar){
        // cleanup lock but keep draft removal as it was already submitted
        try{ localStorage.removeItem('owner_request_draft'); localStorage.removeItem('owner_resume_submission'); }catch(e){}
        sessionStorage.removeItem('owner_submission_lock');
        // show modal informing user that submission already recorded (avoid duplicate code spam)
        setInfoTitle('Demande déjà envoyée');
        setInfoMessage('Une demande similaire a été enregistrée il y a quelques instants. Si vous pensez que c\'est une erreur, contactez le support.');
        setInfoOpen(true);
        return;
      }

      const app = { id: Date.now(), status: saveStatus, message: serverMessage, code, submittedAt: now, subscription, meta:{types,form,propTitles} };
      existing.unshift(app);
      localStorage.setItem('owner_application', JSON.stringify(existing));
      // cleanup draft and resume flag after successful save
      try{ localStorage.removeItem('owner_request_draft'); localStorage.removeItem('owner_resume_submission'); }catch(e){}
      // show info modal
      setInfoTitle('Demande envoyée');
      setInfoMessage(serverMessage + ` Votre code d'application: ${code}`);
      setInfoOpen(true);
      sessionStorage.removeItem('owner_submission_lock');
    }catch(e){ console.error('local save failed', e); setValidationError('Erreur lors de l\'enregistrement local'); sessionStorage.removeItem('owner_submission_lock'); }
  };

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 text-center mb-3">
          <h3 className="mb-1">Demande de partenariat propriétaire</h3>
          <p className="text-muted">Complétez les informations et choisissez un abonnement pour finaliser votre inscription.</p>
        </div>

        <div className="col-12">
          <div className="d-flex gap-4 justify-content-center flex-wrap">
            {/* Left info card */}
            <div style={{width:300,borderRadius:12,background:'#fff',padding:20,boxShadow:'0 6px 18px rgba(20,24,40,0.06)',border:'1px solid #eceff3'}}>
              <div className="small text-muted">Pourquoi devenir partenaire</div>
              <div className="fw-bold mt-2">Avantages</div>
              <ul style={{marginTop:10,paddingLeft:18}}>
                <li>Publication illimitée après activation</li>
                <li>Gestion des demandes et réservations</li>
                <li>Support prioritaire</li>
              </ul>
              <div style={{marginTop:10}}>
                <button className="btn" style={{background:'#0b3b66',color:'#fff',borderRadius:20,padding:'8px 18px'}} onClick={() => navigate('/owner/subscribe')}>Choisir un abonnement</button>
              </div>
                {/* Right status card */}
            <div style={{margin:"10px",borderRadius:12,background:'#fff',padding:20,boxShadow:'0 6px 18px rgba(20,24,40,0.06)',border:'1px solid #eceff3'}}>
              <div className="small text-muted">État de la demande</div>
              <div className="fw-bold mt-2">Suivi</div>
              <div style={{marginTop:10}}>
                <div className="small text-muted">Après soumission, vous recevrez un code pour accéder à votre tableau de bord.</div>
                <div style={{marginTop:12}}>
                  <a className="btn btn-outline-secondary" href="/owner/onboard">Voir l'état</a>
                </div>
              </div>
            </div>
            </div>

            {/* Center — main form card (keeps original form and logic) */}
            <div style={{width:720}}>
              <div style={{maxWidth:720, margin:'0 auto 12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                  <div className="small text-muted">Taux de complétion du profil</div>
                  <div className="small fw-bold">{completion}%</div>
                </div>
                <div style={{height:10, background:'#eef9f6', borderRadius:8, overflow:'hidden'}}>
                  <div style={{width:`${completion}%`, height:'100%', background:'linear-gradient(90deg, var(--owner-accent), var(--owner-accent-2))'}} />
                </div>
                {completion < 70 && <div className="mt-2 alert alert-warning small">Votre profil est à {completion}%. Veuillez compléter vos informations.</div>}
              </div>

              <div className="card owner-card shadow-sm">
                <div className="card-body p-3">
                  <h4 className="mb-2">Information de contact</h4>
                  {step === 1 && (
                    <div>
                      <h6>Quel(s) type(s) de bien possédez-vous ?</h6>
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        {['Voiture','Terrain','Appartement','Salle de fête'].map(t=> (
                          <button key={t} type="button" className={`btn ${types.includes(t) ? 'owner-btn-primary' : 'btn-outline-secondary'}`} onClick={() => toggleType(t)}>{t}</button>
                        ))}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn owner-btn-primary" onClick={() => types.length ? setStep(2) : setValidationError('Sélectionnez au moins un type de bien')}>Suivant</button>
                        <button className="btn btn-outline-secondary" onClick={() => { setTypes([]); setValidationError(''); }}>Réinitialiser</button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <form onSubmit={submitApplication}>
                      <h6 className="mb-3">Vos informations</h6>
                      <div className="row">
                        <div className="col-md-4 mb-3"><input className="form-control" placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} /></div>
                        <div className="col-md-4 mb-3"><input className="form-control" placeholder="Post-nom" value={form.postnom} onChange={e=>setForm({...form,postnom:e.target.value})} /></div>
                        <div className="col-md-4 mb-3"><input className="form-control" placeholder="Prénom" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} /></div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3"><input className="form-control" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
                        <div className="col-md-6 mb-3"><input className="form-control" placeholder="Téléphone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                      </div>
                      <div className="mb-3"><input className="form-control" placeholder="Adresse complète" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>

                      <div className="mb-3">
                        <FileUploadPreview file={idFile} onChange={setIdFile} label={"Pièce d'identité (passeport, carte, permis)"} />
                      </div>

                      <div className="mb-3"><input className="form-control" placeholder="Titre(s) de propriété (optionnel)" value={propTitles.join(',')} onChange={e=>setPropTitles(e.target.value.split(',').map(s=>s.trim()))} /></div>

                      {validationError && <div className="alert alert-danger small">{validationError}</div>}

                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)}>Retour</button>
                        <button className="btn owner-btn-primary" onClick={submitApplication}>Soumettre la demande</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

          
          </div>
        </div>
      </div>

  <ConfirmModal open={confirmOpen} title="Confirmer l'envoi" message="Confirmez-vous l'envoi de votre demande ?" onConfirm={doSubmit} onCancel={() => setConfirmOpen(false)} />
  <InfoModal open={infoOpen} title={infoTitle} message={infoMessage} onClose={() => { setInfoOpen(false); navigate('/owner/onboard'); }} />
    </div>
  );
}
