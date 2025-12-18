// Promotions utilitaires — extrait et formate les biens marqués `promotion: true`
import { properties, agents } from './fakedata';

const PLACEHOLDER_IMG = require('../img/property-1.jpg');

function formatPromo(p) {
  try {
    if (!p) return null;
    const id = p.id || p._id || p.pid || String(Math.random());
    const title = p.titre || p.title || p.name || p.nom || 'Annonce';
  const image = (Array.isArray(p.images) && p.images.length && (typeof p.images[0] === 'string')) ? p.images[0] : (p.image && (typeof p.image === 'string') ? p.image : PLACEHOLDER_IMG);
  const promoPrice = (p.promoPrice != null && p.promoPrice !== '') ? Number(p.promoPrice) : (p.prix || p.price || 0);
  return {
    id,
    title,
    image,
    agent: (typeof p.agent === 'object') ? p.agent : (p.agentId || p.agent || null),
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

// Convenience default export
export default {
  getLocalPromotions,
  fetchMorePromotionsFromServer,
  formatPromo
};
