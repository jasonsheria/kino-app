// server-aware agency products API with localStorage fallback
const API_BASE = process.env.REACT_APP_API || '';

async function safeJson(res){
  try{ return await res.json(); }catch(e){ return null; }
}

export async function fetchProducts(agencyId){
  if(!agencyId) return [];
  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/agencies/${agencyId}/products`);
      if(!res.ok) throw new Error('network');
      return await safeJson(res) || [];
    }catch(e){ console.warn('fetchProducts failed, falling back to localStorage', e); }
  }
  try{
    const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
    return (store[agencyId] && store[agencyId].products) || [];
  }catch(e){ return []; }
}

export async function createProduct(agencyId, item){
  if(!agencyId) throw new Error('no-agency');
  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/agencies/${agencyId}/products`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(item) });
      if(!res.ok) throw new Error('network');
      return await safeJson(res);
    }catch(e){ console.warn('createProduct failed, falling back to localStorage', e); }
  }
  const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
  const a = store[agencyId] || {};
  a.products = a.products || [];
  const rec = { id: item.id || ('pr-'+Math.random().toString(36).slice(2,9)), ...item };
  a.products.unshift(rec);
  store[agencyId] = a;
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  return rec;
}

export async function updateProduct(agencyId, id, patch){
  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/agencies/${agencyId}/products/${id}`, { method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify(patch) });
      if(!res.ok) throw new Error('network');
      return await safeJson(res);
    }catch(e){ console.warn('updateProduct failed, falling back to localStorage', e); }
  }
  const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
  const a = store[agencyId] || {};
  a.products = (a.products||[]).map(p=> p.id===id ? { ...p, ...patch } : p);
  store[agencyId] = a;
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  return a.products.find(p=> p.id===id);
}

export async function deleteProduct(agencyId, id){
  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/agencies/${agencyId}/products/${id}`, { method:'DELETE' });
      if(!res.ok) throw new Error('network');
      return true;
    }catch(e){ console.warn('deleteProduct failed, falling back to localStorage', e); }
  }
  const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
  const a = store[agencyId] || {};
  a.products = (a.products||[]).filter(p=> p.id!==id);
  store[agencyId] = a;
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  return true;
}

export default { fetchProducts, createProduct, updateProduct, deleteProduct };
