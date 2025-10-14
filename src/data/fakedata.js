// Données factices pour tests
export const properties = [];

export const agents = [
];

export const owners = [
  {
    id: 1,
    name: 'Propriétaire Démo',
    email: 'owner@demo.local',
    phone: '+243 810 000 010',
    preferredAgents: [1, 2], // favoris : utilisera ces agents en priorité dans la sélection
    types: ['Appartement', 'Maison'],
    properties: [],
  }
];

export const messages = [
  {
    id: 1001,
    fromId: 1,
    from: 'Client Test',
    toId: 1, // owner id
    to: 'Propriétaire Démo',
    text: 'Bonjour, je suis intéressé par votre appartement moderne. Est-il toujours disponible ?',
    time: Date.now() - 1000 * 60 * 60 * 24,
    read: false,
    channel: 'web'
  },
  {
    id: 1002,
    fromId: 2,
    from: 'Marie Mbala',
    toId: 1,
    to: 'Propriétaire Démo',
    text: 'Pouvez-vous partager plus de photos de la villa ?',
    time: Date.now() - 1000 * 60 * 60 * 2,
    read: false,
    channel: 'web'
  },
  {
    id: 1003,
    fromId: 3,
    from: 'Patrick Ilunga',
    toId: 2,
    to: 'Autre propriétaire',
    text: 'Test message qui ne concerne pas ce propriétaire',
    time: Date.now() - 1000 * 60 * 30,
    read: true,
    channel: 'web'
  }
];

export const users = [
  {
    id: 1,
    name: "Client Test",
    email: "client@test.com",
    role: "user",
    properties: [],
    subscription: "basic",
  },
];

export const subscriptions = [
  { id: 1, name: "Basic", price: 0, features: ["Publier 1 bien"] },
  { id: 2, name: "Pro", price: 29, features: ["Publier 10 biens", "Mise en avant"] },
];

// --- Runtime replacement with real server data (non-blocking) ---
// This module exports mutable arrays. On module load we try to fetch
// real data from the backend and replace the arrays in-place so
// other modules that imported these arrays see the updated values.
(() => {
  const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL).replace(/\/$/, '');

  async function safeFetchJSON(url) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      // ignore - we keep fake data
      return null;
    }
  }

  // Fetch properties and agents in background and mutate exported arrays
  (async () => {
    try {
      // try Mobilier endpoints first (backend exposes mobilier controller), then properties paths
      const tryUrls = [`${API_BASE}/api/mobilier`];
      let propsResp = null;
      let triedUrl = null;
      for (const u of tryUrls) {
        triedUrl = u;
        try {
          const r = await fetch(u, { credentials: 'include' });
          if (!r.ok) {
            // capture body text to help debugging 404/500
            let bodyText = null;
            try { bodyText = await r.text(); } catch(e) { bodyText = null; }
            console.warn(`ndaku:fakedata - non-ok response from ${u}: ${r.status} ${r.statusText}`, bodyText ? { bodyText } : null);
            continue;
          }
          // try parse json
          try { propsResp = await r.json(); } catch(e) { propsResp = null; }
          if (propsResp) break;
        } catch (e) {
          console.warn(`ndaku:fakedata - fetch failed for ${u}:`, e?.message || e);
          propsResp = null;
        }
      }
      // backend might return { data: [...] } or an array directly
      const rawProps = propsResp && (Array.isArray(propsResp) ? propsResp : propsResp.data || propsResp.properties) || null;
      if (rawProps && Array.isArray(rawProps) && rawProps.length > 0) {
        // map to expected front-end shape
        const mapped = rawProps.map(p => ({
          id: p._id || p.id || p.propertyId || p.pid || String(Math.random()),
          name: p.name || p.label || '',
          title: p.title || p.name || '',
          description: p.description || p.excerpt || '',
          type: p.type || p.category || '',
          price: p.prix || p.amount || 0,
          address: p.adresse || p.location || (p.addressLine ? `${p.addressLine}` : ''),
          images: Array.isArray(p.images) ? p.images.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (p.image ? [p.image] : []),
          agentId:  p.agent  || p.agentId || null,
          agent : p.agent || null,
          geoloc: p.geoloc || p.location || p.coords || null,
          status: p.status || p.availability || '',
          visitFee: p.visitFee || p.fee || 0,
          chambres: p.chambres || p.bedrooms || 0,
          douches: p.douches || p.bathrooms || 0,
          salon: p.salons || p.livingRooms || 0,
          cuisine: p.cuisines || p.kitchens || 0,
          sdb: p.salles_de_bain || p.baths || 0,
          superficie: p.superficie || p.area || p.size || null,
          commune : p.commune || '',
          ville : p.ville || '',
          pays : p.pays || 'RDC',
        }));
        // inplace replace
        properties.splice(0, properties.length, ...mapped);
        // notify listeners
        try { window.dispatchEvent(new CustomEvent('ndaku:properties-updated', { detail: { properties: mapped } })); } catch (e) { }
      } else {
        // No properties received - log and notify UI with tried urls
        const errMsg = `ndaku:fakedata - no properties returned (tried ${tryUrls.join(', ')})`;
        try { console.error(errMsg, { triedUrl, response: propsResp }); } catch (e) { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('ndaku:properties-error', { detail: { message: errMsg, triedUrl, triedUrls: tryUrls, response: propsResp } })); } catch (e) { }
        // don't block UI with alert by default; keep console and event for app to show toast
      }

      // agents endpoint may also be under /api/agents; prefer user-scoped /api/agents/me using auth token
      const token = localStorage.getItem('ndaku_auth_token');
      const tryAgentUrls = [`${API_BASE}/api/agents/me`, `${API_BASE}/api/agents`, `${API_BASE}/agents`];
      let agentsResp = null;
      let triedAgentUrl = null;
      for (const u of tryAgentUrls) {
        try {
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const r = await fetch(u, { headers });
          if (!r.ok) continue;
          try { agentsResp = await r.json(); } catch (e) { agentsResp = null; }
        } catch (e) {
          agentsResp = null;
        }
        triedAgentUrl = u;
        if (agentsResp) break;
      }
      const rawAgents = agentsResp && (Array.isArray(agentsResp) ? agentsResp : agentsResp.data || agentsResp.items) || null;
      if (rawAgents && Array.isArray(rawAgents) && rawAgents.length > 0) {
        const mappedAgents = rawAgents.map(a => ({
          id: a._id || a.id,
          name: a.name || a.fullName || a.username || '',
          prenom : a.prenom || '',
          address: a.address || a.location || '',
          email: a.email || '',
          phone: a.phone || a.telephone || '',
          whatsapp: a.whatsapp || '',
          facebook: a.facebook || '',
          photo: a.image || a.avatar || '',
          image : a.image || '',
          status: a.status || 'Actif',
          subscription: a.subscription || 'Basic',
          geoloc: a.geoloc || a.location || null,
          busyDates: a.busyDates || [],
          properties: a.properties || []
        }));
        agents.splice(0, agents.length, ...mappedAgents);
        try { window.dispatchEvent(new CustomEvent('ndaku:agents-updated', { detail: { agents: mappedAgents } })); } catch (e) { }
      } else {
        const errMsg = `ndaku:fakedata - no agents returned (tried ${tryAgentUrls.join(', ')})`;
        try { console.error(errMsg, { triedAgentUrl, response: agentsResp }); } catch (e) { }
        try { window.dispatchEvent(new CustomEvent('ndaku:agents-error', { detail: { message: errMsg, triedUrl: triedAgentUrl, triedUrls: tryAgentUrls, response: agentsResp } })); } catch (e) { }
      }
    } catch (err) {
      // silent
      console.warn('ndaku:fakedata - could not fetch live data', err?.message || err);
    }
  })();

  // Set current user from localStorage if available
  try {
    const tmp = localStorage.getItem('ndaku_user') || localStorage.getItem('ndaku-user') || null;
    if (tmp) {
      const u = JSON.parse(tmp);
      if (u && typeof u === 'object') {
        // Replace exported users array content
        users.splice(0, users.length, { id: u.id || u._id || u.userId || 'me', name: u.name || u.fullName || u.email || 'Utilisateur', email: u.email || '', role: u.role || 'user', properties: u.properties || [] });
        try { window.dispatchEvent(new CustomEvent('ndaku:users-updated', { detail: { users } })); } catch (e) { }
      }
    }
  } catch (err) {
    // ignore
  }
})();
