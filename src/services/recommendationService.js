// Lightweight recommendation & event-tracking service with network-first, local-fallback behavior

import { properties as fakeProperties } from '../data/fakedata';
import { vehicles as fakeVehicles } from '../data/fakedataVehicles';

const EVENTS_KEY = 'ndaku_pending_events';
const HISTORY_KEY = 'ndaku_filter_history';
let _syncIntervalId = null;
let _onlineHandler = null;
const SYNC_INTERVAL_MS = 30 * 1000; // try every 30s

async function trackEvent(event) {
  // try to POST to backend, otherwise queue locally
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('server rejected');
    return true;
  } catch (e) {
    try {
      const raw = localStorage.getItem(EVENTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(event);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(arr.slice(0, 200))); // cap
    } catch (er) { console.error('ndaku: trackEvent fallback failed', er); }
    return false;
  }
}

// Read queued events from localStorage
function getPendingEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

// Attempt to flush queued events to server. Will stop on first network/server error
async function flushPendingEvents() {
  const pending = getPendingEvents();
  if (!pending || !pending.length) return { sent: 0, remaining: 0 };
  const remaining = [];
  let sent = 0;
  for (let i = pending.length - 1; i >= 0; i--) {
    const ev = pending[i];
    try {
      const res = await fetch('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ev)
      });
      if (!res.ok) throw new Error('server rejected');
      sent += 1;
    } catch (e) {
      // network down or server error: keep remaining items (including current + earlier)
      remaining.push(...pending.slice(0, i + 1));
      break;
    }
  }
  try {
    if (remaining.length) localStorage.setItem(EVENTS_KEY, JSON.stringify(remaining.slice(0, 200)));
    else localStorage.removeItem(EVENTS_KEY);
  } catch (e) { console.error('ndaku: flushPendingEvents save failed', e); }
  return { sent, remaining: remaining.length };
}

function startEventSync(options = {}) {
  // idempotent
  try {
    if (_syncIntervalId) return;
    // try immediately
    flushPendingEvents().catch(() => {});
    // on online event
    _onlineHandler = async () => { try { await flushPendingEvents(); } catch (e) {} };
    window.addEventListener('online', _onlineHandler);
    // periodic background attempt
    _syncIntervalId = setInterval(() => { flushPendingEvents().catch(() => {}); }, options.intervalMs || SYNC_INTERVAL_MS);
  } catch (e) {
    console.error('ndaku: startEventSync failed', e);
  }
}

function stopEventSync() {
  try {
    if (_syncIntervalId) { clearInterval(_syncIntervalId); _syncIntervalId = null; }
    if (_onlineHandler) { window.removeEventListener('online', _onlineHandler); _onlineHandler = null; }
  } catch (e) { console.error('ndaku: stopEventSync failed', e); }
}

function pushFilterHistory(filter) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const h = raw ? JSON.parse(raw) : [];
    h.unshift({ filter, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 200)));
  } catch (e) { console.error('ndaku: pushFilterHistory', e); }
}

function buildProfile(history) {
  const profile = { types: {}, communes: {}, priceAvg: null, rooms: {}, totalWeight: 0 };
  const now = Date.now();
  history.forEach(item => {
    const ageHours = Math.max(1, (now - item.ts) / (1000 * 60 * 60));
    const weight = 1 / Math.log2(1 + ageHours);
    const f = item.filter || {};
    if (f.type) profile.types[f.type] = (profile.types[f.type] || 0) + weight;
    if (f.commune) profile.communes[f.commune] = (profile.communes[f.commune] || 0) + weight;
    if (f.priceMin || f.priceMax) {
      const pMin = Number(f.priceMin) || 0;
      const pMax = Number(f.priceMax) || (profile.priceAvg || pMin || 0);
      const mid = (pMin + pMax) / 2;
      profile.priceAvg = (profile.priceAvg ? (profile.priceAvg * profile.totalWeight + mid * weight) : (mid * weight)) / (profile.totalWeight + weight);
    }
    if (f.chambres) profile.rooms[f.chambres] = (profile.rooms[f.chambres] || 0) + weight;
    profile.totalWeight += weight;
  });
  return profile;
}

function scoreItem(it, profile) {
  let score = 0;
  if (!profile) return 0;
  if (it.type && profile.types[it.type]) score += profile.types[it.type] * 2;
  if (it.address) {
    const commune = (it.address.split(',').map(s => s.trim()).slice(-2)[0]);
    if (commune && profile.communes[commune]) score += profile.communes[commune] * 1.8;
  }
  if (profile.priceAvg && it.price) {
    const diff = Math.abs(it.price - profile.priceAvg);
    score += Math.max(0, 2 - (diff / (profile.priceAvg + 1)));
  }
  if (it.chambres && profile.rooms[String(it.chambres)]) score += profile.rooms[String(it.chambres)] * 1.2;
  return score;
}

async function getRecommendations(items = [], opts = {}) {
  // try server first
  try {
    const payload = { itemIds: items.map(i => i.id), userId: opts.userId || null, limit: opts.limit || 12 };
    const res = await fetch('/api/recommendations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      // server should return array of { id, score }
      if (Array.isArray(data) && data.length) {
        const idToScore = new Map();
        data.forEach(r => idToScore.set(r.id, r.score || 0));
        return items.slice().sort((a, b) => (idToScore.get(b.id) || 0) - (idToScore.get(a.id) || 0));
      }
      if (data.recommendations && Array.isArray(data.recommendations)) {
        const order = data.recommendations;
        const byId = new Map(items.map(i => [i.id, i]));
        return order.map(id => byId.get(id)).filter(Boolean);
      }
    }
  } catch (e) {
    // network/server down -> fallback
    // console.warn('ndaku: recommendations server error', e);
  }

  // Local fallback: use profile from filter history
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const profile = buildProfile(history);
    const scored = items.map(it => ({ it, s: scoreItem(it, profile) }));
    scored.sort((a, b) => b.s - a.s);
    return scored.map(x => x.it);
  } catch (e) {
    console.error('ndaku: fallback recommendation failed', e);
  }

  // ultimate fallback: return items unchanged or use fakedata if items empty
  if (!items || !items.length) {
    const pool = opts.kind === 'vehicles' ? fakeVehicles : fakeProperties;
    return pool.slice(0, opts.limit || 12);
  }
  return items;
}

export default {
  trackEvent,
  pushFilterHistory,
  getRecommendations
};

// additional APIs for background sync
export { getPendingEvents, flushPendingEvents, startEventSync, stopEventSync };
