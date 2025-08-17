// Simple API stub to simulate server sync for appointments
const DELAY = 400;

let backend = null;
try{ backend = JSON.parse(localStorage.getItem('ndaku_backend_appts') || 'null'); }catch(e){ backend = null; }
if(!backend){
  backend = {}; // ownerId -> { id: appt }
}

export async function fetchAppointments(ownerId){
  // simulate network
  await new Promise(r => setTimeout(r, DELAY));
  const data = backend[ownerId] ? Object.values(backend[ownerId]) : [];
  return data;
}

export async function saveAppointment(ownerId, appt){
  await new Promise(r => setTimeout(r, DELAY));
  backend[ownerId] = backend[ownerId] || {};
  backend[ownerId][appt.id] = appt;
  localStorage.setItem('ndaku_backend_appts', JSON.stringify(backend));
  return appt;
}

export async function updateAppointment(ownerId, id, patch){
  await new Promise(r => setTimeout(r, DELAY));
  if(!backend[ownerId] || !backend[ownerId][id]) throw new Error('not found');
  backend[ownerId][id] = { ...backend[ownerId][id], ...patch };
  localStorage.setItem('ndaku_backend_appts', JSON.stringify(backend));
  return backend[ownerId][id];
}

export async function deleteAppointment(ownerId, id){
  await new Promise(r => setTimeout(r, DELAY));
  if(!backend[ownerId] || !backend[ownerId][id]) return false;
  delete backend[ownerId][id];
  localStorage.setItem('ndaku_backend_appts', JSON.stringify(backend));
  return true;
}

export function exportAppointmentsCSV(appts){
  if(!appts || !appts.length) return '';
  const keys = ['id','date','time','guestName','propertyId','note','status'];
  const rows = [keys.join(',')].concat(appts.map(a => keys.map(k => '"'+String(a[k]||'')+'"').join(',')));
  return rows.join('\n');
}

export default { fetchAppointments, saveAppointment, updateAppointment, deleteAppointment, exportAppointmentsCSV };
