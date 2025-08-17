import React, { useState, useMemo, useEffect, useRef } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import Modal from '../components/common/Modal';
import { messages as sampleMessages, owners } from '../data/fakedata';
import '../styles/owner.css';
// Leaflet will be loaded on demand for map preview

export default function OwnerMessages(){
  // determine current owner id (from localStorage draft or fallback to sample owner)
  const ownerDraft = (()=>{ try{ return JSON.parse(localStorage.getItem('owner_request_draft')||'null'); }catch(e){return null;} })();
  const ownerId = ownerDraft && ownerDraft.id ? ownerDraft.id : (owners && owners[0] && owners[0].id) || 1;

  const [msgs, setMsgs] = useState(()=> JSON.parse(localStorage.getItem('owner_messages')||'null') || sampleMessages.filter(m=> m.toId === ownerId) );
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [threadOpen, setThreadOpen] = useState(false);
  const [attachLocation, setAttachLocation] = useState(null); // {lat,lng}
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);

  const ownerMessages = useMemo(()=> msgs.filter(m=> m.toId === ownerId), [msgs, ownerId]);

  const markRead = (id)=>{
    const next = msgs.map(m=> m.id===id ? {...m, read:true} : m);
    setMsgs(next); localStorage.setItem('owner_messages', JSON.stringify(next));
  };

  const remove = (id)=>{
    if(!window.confirm('Supprimer ce message ?')) return;
    const next = msgs.filter(m=> m.id!==id);
    setMsgs(next); localStorage.setItem('owner_messages', JSON.stringify(next));
  };

  const openReply = (m)=>{ setReplyTo(m); setReplyText(''); setThreadOpen(true); };

  const sendReply = ()=>{
    if(!replyTo) return; const text = replyText && replyText.trim(); if(!text) return alert('Message vide');
    // send via websocket if available
    try{
      if(window.__APP_SOCKET__ && window.__APP_SOCKET__.readyState === 1){
          const payload = { type:'message', toId: replyTo.fromId, text };
          if(attachLocation) payload.location = attachLocation;
          window.__APP_SOCKET__.send(JSON.stringify(payload));
        } else {
        // fallback: append to localStorage messages as outgoing and queue
        const out = { id: Date.now(), fromId: ownerId, from: 'Propriétaire', toId: replyTo.fromId, to: replyTo.from, text, time: Date.now(), read: true, channel:'web', status:'queued', location: attachLocation || null };
        const next = [out, ...msgs]; setMsgs(next); localStorage.setItem('owner_messages', JSON.stringify(next));
        // push to outbox queue
        try{
          const qk = `ndaku_owner_outbox_${ownerId}`;
          const q = JSON.parse(localStorage.getItem(qk) || '[]'); q.push(out); localStorage.setItem(qk, JSON.stringify(q));
        }catch(e){}
      }
    }catch(e){
      console.warn('send failed', e);
    }
    // reset composer but keep thread open for continuity
    setReplyText(''); setAttachLocation(null);
  };

  // listen for incoming owner-targeted messages from other parts of the app
  useEffect(()=>{
    const handler = (e)=>{
      const m = e && e.detail ? e.detail : null; if(!m) return;
      // only add if for this owner
      if(Number(m.toId) !== Number(ownerId)) return;
      // mark as unread and dispatch browser notification
      try{ if (window.Notification && Notification.permission === 'granted') new Notification(`Message — ${m.from}`, { body: m.text }); }catch(e){}
      setMsgs(prev => { const next = [m, ...prev]; localStorage.setItem('owner_messages', JSON.stringify(next)); return next; });
    };
    window.addEventListener('ndaku-owner-message', handler);
    return () => window.removeEventListener('ndaku-owner-message', handler);
  },[ownerId]);

  // Request notification permission for owner messages (once)
  useEffect(()=>{
    try{ if(window.Notification && Notification.permission === 'default') Notification.requestPermission().then(()=>{}); }catch(e){}
  },[]);

  // Flush outbox when socket reconnects
  useEffect(()=>{
    const flush = ()=>{
      try{
        const qk = `ndaku_owner_outbox_${ownerId}`;
        const q = JSON.parse(localStorage.getItem(qk) || '[]');
        if(!q || !q.length) return;
        if(window.__APP_SOCKET__ && window.__APP_SOCKET__.readyState === 1){
          q.forEach(item => {
            const payload = { type:'message', toId: item.toId, text: item.text, location: item.location || null, meta:{ownerOutboxId: item.id} };
            try{ window.__APP_SOCKET__.send(JSON.stringify(payload));
              // mark as sent in local messages
              setMsgs(prev => {
                const next = prev.map(m => m.id===item.id ? {...m, status:'sent'} : m);
                localStorage.setItem('owner_messages', JSON.stringify(next));
                return next;
              });
            }catch(e){ console.warn('flush send failed', e); }
          });
          localStorage.removeItem(qk);
        }
      }catch(e){ console.warn('flush outbox', e); }
    };
    window.addEventListener('ndaku-socket-open', flush);
    // also attempt on mount
    flush();
    return ()=> window.removeEventListener('ndaku-socket-open', flush);
  },[ownerId]);

  // simple helper to show map preview for attaching location (load leaflet lazily)
  const ensureLeaflet = async ()=>{
    if(window.L) return window.L;
    // dynamic load
    await new Promise((res)=>{
      const link = document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const script = document.createElement('script'); script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = res; document.body.appendChild(script);
    });
    return window.L;
  };

  // initialize map when requested
  useEffect(()=>{
    let map; let marker;
    if(!showMap) return;
    let mounted = true;
    ensureLeaflet().then(L=>{
      if(!mounted) return;
      const container = document.getElementById('owner-msg-map'); if(!container) return;
      container.innerHTML = '';
      map = L.map(container).setView([ -4.325, 15.322 ], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      marker = L.marker([ -4.325, 15.322 ], { draggable:true }).addTo(map);
      marker.on('dragend', ()=>{ const p = marker.getLatLng(); setAttachLocation({ lat: p.lat, lng: p.lng }); });
      mapRef.current = map; markerRef.current = marker;
    }).catch(()=>{});
    return ()=>{ mounted=false; try{ if(map) map.remove(); }catch(e){} };
  },[showMap]);

  const messages = JSON.parse(localStorage.getItem('owner_messages')||'[]');
  return (
    <OwnerLayout>
      <div>
        <h4>Messages</h4>
        {ownerMessages.length===0 && <div className="alert alert-info">Aucun message pour le moment.</div>}
        <div style={{display:'flex',gap:12}}>
          <div style={{flex:1}}>
            {ownerMessages.map((m,i)=> (
              <div key={m.id} className={`card mb-2 ${m.read ? '' : 'border-3'}`} style={{cursor:'pointer'}} onClick={()=>{ setReplyTo(m); setThreadOpen(true); }}>
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{m.from} <span className="small text-muted">· {new Date(m.time).toLocaleString()}</span></div>
                    <div className="small text-muted">{m.text}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <button title="Marquer lu" className="btn" onClick={(e)=>{ e.stopPropagation(); markRead(m.id); }} style={{width:34,height:34,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid #6c757d',background:'#fff'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button title="Répondre" className="btn" onClick={(e)=>{ e.stopPropagation(); setReplyTo(m); setThreadOpen(true); }} style={{width:34,height:34,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid #0d6efd',background:'#fff',color:'#0d6efd'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14l-4-4 4-4M14 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button title="Supprimer" className="btn" onClick={(e)=>{ e.stopPropagation(); remove(m.id); }} style={{width:34,height:34,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid #dc3545',background:'#fff',color:'#dc3545'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{width:420}}>
            {!threadOpen && <div className="small text-muted">Sélectionnez un message pour ouvrir la conversation</div>}
            {threadOpen && replyTo && (
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-bold">Conversation avec {replyTo.from}</div>
                    <div><button className="btn btn-sm btn-outline-secondary" onClick={()=>{ setThreadOpen(false); setReplyTo(null); }}>Fermer</button></div>
                  </div>
                  <div style={{maxHeight:300,overflow:'auto',marginBottom:8}}>
                    {(msgs.filter(x=> x.fromId===replyTo.fromId || x.toId===replyTo.fromId) || []).map((m2,idx)=> (
                      <div key={m2.id || idx} style={{marginBottom:8}}>
                        <div className="small text-muted">{m2.from} · {new Date(m2.time).toLocaleString()}</div>
                        <div>{m2.text}</div>
                      </div>
                    ))}
                  </div>
                  <textarea className="form-control mb-2" rows={3} value={replyText} onChange={e=>setReplyText(e.target.value)} />
                  <div className="d-flex gap-2">
                    <button className="btn owner-btn-primary" onClick={()=>{ sendReply(); }}>Envoyer</button>
                    <button className="btn btn-outline-secondary" onClick={()=>{ setThreadOpen(false); setReplyTo(null); }}>Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Modal open={modalOpen} onClose={()=>{ setModalOpen(false); setReplyTo(null); }}>
          <div style={{minWidth:360}}>
            <div className="card">
              <div className="card-body">
                <h5 className="mb-2">Répondre à {replyTo && replyTo.from}</h5>
                <textarea className="form-control mb-2" rows={4} value={replyText} onChange={e=>setReplyText(e.target.value)} />
                <div className="d-flex gap-2">
                  <button className="btn owner-btn-primary" onClick={sendReply}>Envoyer</button>
                  <button className="btn btn-outline-secondary" onClick={()=>{ setModalOpen(false); setReplyTo(null); }}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </OwnerLayout>
  );
}
