import React, { useMemo, useState, useEffect, useRef } from 'react';
import recService from '../../services/recommendationService';

// Generic filter bar for property-like lists. Auto-detects available fields.
// Props:
// - items: array of objects to derive options from
// - onChange: function(filters) called when filters change
// - defaultFilters: optional initial filters
const PropertyFilterBar = ({ items = [], onChange = () => {}, defaultFilters = {} }) => {
  const defaultState = { commune: 'Toutes', chambres: 'Tous', sdb: 'Tous', salon: 'Tous', cuisine: 'Tous', priceMin: '', priceMax: '', scoreMin: '', proximityKm: '', sort: 'relevance' };
  const [filters, setFilters] = useState({ ...defaultState, ...defaultFilters });

  // initialize from URL query params
  useEffect(() => {
    try{
      const params = new URLSearchParams(window.location.search);
      const q = {};
      ['commune','chambres','sdb','salon','cuisine','priceMin','priceMax','sort','scoreMin','proximityKm'].forEach(k => {
        if(params.has(k)) q[k] = params.get(k);
      });
      if(Object.keys(q).length) setFilters(f => ({ ...f, ...q }));
    }catch(e){/* ignore */}
  }, []);

  // derive communes
  const communes = useMemo(() => {
    try {
      const all = items.map(p => (p.address || '').split(',').map(s => s.trim()).slice(-2)[0]).filter(Boolean);
      return Array.from(new Set(all));
    } catch (e) { return []; }
  }, [items]);

  // detect which numeric fields exist in dataset
  const hasField = (field) => items.some(i => i[field] !== undefined && i[field] !== null);
  const hasGeoloc = items.some(i => i.geoloc && typeof i.geoloc.lat === 'number' && typeof i.geoloc.lng === 'number');

  // sync to URL and emit change
  const firstMount = useRef(true);
  useEffect(() => {
    try{
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => {
        const val = filters[k];
        if(val !== undefined && val !== null && val !== '' && String(val) !== String(defaultState[k])){
          params.set(k, val);
        }
      });
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, '', newUrl);
    }catch(e){}
    onChange(filters);

    // push to rec history and track event (but avoid pushing on initial mount when we loaded from URL)
    if(firstMount.current){ firstMount.current = false; return; }
    try{
      recService.pushFilterHistory(filters);
      recService.trackEvent({ type: 'filter', payload: filters, ts: Date.now() });
    }catch(e){/* ignore */}
  }, [filters]);

  const reset = () => setFilters({ commune: 'Toutes', chambres: 'Tous', sdb: 'Tous', salon: 'Tous', cuisine: 'Tous', priceMin: '', priceMax: '', sort: 'relevance' });

  const clearFilter = (key) => setFilters(f => ({ ...f, [key]: defaultState[key] }));

  // Auto geolocation: request once and store for proximity recommendations
  useEffect(()=>{
    if(!hasGeoloc) return;
    try{
      const asked = localStorage.getItem('ndaku_geo_asked');
      const stored = localStorage.getItem('ndaku_user_location');
      if(stored || asked) return; // already have or asked
      localStorage.setItem('ndaku_geo_asked', '1');
      // small non-blocking toast to notify user we will request location
      const notice = document.createElement('div');
      notice.style.position = 'fixed';
      notice.style.top = '18px';
      notice.style.left = '18px';
      notice.style.zIndex = 4000;
      notice.style.background = 'linear-gradient(90deg,#fff,#f7fff9)';
      notice.style.border = '1px solid rgba(2,6,23,0.06)';
      notice.style.padding = '10px 12px';
      notice.style.borderRadius = '10px';
      notice.style.boxShadow = '0 6px 18px rgba(2,6,23,0.12)';
      notice.innerText = 'Utilisation de votre position pour améliorer les recommandations (permission requise)';
      document.body.appendChild(notice);
      setTimeout(()=>{ if(notice.parentNode) notice.parentNode.removeChild(notice); }, 4800);
      // after a short delay, request geolocation (this triggers browser permission dialog)
      setTimeout(()=>{
        if(navigator && navigator.geolocation){
          navigator.geolocation.getCurrentPosition(pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            localStorage.setItem('ndaku_user_location', JSON.stringify(loc));
            try{ recService.trackEvent({ type: 'location', payload: loc, ts: Date.now() }); }catch(e){}
          }, err => {
            // ignore errors but track
            try{ recService.trackEvent({ type: 'location_error', payload: { code: err.code, message: err.message }, ts: Date.now() }); }catch(e){}
          }, { enableHighAccuracy: false, maximumAge: 60*60*1000, timeout: 10000 });
        }
      }, 800);
    }catch(e){}
  }, []);

  return (
  <div className="card mb-4 p-3" style={{borderRadius:12}}>
      <div className="d-flex flex-wrap align-items-center gap-2">
        {/* Commune */}
        <div style={{minWidth:160}}>
          <label className="form-label small mb-1">Commune</label>
          <select className="form-select form-select-sm" value={filters.commune} onChange={e => setFilters(f => ({ ...f, commune: e.target.value }))}>
            <option value="Toutes">Toutes les communes</option>
            {communes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Bedrooms */}
        {hasField('chambres') && (
          <div style={{minWidth:120}}>
            <label className="form-label small mb-1">Chambres</label>
            <select className="form-select form-select-sm" value={filters.chambres} onChange={e => setFilters(f => ({ ...f, chambres: e.target.value }))}>
              <option value="Tous">Tous</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="3+">3+</option>
            </select>
          </div>
        )}

        {/* Bathrooms */}
        {hasField('douches') && (
          <div style={{minWidth:120}}>
            <label className="form-label small mb-1">Douches / SDB</label>
            <select className="form-select form-select-sm" value={filters.sdb} onChange={e => setFilters(f => ({ ...f, sdb: e.target.value }))}>
              <option value="Tous">Tous</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        )}

        {/* Salon */}
        {hasField('salon') && (
          <div style={{minWidth:120}}>
            <label className="form-label small mb-1">Salon</label>
            <select className="form-select form-select-sm" value={filters.salon} onChange={e => setFilters(f => ({ ...f, salon: e.target.value }))}>
              <option value="Tous">Tous</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        )}

        {/* Cuisine */}
        {hasField('cuisine') && (
          <div style={{minWidth:120}}>
            <label className="form-label small mb-1">Cuisine</label>
            <select className="form-select form-select-sm" value={filters.cuisine} onChange={e => setFilters(f => ({ ...f, cuisine: e.target.value }))}>
              <option value="Tous">Tous</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        )}

        {/* Price range */}
        {hasField('price') && (
          <div style={{minWidth:220}}>
            <label className="form-label small mb-1">Prix (min / max)</label>
            <div className="d-flex gap-2">
              <input className="form-control form-control-sm" placeholder="Min" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))} />
              <input className="form-control form-control-sm" placeholder="Max" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Score */}
        {hasField('score') && (
          <div style={{minWidth:120}}>
            <label className="form-label small mb-1">Score min</label>
            <input className="form-control form-control-sm" placeholder="ex: 70" value={filters.scoreMin} onChange={e => setFilters(f => ({ ...f, scoreMin: e.target.value }))} />
          </div>
        )}

        {/* Proximity */}
        {hasGeoloc && (
          <div style={{minWidth:160}}>
            <label className="form-label small mb-1">Proximité (km)</label>
            <input className="form-control form-control-sm" placeholder="Max km (ex: 5)" value={filters.proximityKm} onChange={e => setFilters(f => ({ ...f, proximityKm: e.target.value }))} />
          </div>
        )}

        {/* Sort / score */}
        <div style={{minWidth:160}}>
          <label className="form-label small mb-1">Trier par</label>
          <select className="form-select form-select-sm" value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
            <option value="relevance">Pertinence</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="score">Score</option>
          </select>
        </div>

        <div className="ms-auto d-flex gap-2 align-items-end">
          <button className="btn btn-sm btn-outline-secondary" onClick={reset}>Réinitialiser</button>
        </div>
      </div>
      {/* Active filter chips */}
      <div className="filter-chips mt-3">
        {Object.keys(filters).map(k => {
          const v = filters[k];
          if(v === undefined || v === null || v === '' || String(v) === String(defaultState[k])) return null;
          let label = `${k}: ${v}`;
          if(k === 'priceMin' || k === 'priceMax') label = `${k === 'priceMin' ? 'Min' : 'Max'}: ${v}`;
          return (
            <span className="filter-chip" key={k}>
              <span className="filter-chip-label">{label}</span>
              <button className="filter-chip-close" onClick={() => clearFilter(k)} aria-label={`Enlever ${k}`}>×</button>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyFilterBar;
