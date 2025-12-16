// Confirme un rendez-vous et émet une notification
export async function confirmAppointment(ownerId, id) {
  const idx = fakeAppointments.findIndex(a => a.id === id);
  if (idx >= 0) {
    fakeAppointments[idx].status = 'confirmed';
    // Simule une notification à l'utilisateur et au propriétaire
    try {
      window.dispatchEvent(new CustomEvent('ndaku:appointment-confirmed', { detail: { appointment: fakeAppointments[idx] } }));
    } catch (e) {}
    return new Promise(resolve => setTimeout(() => resolve(fakeAppointments[idx]), 100));
  }
  return Promise.reject(new Error('Appointment not found'));
}

// Rejette/annule un rendez-vous et émet une notification
export async function rejectAppointment(ownerId, id) {
  const idx = fakeAppointments.findIndex(a => a.id === id);
  if (idx >= 0) {
    fakeAppointments[idx].status = 'cancelled';
    // Simule une notification à l'utilisateur et au propriétaire
    try {
      window.dispatchEvent(new CustomEvent('ndaku:appointment-rejected', { detail: { appointment: fakeAppointments[idx] } }));
    } catch (e) {}
    return new Promise(resolve => setTimeout(() => resolve(fakeAppointments[idx]), 100));
  }
  return Promise.reject(new Error('Appointment not found'));
}
// Ajoute ou met à jour un rendez-vous dans fakeAppointments
export async function saveAppointment(ownerId, appt) {
  const idx = fakeAppointments.findIndex(a => a.id === appt.id);
  if (idx >= 0) {
    fakeAppointments[idx] = { ...fakeAppointments[idx], ...appt };
  } else {
    fakeAppointments.push(appt);
  }
  // Simule un délai réseau
  return new Promise(resolve => setTimeout(() => resolve(appt), 100));
}

// Met à jour un rendez-vous existant dans fakeAppointments
export async function updateAppointment(ownerId, id, update) {
  const idx = fakeAppointments.findIndex(a => a.id === id);
  if (idx >= 0) {
    fakeAppointments[idx] = { ...fakeAppointments[idx], ...update };
    return new Promise(resolve => setTimeout(() => resolve(fakeAppointments[idx]), 100));
  }
  return Promise.reject(new Error('Appointment not found'));
}
// Fake appointment data per owner (ownerId -> appointments[])
// Each appointment: { id, ownerId, date: ISO date, time, guestName, propertyId, note }
const fakeAppointments = [
  // { id: 'a1', ownerId: 'owner-123', date: '2025-08-18', time: '09:30', guestName: 'Jean Dupont', propertyId: 'p1', note: 'Visite initiale' },
  // { id: 'a2', ownerId: 'owner-123', date: '2025-08-18', time: '14:00', guestName: 'Marie Curie', propertyId: 'p2', note: 'Deuxième visite' },
  // { id: 'a3', ownerId: 'owner-123', date: '2025-08-20', time: '11:00', guestName: 'Paul Martin', propertyId: 'p3', note: 'Visite avec agent' },
  // { id: 'a4', ownerId: 'owner-456', date: '2025-08-19', time: '10:00', guestName: 'Lucie Bernard', propertyId: 'p4', note: 'Contrat' },
  // { id: 'a5', ownerId: 'owner-123', date: '2025-09-02', time: '16:00', guestName: 'Ahmed Salah', propertyId: 'p1', note: 'Relance' }
];
const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL).replace(/\/$/, '');
(async () => {
  try {
    const tryUrls = [`${API_BASE}/api/reservations/owner-reservations`];
    let propsResp = null;
    let triedUrl = null;
    for (const u of tryUrls) {
      triedUrl = u;
      try {
        const token = localStorage.getItem('ndaku_auth_token') || null;
        const r = await fetch(u, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!r.ok) {
          let bodyText = null;
          try { bodyText = await r.text(); } catch (e) { bodyText = null; }
          continue;
        }
        // try parse json
        try { propsResp = await r.json(); } catch (e) { propsResp = null; }
        if (propsResp) break;
      } catch (e) {
        propsResp = null;
      }
    }
    // backend might return { data: [...] } or an array directly
    const rawProps = propsResp && (Array.isArray(propsResp) ? propsResp : propsResp.data || propsResp.properties) || null;
    if (rawProps && Array.isArray(rawProps) && rawProps.length > 0) {
      // map to expected front-end shape
      const mapped = rawProps.map(p => ({
        id: p._id || p.id,
        date: p.date || p.createdAt || p.created_at || null,
        time: p.time || null,
        phone: p.phone || p.contact || '',
        amount: p.amount || p.prix || 0,
        status: p.status || 'pending',
        propertyId: p.propertyId || p.property || null,
        requerent: p.userId || p.user || null,
        createdAt: p.createdAt || p.created_at || null,
        ownerId: p.owner || null,
        note: p.note || p.notes || 'demande de visite',
        name: p.name || (p.user && (p.user.prenom || p.user.name)) || 'Visiteur',
        title : 'visite de propriété'
      }));
      // inplace replace
      fakeAppointments.splice(0, fakeAppointments.length, ...mapped);
      // notify listeners
      try { window.dispatchEvent(new CustomEvent('ndaku:properties-updated', { detail: { fakeAppointments: mapped } })); } catch (e) { }
    } else {
      // No properties received - log and notify UI with tried urls
      // don't block UI with alert by default; keep console and event for app to show toast
    }

  } catch (err) {
    // silent
  }
})();

export function getAppointmentsForOwner(ownerId) {
  console.log(fakeAppointments)
  return fakeAppointments;
}

export default fakeAppointments;
