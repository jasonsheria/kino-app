import React from 'react';
import './OwnerCalendar.css';
import { getAppointmentsForOwner } from '../../data/fakeAppointments';

function startOfMonth(date){ return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date){ return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

export default function OwnerCalendar({ ownerId, initialDate }){
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(initialDate ? new Date(initialDate) : today);
  const [selectedDate, setSelectedDate] = React.useState(today);

  const appointments = React.useMemo(()=> getAppointmentsForOwner(ownerId || 'owner-123'), [ownerId]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);

  const apptMap = React.useMemo(()=>{
    const m = {};
    if (Array.isArray(appointments)) {
      appointments.forEach(a => { 
        if (a.date) {
            m[a.date] = m[a.date] || []; 
            m[a.date].push(a); 
        }
      });
    }
    return m;
  }, [appointments]);

  const firstWeekDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  // FONCTION DE SÉCURITÉ : Pour afficher le nom de la propriété
  const renderPropertyName = (prop) => {
    if (!prop) return "N/A";
    if (typeof prop === 'string') return prop;
    if (typeof prop === 'object') {
      return prop.titre || prop.title || prop.name || "Propriété sans nom";
    }
    return "N/A";
  };

  const renderGrid = () => {
    const cells = [];
    for(let i=0;i<firstWeekDay;i++) cells.push(null);
    for(let d=1; d<=daysInMonth; d++) cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    while(cells.length % 7 !== 0) cells.push(null);

    return cells.map((dt, idx) => {
      if(!dt) return <div key={idx} className="ocell empty" />;
      const key = dt.toISOString().slice(0,10);
      const has = !!apptMap[key];
      const isToday = sameDay(dt, new Date());
      const isSelected = sameDay(dt, selectedDate);
      return (
        <button key={idx} className={`ocell day ${has? 'occupied':''} ${isToday? 'today':''} ${isSelected? 'selected':''}`} onClick={() => setSelectedDate(dt)}>
          <div className="date-num">{dt.getDate()}</div>
          {has && <div className="dot" aria-hidden />}
        </button>
      );
    });
  };

  const selectedKey = selectedDate.toISOString().slice(0,10);
  const todaysAppts = apptMap[selectedKey] || [];

  return (
    <div className="owner-calendar">
      <div className="cal-header d-flex align-items-center justify-content-between">
        <div className="cal-nav d-flex flex-row align-items-center" style={{margin : "10px"}}>
          <button className="btns btn-sm btn-light me-2" onClick={prevMonth}>◀</button>
          <button className="btns btn-sm btn-light" onClick={nextMonth}>▶</button>
        </div>
        <div className="cal-title text-capitalize">{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="cal-grid">
        <div className="weekdays">
          {['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(w=> <div key={w} className="wk">{w}</div>)}
        </div>
        <div className="days-grid">{renderGrid()}</div>
      </div>

      <div className="appts mt-3">
        <h6 className="fw-bold">Rendez-vous — {selectedDate.toLocaleDateString()}</h6>
        {todaysAppts.length === 0 && <div className="small text-muted">Aucun rendez-vous pour cette date.</div>}
        {todaysAppts.map(a => (
          <div key={a._id || a.id} className="appt-item d-flex justify-content-between align-items-center p-2 mb-2 border-bottom">
            <div>
              <div className="fw-bold">{a.time} — {typeof a.guestName === 'object' ? 'Client' : a.guestName}</div>
              <div className="small text-muted">
                {/* SÉCURISÉ : On affiche une propriété de l'objet, pas l'objet lui-même */}
                {typeof a.note === 'object' ? '' : a.note} • Bien : {renderPropertyName(a.propertyId || a.property)}
              </div>
            </div>
            <div className="appt-actions small text-muted">#{String(a._id || a.id).slice(-4)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}