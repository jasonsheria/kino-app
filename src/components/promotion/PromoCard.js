import React from 'react';
import './PromoCard.css';
import { agents as runtimeAgents } from '../../data/fakedata';
import { formatPromo } from '../../data/fakedataPromotions';

const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');

// Utilitaire de sécurité pour garantir des chaînes de caractères
const safeStr = (v) => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
};

async function fetchAgentById(id) {
  if (!id) return null;
  const found = runtimeAgents.find(a => a && (a.id === id || a._id === id));
  if (found) return found;
  try {
    if (!API_BASE) return null;
    const res = await fetch(`${API_BASE}/api/agents/${id}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data && (data.data || data)) || null;
  } catch (err) { return null; }
}

function waitForAgentInRuntime(id, timeout = 2500) {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    const found = runtimeAgents.find(a => a && (a.id === id || a._id === id));
    if (found) return resolve(found);

    let resolved = false;
    const onUpdate = () => {
      const f = runtimeAgents.find(a => a && (a.id === id || a._id === id));
      if (f) {
        resolved = true;
        window.removeEventListener('ndaku:agents-updated', onUpdate);
        resolve(f);
      }
    };
    window.addEventListener('ndaku:agents-updated', onUpdate);
    setTimeout(async () => {
      if (resolved) return;
      window.removeEventListener('ndaku:agents-updated', onUpdate);
      const fetched = await fetchAgentById(id);
      resolve(fetched);
    }, timeout);
  });
}

const PromoCard = ({ promo: initialPromo }) => {
  const [promo, setPromo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const base = initialPromo && initialPromo.raw ? initialPromo.raw : initialPromo || {};
        const formatted = formatPromo(base) || {};

        if (formatted.agent && typeof formatted.agent === 'string') {
          const resolved = await waitForAgentInRuntime(formatted.agent, 2400);
          if (mounted) setPromo({ ...formatted, agent: resolved || null });
        } else if (formatted.agent && typeof formatted.agent === 'object') {
          const id = formatted.agent.id || formatted.agent._id;
          if (id) {
            const resolved = runtimeAgents.find(a => a && (a.id === id || a._id === id));
            if (mounted) setPromo({ ...formatted, agent: resolved ? { ...resolved, ...formatted.agent } : formatted.agent });
          } else {
            if (mounted) setPromo(formatted);
          }
        } else {
          if (mounted) setPromo(formatted);
        }
      } catch (err) {
        if (mounted) setPromo(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [initialPromo]);

  if (loading || !promo) {
    return (
      <div className="promo-card-wrapper">
        <div className="promo-card" aria-busy="true">
          <div className="promo-image-wrapper" style={{display:'flex',alignItems:'center',justifyContent:'center', height: 200}}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calcul du pourcentage sécurisé
  const discountPercent = (promo.price && promo.originalPrice) 
    ? Math.round(((Number(promo.originalPrice) - Number(promo.price)) / Number(promo.originalPrice)) * 100)
    : 0;

  return (
    <div className="promo-card-wrapper">
      <article className="promo-card">
        {promo.promotion && <div className="promo-badge-hot hot" style={{left:12,top:12}}>Offre</div>}
        
        <div className="promo-image-wrapper">
          <img src={promo.image || ''} alt={safeStr(promo.title)} className="promo-image" />
          {discountPercent > 0 && (
            <div className="promo-discount-badge">
              <div className="badge-content">
                <div className="badge-percent">-{discountPercent}%</div>
                <div className="badge-save">Économisez</div>
              </div>
            </div>
          )}
        </div>

        <div className="promo-content">
          <h3 className="promo-title text-capitalize">{safeStr(promo.title)}</h3>
          
          <div className="promo-price-section">
            {promo.originalPrice && (
              <div className="promo-old-price">
                ${Number(promo.originalPrice).toLocaleString()}
              </div>
            )}
            {promo.price && (
              <div className="promo-new-price">
                ${Number(promo.price).toLocaleString()}
              </div>
            )}
            {discountPercent > 0 && <div className="promo-savings">-{discountPercent}%</div>}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginTop: 15}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <img 
                src={promo.agent?.image || promo.agent?.photo || ''} 
                alt="Agent" 
                style={{width:44,height:44,borderRadius:22,objectFit:'cover', background: '#eee'}} 
              />
              <div>
                <div style={{fontWeight:800,color:'#0b2f3a', fontSize: '0.9rem'}}>
                  {safeStr(promo.agent?.prenom || promo.agent?.name || 'Agent Ndaku')}
                </div>
              </div>
            </div>
            
            <div style={{display:'flex',gap:8}}>
              <button className="promo-action-btn promo-action-primary">Voir</button>
              <button className="promo-action-btn">Réserver</button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PromoCard;