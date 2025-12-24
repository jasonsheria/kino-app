// Données factices pour tests
export const properties = [
 
];

export const agents = [
];
export const reservation = [];

export const owners = [
];

export const messages = [
];

export const articles = [
  {
    id: 'a1',
    slug: 'guide-achat-immobilier',
    title: "Guide d'achat immobilier",
    excerpt: "6 conseils pour acheter un bien à Kinshasa",
    image: require('../img/property-3.jpg'),
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 10
  },
  {
    id: 'a2',
    slug: 'mettre-en-vente',
    title: "Comment mettre en vente rapidement",
    excerpt: "Astuce et checklist pour une mise en vente efficace",
    image: require('../img/carousel-1.jpg'),
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 20
  },
  {
    id: 'a3',
    slug: 'choisir-un-agent',
    title: "Choisir le bon agent immobilier",
    excerpt: "Critères pour sélectionner un agent de confiance",
    image: require('../img/carousel-2.jpg'),
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 30
  }
];



export const users = [

];

export const subscriptions = [
  { id: 1, name: "Basic", price: 0, features: ["Publier 1 bien"] },
  { id: 2, name: "Pro", price: 29, features: ["Publier 10 biens", "Mise en avant"] },
];

// --- Runtime replacement with real server data (non-blocking) ---
// This module exports mutable arrays. On module load we try to fetch
// real data from the backend and replace the arrays in-place so
// other modules that imported these arrays see the updated values.

export async function preloadAgents(timeoutMs = 4000) {
  // Pre-load agents from backend with a timeout; resolve when agents arrive or timeout expires
  return new Promise(resolve => {
    if (agents && agents.length > 0) return resolve(agents); // already loaded
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(agents);
      }
    }, timeoutMs);
    // Check if agents have arrived periodically
    const check = setInterval(() => {
      if (agents && agents.length > 0) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          clearInterval(check);
          resolve(agents);
        }
      }
    }, 200);
  });
}

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
      // Try multiple storage keys for the auth token to be tolerant across app versions
      const token = localStorage.getItem('ndaku_auth_token') || localStorage.getItem('ndaku-token') || localStorage.getItem('token') || localStorage.getItem('auth_token') || null;
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
          id: p._id || p.id || p.propertyId || p.pid || String(Math.random()),
          name: p.name || p.label || '',
          title: p.title || p.name || '',
          description: p.description || p.excerpt || '',
          type: p.type || p.category || '',
          price: p.prix || p.amount || 0,
          address: p.adresse || p.location || (p.addressLine ? `${p.addressLine}` : ''),
          images: Array.isArray(p.images) ? p.images.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (p.image ? [p.image] : []),
          videos: Array.isArray(p.videos) ? p.videos.map(v => (typeof v === 'string' ? v : (v.url || v.path || ''))) : (p.video ? [p.video] : []),
          agentId: p.agent || p.agentId || null,
          agent: p.agent || null,
          geoloc: p.geoloc || p.location || p.coords || null,
          status: p.status || p.availability || '',
          visitFee: p.visitFee || p.fee || 0,
          chambres: p.chambres || p.bedrooms || 0,
          douches: p.douches || p.bathrooms || 0,
          salon: p.salon || p.livingRooms || 0,
          cuisine: p.cuisine || p.kitchens || 0,
          sdb: p.salles_de_bain || p.baths || 0,
          superficie: p.superficie || p.area || p.size || null,
          commune: p.commune || '',
          ville: p.ville || '',
          pays: p.pays || 'RDC',
          promotion : p.promotion,
          promoPrice : p.promoPrice,
          promoStart : p.promoStart,
          promoEnd : p.promoEnd,
        }));
        // inplace replace
        properties.splice(0, properties.length, ...mapped);
        // notify listeners
        try { window.dispatchEvent(new CustomEvent('ndaku:properties-updated', { detail: { properties: mapped } })); } catch (e) { }
      } else {
        // No properties received - log and notify UI with tried urls
        // don't block UI with alert by default; keep console and event for app to show toast
      }
      // reservation endpoint api/reservation
      const reservationsUrl = `${API_BASE}/api/reservations?site=${process.env.REACT_APP_SITE_ID}`;
      try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const reservationsResp = await fetch(reservationsUrl, { headers });
        if (!reservationsResp.ok) {
          const r = reservationsResp;
          // Log 401/403 explicitly to help debug missing/expired tokens
          if (r.status === 401 || r.status === 403) {
            // do not throw to allow app to continue with fake data
            throw new Error(`Unauthorized ${r.status}`);
          }
          throw new Error(`HTTP ${r.status} ${r.statusText}`);
        }
        const reservationsRespData = await reservationsResp.json();
        const rawReservations = reservationsRespData && (Array.isArray(reservationsRespData) ? reservationsRespData : reservationsRespData.data || reservationsRespData.items) || reservationsRespData || null;
        if (rawReservations && Array.isArray(rawReservations) && rawReservations.length > 0) {
          const mappedReservations = rawReservations.map(r => ({
            id: r._id || r.id,
            propertyId: r.propertyId || r.property || null,
            userId: r.userId || r.user || null,
            startDate: r.date || r.start_date || null,
            // endDate may be startDate plus 1 week for single-day bookings
            // endDate: startDate + (r.endDate || r.end_date || null ? (new Date(r.endDate || r.end_date)).getTime() : (r.date || r.start_date ? (new Date(r.date || r.start_date)).getTime() + 7 * 24 * 60 * 60 * 1000 : null)),
            time: r.time || null,
            status: r.status || 'pending',
            amount: r.amount || r.prix || 0,
            createdAt: r.createdAt || r.created_at || null,
            updatedAt: r.updatedAt || r.updated_at || null,
          }));
          reservation.splice(0, reservation.length, ...mappedReservations);
          try { window.dispatchEvent(new CustomEvent('ndaku:reservations-updated', { detail: { reservations: mappedReservations } })); } catch (e) { }
        }
      } catch (err) {
        // silent
      }

      // agents endpoint may also be under /api/agents; prefer user-scoped /api/agents/me using auth token
      const tryAgentUrls = [`${API_BASE}/api/agents?site=${process.env.REACT_APP_SITE_ID}`, `${API_BASE}/agents?site=${process.env.REACT_APP_SITE_ID}`];
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
      console.log("agents recuperer au serveur ,", rawAgents)
      if (rawAgents && Array.isArray(rawAgents) && rawAgents.length > 0) {
        const mappedAgents = rawAgents.map(a => ({
          id: a._id || a.id,
          name: a.name || a.fullName || a.username || '',
          prenom: a.prenom || '',
          address: a.address || a.location || '',
          email: a.email || '',
          phone: a.phone || a.telephone || '',
          whatsapp: a.telephone || a.phone || a.whatsapp || '',
          facebook: a.facebook || '',
          photo: a.image || a.avatar || '',
          image: a.image || '',
          status: a.status || 'Actif',
          subscription: a.subscription || 'Basic',
          geoloc: a.geoloc || a.location || null,
          busyDates: a.busyDates || [],
          properties: a.properties || []
        }));
        agents.splice(0, agents.length, ...mappedAgents);
        console.log("fakedata.js - loaded live agents:", mappedAgents);
        try { window.dispatchEvent(new CustomEvent('ndaku:agents-updated', { detail: { agents: mappedAgents } })); } catch (e) { }
      }

      // Try loading articles/posts from backend and replace exported `articles` when available
      try {
        const tryPostUrls = [`${API_BASE}/api/posts`, `${API_BASE}/api/articles`, `${API_BASE}/posts`];
        let postsResp = null;
        for (const u of tryPostUrls) {
          try {
            const r = await fetch(u, { credentials: 'include' });
            if (!r.ok) continue;
            try { postsResp = await r.json(); } catch (e) { postsResp = null; }
          } catch (e) { postsResp = null; }
          if (postsResp) break;
        }
        const rawPosts = postsResp && (Array.isArray(postsResp) ? postsResp : postsResp.data || postsResp.items) || null;
        if (rawPosts && Array.isArray(rawPosts) && rawPosts.length > 0) {
          const mappedPosts = rawPosts.slice(0, 10).map(p => ({
            id: p._id || p.id,
            slug: p.slug || p._id || p.id || String(Math.random()),
            title: p.title || p.titre || p.name || '',
            excerpt: p.excerpt || p.summary || p.description || '',
            image: (p.image || (Array.isArray(p.images) && p.images[0]) || null),
            publishedAt: p.publishedAt || p.createdAt || Date.now()
          }));
          articles.splice(0, articles.length, ...mappedPosts);
          try { window.dispatchEvent(new CustomEvent('ndaku:articles-updated', { detail: { articles: mappedPosts } })); } catch (e) { }
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      // silent
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
const PLACEHOLDER_IMG = require('../img/property-1.jpg');

function formatPromo(p) {
  try {
    if (!p) return null;
    const id = p.id || p._id || p.pid || String(Math.random());
    const title = p.titre || p.title || p.name || p.nom || 'Annonce';
  const image = (Array.isArray(p.images) && p.images.length && (typeof p.images[0] === 'string')) ? p.images[0] : (p.image && (typeof p.image === 'string') ? p.image : PLACEHOLDER_IMG);
  const promoPrice = (p.promoPrice != null && p.promoPrice !== '') ? Number(p.promoPrice) : (p.prix || p.price || 0);
  // Normalize agent field: accept p.agent (object or id), p.agentId, or p.agents (array)
  let agentVal = null;
  if (Array.isArray(p.agents) && p.agents.length) {
    agentVal = p.agents[0];
  } else if (p.agent != null) {
    agentVal = p.agent;
  } else if (p.agentId != null) {
    agentVal = p.agentId;
  }

  // If agentVal is an id (string/number), try to resolve to an object from runtime `agents` array
  let resolvedAgent = null;
  if (agentVal && typeof agentVal === 'object') {
    resolvedAgent = agentVal;
  } else if (agentVal != null) {
    const aid = String(agentVal);
    resolvedAgent = agents.find(a => a && (String(a.id) === aid || String(a._id) === aid));
  }

  return {
    id,
    title,
    image,
    agent: resolvedAgent || null,
    originalPrice: p.prix || p.price || 0,
    price: promoPrice,
    promotion: !!p.promotion,
    promoStart: p.promoStart || null,
    promoEnd: p.promoEnd || null,
    promoComment: p.promoComment || p.promo_comment || '',
    adresse : p.adresse || p.address || 'Adresse non disponible',
    commune : p.commune || p.city || '',
    location : p.location || '',
    quartier : p.quartier || '',
    raw: p

  };
  } catch (err) {
    // log and return null so callers can filter it out
    // eslint-disable-next-line no-console
    console.error('[formatPromo] failed to format promo item', { error: err && err.message, item: p && (p._id || p.id) });
    return null;
  }
}

// Return up to `limit` promotions coming from local `properties` filtered by `promotion: true`.
export function getLocalPromotions({ limit = 10, offset = 0 } = {}) {
  try {
    const promos = (properties || []).filter(p => p && (p.promotion === true)).slice(offset, offset + limit).map(formatPromo).filter(Boolean);
    // eslint-disable-next-line no-console
    console.debug('[getLocalPromotions] returning', { count: promos.length, offset, limit });
    return promos;
  } catch (e) { return []; }
}

// Attempt to fetch more promotions from backend; fallback to local data if the server is not available.
export async function fetchMorePromotionsFromServer({ offset = 0, limit = 20, noFallback = false } = {}) {
  const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
  if (!API_BASE) {
    // no backend configured — return local slice or nothing depending on noFallback
    // eslint-disable-next-line no-console
    console.debug('[fetchMorePromotionsFromServer] no API_BASE, noFallback=', noFallback);
    return noFallback ? [] : getLocalPromotions({ offset, limit });
  }

  try {
    const url = `${API_BASE}/api/mobilier/promotions?limit=${limit}&offset=${offset}`;
    // eslint-disable-next-line no-console
    console.debug('[fetchMorePromotionsFromServer] fetching', { url, offset, limit, noFallback });
    const res = await fetch(url, { credentials: 'include' });
    // eslint-disable-next-line no-console
    console.debug('[fetchMorePromotionsFromServer] response', { status: res.status, ok: res.ok });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('[fetchMorePromotionsFromServer] server returned non-ok', { status: res.status, url });
      return noFallback ? [] : getLocalPromotions({ offset, limit });
    }
    const data = await res.json();
    // backend may return array or { data: [] }
    const items = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
    // eslint-disable-next-line no-console
    console.debug('[fetchMorePromotionsFromServer] received items', { count: items.length, sample: items && items[0] ? (items[0]._id || items[0].id || items[0].pid || '(object)') : null });
    // Ensure agents are loaded so we can resolve agent objects for promotions
    try { await preloadAgents(3000); } catch (e) { /* ignore */ }
    return items.map(i => {
      // map server object to our promo format conservatively
      const p = i.property || i; // some endpoints may wrap
   
      const agent = agents.filter(a =>a.id === (p.agentId || p.agent || null))
    
      console.log('promotion in fakdataPromotions',p);
      const dat= formatPromo({
        id: p._id || p.id,
        titre: p.titre || p.title || p.name,
        images: p.images || p.photos || p.imagesArray || [],
        agent: agent[0],
        prix: p.prix || p.price || 0,
        promoPrice: p.promoPrice || p.promo_price || null,
        promotion: p.promotion === true || i.promotion === true,
        promoStart: p.promoStart || p.promo_start || null,
        promoEnd: p.promoEnd || p.promo_end || null,
        promoComment: p.promoComment || p.promo_comment || i.comment || [],
        adresse : p.adresse || p.address || 'Adresse non disponible',
        commune : p.commune || p.city || '',
        location : p.location || '',
        quartier : p.quartier || '',
        

      });
      console.log("formatted promotion",dat);
      return dat;
      
    }).filter(Boolean).slice(0, limit);
    
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[fetchMorePromotionsFromServer] fetch failed', { error: err && err.message });
    return noFallback ? [] : getLocalPromotions({ offset, limit });
  }
  
}
export default {
  getLocalPromotions,
  fetchMorePromotionsFromServer,
  formatPromo
};