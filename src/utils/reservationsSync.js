export async function syncReservationsFromServer(providedReservations = null) {
  try {
    const base = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
    const url = base ? `${base}/api/reservations` : '/api/reservations';
    const token = localStorage.getItem('ndaku_auth_token') || localStorage.getItem('token') || null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let reservations = providedReservations;
    if (!Array.isArray(reservations)) {
      const resp = await fetch(url, { headers });
      if (!resp.ok) return null;
      reservations = await resp.json();
    }

    if (!Array.isArray(reservations)) return null;

    // Extract property ids (reservation.property may be populated object or an id)
    const ids = reservations
      .map(r => {
        if (!r) return null;
        if (r.property) {
          if (typeof r.property === 'string') return r.property;
          if (r.property._id) return r.property._id;
          if (r.property.id) return r.property.id;
        }
        // fallback: try r.propertyId or r.property_id
        if (r.propertyId) return r.propertyId;
        if (r.property_id) return r.property_id;
        return null;
      })
      .filter(Boolean)
      .map(String);

    // Save unique ids to localStorage
    const unique = Array.from(new Set(ids));
    try {
      localStorage.setItem('reserved_properties', JSON.stringify(unique));
    } catch (e) {
      console.warn('Failed to persist reserved_properties', e);
    }

    // Dispatch a sync event with the list so UI can react
    try {
      window.dispatchEvent(new CustomEvent('reserved_properties_synced', { detail: { reserved: unique } }));
    } catch (e) {
      // ignore
    }

    return unique;
  } catch (err) {
    console.warn('syncReservationsFromServer error', err);
    return null;
  }
}
