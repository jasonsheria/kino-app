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

  // map dates (YYYY-MM-DD) -> appointments
  const apptMap = React.useMemo(()=>{
    const m = {};
    appointments.forEach(a => { m[a.date] = m[a.date] || []; m[a.date].push(a); });
    return m;
  }, [appointments]);

  const firstWeekDay = monthStart.getDay(); // 0 (Sun) - 6
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  const renderGrid = () => {
    const cells = [];
    // fill blanks before month start
    for(let i=0;i<firstWeekDay;i++) cells.push(null);
    for(let d=1; d<=daysInMonth; d++) cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    // pad to complete weeks
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
        <div className="cal-nav">
          <button className="btn btn-sm btn-light me-2" onClick={prevMonth} aria-label="previous month">◀</button>
          <button className="btn btn-sm btn-light" onClick={nextMonth} aria-label="next month">▶</button>
        </div>
        <div className="cal-title">{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <div className="cal-legend small text-muted">Occupied dates are highlighted</div>
      </div>

      <div className="cal-grid">
        <div className="weekdays">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(w=> <div key={w} className="wk">{w}</div>)}
        </div>
        <div className="days-grid">{renderGrid()}</div>
      </div>

      <div className="appts mt-3">
        <h6>Rendez-vous — {selectedDate.toLocaleDateString()}</h6>
        {todaysAppts.length === 0 && <div className="small text-muted">Aucun rendez-vous pour cette date.</div>}
        {todaysAppts.map(a => (
          <div key={a.id} className="appt-item d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">{a.time} — {a.guestName}</div>
              <div className="small text-muted">{a.note} • property: {a.propertyId}</div>
            </div>
            <div className="appt-actions small text-muted">#{a.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
