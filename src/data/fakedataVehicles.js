// Données factices pour véhicules (location/vente)
export const vehicles = [
  
];

// --- Runtime replacement with real server data (non-blocking) ---
// Try to fetch /api/vehicules and replace the exported array in-place so
// other modules that imported `vehicles` see live data.
(async () => {
  try {
    const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
    if (!API_BASE) return;
    const tryUrls = [`${API_BASE}/api/vehicules`, `${API_BASE}/api/vehicules?limit=100`];
    let resp = null;
    for (const u of tryUrls) {
      try {
        const r = await fetch(u, { credentials: 'include' });
        if (!r.ok) continue;
        try { resp = await r.json(); } catch (e) { resp = null; }
        if (resp) break;
      } catch (e) {
        resp = null;
      }
    }
    const raw = resp && (Array.isArray(resp) ? resp : resp.data || resp.items) || null;
    if (raw && Array.isArray(raw) && raw.length) {
      const mapped = raw.map(v => ({
        id: v._id || v.id || String(Math.random()),
        name: v.nom || v.name || v.titre || v.title || '',
        title: v.titre || v.nom || v.title || v.name || '',
        description: v.description || v.excerpt || '',
        type: (v.type || v.category || 'VEHICULES'),
        price: v.prix || v.prix || v.price || v.amount || 0,
        prix: v.prix || v.price || 0,
        status: v.statut || v.status || 'vente',
        address: v.adresse || v.address || '',
        images: Array.isArray(v.images) ? v.images.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (v.image ? [v.image] : []),
        videos: Array.isArray(v.videos) ? v.videos.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (v.video ? [v.video] : []),
        agentId: v.agent || v.agentId || v.agentId || null,
        visitFee: v.fraisVisite || v.visitFee || 0,
        fraisVisite: v.fraisVisite || v.visitFee || 0,
        couleur: v.couleur || v.color || '',
        kilometrage: v.kilometrage || v.km || 0,
        annee: v.annee || v.year || null,
        carburant: v.carburant || v.fuel || '',
        transmission: v.transmission || v.gear || '',
        places: v.places || v.seats || 0,
        geoloc: v.geoloc || v.location || null
      }));
      vehicles.splice(0, vehicles.length, ...mapped);
      try { window.dispatchEvent(new CustomEvent('ndaku:vehicles-updated', { detail: { vehicles: mapped } })); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    // ignore - keep fake data
    console.warn('fakedataVehicles: could not fetch live vehicles', err?.message || err);
  }
})();
