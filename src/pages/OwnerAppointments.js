import React, { useEffect, useMemo, useRef, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import '../styles/owner.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { fetchAppointments, updateAppointment, exportAppointmentsCSV, saveAppointment } from '../api/appointments';
import { getAppointmentsForOwner as getLocalAppts } from '../data/fakeAppointments';

function ownerIdFromDraft(){ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id ? String(d.id) : 'owner-123'; }catch(e){ return 'owner-123'; } }

export default function OwnerAppointments(){
  const ownerId = ownerIdFromDraft();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' });
  const calendarRef = useRef(null);

  // initial load: merge local fake data and backend stub
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      const backend = await fetchAppointments(ownerId);
      const local = getLocalAppts(ownerId) || [];
      // seed backend with local data if backend empty
      if(backend.length === 0 && local.length>0){
        for(const a of local){ await saveAppointment(ownerId, { ...a, status: 'pending' }); }
      }
      const final = (backend.length? backend : local).map(a => ({ ...a, status: a.status || 'pending' }));
      if(mounted) setAppts(final);
      setLoading(false);
    })();
    return ()=> mounted = false;
  },[ownerId]);

  useEffect(()=>{
    // animate cards on load
    const el = document.querySelectorAll('.appt-card');
    el.forEach((n,i)=> { n.style.transform = 'translateY(8px)'; n.style.transition = 'transform .36s cubic-bezier(.2,.9,.2,1)'; });
    setTimeout(()=> el.forEach((n,i)=> { n.style.transform = 'translateY(0)'; }), 80);
  },[appts.length]);

  const events = useMemo(()=> appts.map(a => ({ id: a.id, title: `${a.time} • ${a.guestName}`, start: `${a.date}T${a.time}:00`, extendedProps: a })), [appts]);

  const handleEventClick = async (clickInfo)=>{
    const id = clickInfo.event.id;
    // toggle confirm
    const existing = appts.find(x => x.id === id);
    if(!existing) return;
    const nextStatus = existing.status === 'confirmed' ? 'pending' : 'confirmed';
    await updateAppointment(ownerId, id, { status: nextStatus });
    setAppts(a => a.map(x => x.id===id? { ...x, status: nextStatus } : x));
  };

  const filtered = appts.filter(a => (filterProperty==='all' || a.propertyId===filterProperty) &&
    (!range.from || a.date >= range.from) && (!range.to || a.date <= range.to));

  const unconfirmed = filtered.filter(a => a.status !== 'confirmed' && a.status !== 'cancelled');

  const confirm = async (id) => { await updateAppointment(ownerId, id, { status: 'confirmed' }); setAppts(s => s.map(x => x.id===id? { ...x, status:'confirmed' } : x)); };
  const cancel = async (id) => { await updateAppointment(ownerId, id, { status: 'cancelled' }); setAppts(s => s.map(x => x.id===id? { ...x, status:'cancelled' } : x)); };

  const onDateSelect = (selectInfo) => {
    const title = window.prompt('Nom du visiteur / motif');
    if(!title) return;
    const id = 'a'+Math.random().toString(36).slice(2,9);
    const date = selectInfo.startStr.slice(0,10);
    const time = selectInfo.startStr.slice(11,16);
    const newAppt = { id, ownerId, date, time, guestName: title, propertyId: filterProperty==='all' ? 'p1' : filterProperty, note:'Ajouté via calendrier', status:'pending' };
    saveAppointment(ownerId, newAppt).then(()=> setAppts(s=> [...s, newAppt]));
  };

  const exportCSV = ()=>{
    const csv = exportAppointmentsCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `appointments-${ownerId}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const properties = Array.from(new Set(appts.map(a=>a.propertyId))).filter(Boolean);

  return (
    <OwnerLayout>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h4 className="mb-1">Rendez-vous</h4>
            <div className="small text-muted">Calendrier interactif, filtres, export et synchronisation serveur (simulée).</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select className="form-select" value={filterProperty} onChange={e=> setFilterProperty(e.target.value)} style={{minWidth:160}}>
              <option value="all">Toutes les propriétés</option>
              {properties.map(p => <option key={p} value={p}>Propriété {p}</option>)}
            </select>
            <input className="form-control" type="date" value={range.from} onChange={e=> setRange(r=>({...r, from:e.target.value}))} />
            <input className="form-control" type="date" value={range.to} onChange={e=> setRange(r=>({...r, to:e.target.value}))} />
            <button className="btn btn-outline-secondary" onClick={exportCSV}>Exporter</button>
            <button className="btn btn-outline-secondary" onClick={() => window.print()}>Imprimer</button>
          </div>
        </div>

        <div className="d-flex gap-4" style={{alignItems:'flex-start'}}>
          <div style={{flex:1}}>
            <div className="card mb-3">
              <div className="card-body">
                <FullCalendar
                  plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin ]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
                  events={events}
                  eventClick={handleEventClick}
                  selectable={true}
                  select={onDateSelect}
                  ref={calendarRef}
                  height={600}
                  eventDidMount={(info) => {
                    // tooltip
                    info.el.setAttribute('title', info.event.title + ' — ' + (info.event.extendedProps.note||''));
                    // badge color
                    const status = info.event.extendedProps.status;
                    if(status === 'confirmed') info.el.style.background = '#d1fae5';
                    if(status === 'cancelled') info.el.style.opacity = '0.5';
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{width:360}}>
            <div className="card mb-3">
              <div className="card-body">
                <h6>Rendez-vous non confirmés</h6>
                <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:10}}>
                  {loading && <div className="small text-muted">Chargement...</div>}
                  {!loading && unconfirmed.length===0 && <div className="small text-muted">Aucun rendez-vous non confirmé</div>}
                  {!loading && unconfirmed.map(a=> (
                    <div key={a.id} className="appt-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,borderRadius:8,border:'1px solid #fdecea',background:'#fff7f6',transition:'transform .28s ease'}}>
                      <div>
                        <div style={{fontWeight:800}}>{a.date} {a.time}</div>
                        <div className="small text-muted">{a.guestName} • {a.propertyId}</div>
                        <div className="small text-muted">{a.note}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="btn btn-sm btn-success" onClick={()=> confirm(a.id)}>Confirmer</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=> cancel(a.id)}>Annuler</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h6>Statut rapide</h6>
                <div className="small text-muted">Total: {appts.length} — Non confirmés: {unconfirmed.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
