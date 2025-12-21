import React from 'react';
import './PromoCard.css';
import { agents as runtimeAgents } from '../../data/fakedata';
import { formatPromo } from '../../data/fakedataPromotions';

const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');

async function fetchAgentById(id) {
  if (!id) return null;
  // try runtime agents first
  const found = runtimeAgents.find(a => a && (a.id === id || a._id === id));
  if (found) return found;
  // try backend single-agent endpoint
  try {
    if (!API_BASE) return null;
    const res = await fetch(`${API_BASE}/api/agents/${id}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    const a = (data && (data.data || data)) || null;
    return a;
  } catch (err) {
    return null;
  }
}

// wait for runtimeAgents to populate via global event, then fallback to fetch
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
        return resolve(f);
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
        // format incoming promo into canonical shape
        const base = initialPromo && initialPromo.raw ? initialPromo.raw : initialPromo || {};
        const formatted = formatPromo(base) || {};

        // if agent is a string id, try resolve to object by waiting for runtime or fetching
        if (formatted.agent && typeof formatted.agent === 'string') {
          const resolved = await waitForAgentInRuntime(formatted.agent, 2400);
          if (mounted) setPromo({ ...formatted, agent: resolved || null });
        } else if (formatted.agent && typeof formatted.agent === 'object') {
          // ensure minimal agent fields filled from runtime if possible
          const id = formatted.agent.id || formatted.agent._id;
          if (id) {
            const resolved = runtimeAgents.find(a => a && (a.id === id || a._id === id));
            if (resolved) {
              if (mounted) setPromo({ ...formatted, agent: { ...resolved, ...formatted.agent } });
            } else {
              if (mounted) setPromo(formatted);
            }
          } else {
            if (mounted) setPromo(formatted);
          }
        } else {
          if (mounted) setPromo(formatted);
        }
      } catch (err) {
        if (mounted) setPromo(formatPromo(initialPromo) || initialPromo || null);
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
          <div className="promo-image-wrapper" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{padding:20}}>Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-card-wrapper">
      <article className="promo-card">
        {promo.promotion ? <div className={`promo-badge-hot hot`} style={{left:12,top:12}}>Offre</div> : null}
        <div className="promo-image-wrapper">
          <img src={promo.image} alt={promo.title} className="promo-image" />
          {promo.price && promo.originalPrice ? (
            <div className="promo-discount-badge">
              <div className="badge-content">
                <div className="badge-percent">-{Math.round(((promo.originalPrice - promo.price) / promo.originalPrice) * 100)}%</div>
                <div className="badge-save">Économisez</div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="promo-content">
          <h3 className="promo-title">{promo.title}</h3>
          <p className="promo-description">{promo.promoComment || promo.description || ''}</p>
          <div className="promo-price-section">
            {promo.originalPrice ? <div className="promo-old-price">${Number(promo.originalPrice).toLocaleString()}</div> : null}
            {promo.price ? <div className="promo-new-price">${Number(promo.price).toLocaleString()}</div> : null}
            {promo.originalPrice && promo.price ? <div className="promo-savings">-{Math.round(((promo.originalPrice - promo.price) / promo.originalPrice) * 100)}%</div> : null}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <img src={promo.agent?.image || ''} alt={promo.agent?.prenom || 'Agent'} style={{width:44,height:44,borderRadius:22,objectFit:'cover'}} />
              <div>
                <div style={{fontWeight:800,color:'#0b2f3a'}}>{promo.agent?.prenom || promo.agent?.name || 'Agent Ndaku'}</div>
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
