// Simple agencies API stub persisted to localStorage
const DELAY = 300;

let store = null;
try{ store = JSON.parse(localStorage.getItem('ndaku_agencies')||'null'); }catch(e){ store = null; }
if(!store){ store = {}; localStorage.setItem('ndaku_agencies', JSON.stringify(store)); }

export async function registerAgency(payload){
  await new Promise(r=>setTimeout(r, DELAY));
  // check by email or name
  const exists = Object.values(store).find(a => a.email === payload.email || a.name === payload.name);
  if(exists) return { error: 'exists', agency: exists };
  const id = 'ag-'+Math.random().toString(36).slice(2,9);
  const agency = { id, name: payload.name, email: payload.email, phone: payload.phone||'', created: new Date().toISOString(), subscription: 'free', wallet:0, products: [], ads: [], settings: {}, security:{}, avatar: '/logo192.png' };
  store[id] = agency; localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  return { agency };
}

export async function fetchAgency(idOrEmail){
  await new Promise(r=>setTimeout(r, DELAY));
  if(!idOrEmail) return null;
  if(store[idOrEmail]) return store[idOrEmail];
  return Object.values(store).find(a => a.email === idOrEmail) || null;
}

export async function loginAgency({ email }){
  await new Promise(r=>setTimeout(r, DELAY));
  const agency = Object.values(store).find(a => a.email === email);
  if(!agency) return { error: 'not_found' };
  // set session
  localStorage.setItem('ndaku_agency_session', JSON.stringify({ id: agency.id, email: agency.email }));
  return { agency };
}

export async function updateAgency(id, patch){
  await new Promise(r=>setTimeout(r, DELAY));
  if(!store[id]) return null;
  store[id] = { ...store[id], ...patch };
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  return store[id];
}

// products CRUD
export async function addProduct(agencyId, product){
  await new Promise(r=>setTimeout(r, DELAY));
  const id = 'pr-'+Math.random().toString(36).slice(2,9);
  const p = { id, ...product };
  store[agencyId].products = store[agencyId].products || [];
  store[agencyId].products.push(p);
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'product_added' } })); }catch(e){}
  return p;
}

export async function updateProduct(agencyId, productId, patch){
  await new Promise(r=>setTimeout(r, DELAY));
  const list = store[agencyId].products || [];
  const idx = list.findIndex(x=> x.id===productId);
  if(idx===-1) return null;
  list[idx] = { ...list[idx], ...patch };
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'product_updated' } })); }catch(e){}
  return list[idx];
}

export async function deleteProduct(agencyId, productId){
  await new Promise(r=>setTimeout(r, DELAY));
  store[agencyId].products = (store[agencyId].products||[]).filter(x=> x.id!==productId);
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'product_deleted' } })); }catch(e){}
  return true;
}

// ads CRUD
export async function addAd(agencyId, ad){
  await new Promise(r=>setTimeout(r, DELAY));
  const id='ad-'+Math.random().toString(36).slice(2,9);
  const a={id,...ad};
  store[agencyId].ads=store[agencyId].ads||[];
  store[agencyId].ads.push(a);
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'ad_added' } })); }catch(e){}
  return a;
}

export async function updateAd(agencyId, adId, patch){
  await new Promise(r=>setTimeout(r, DELAY));
  const list=store[agencyId].ads||[];
  const i=list.findIndex(x=>x.id===adId);
  if(i===-1) return null;
  list[i]={...list[i],...patch};
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'ad_updated' } })); }catch(e){}
  return list[i];
}

export async function deleteAd(agencyId, adId){
  await new Promise(r=>setTimeout(r, DELAY));
  store[agencyId].ads=(store[agencyId].ads||[]).filter(x=>x.id!==adId);
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'ad_deleted' } })); }catch(e){}
  return true;
}

// wallet transactions
export async function addTransaction(agencyId, tx){
  await new Promise(r=>setTimeout(r, DELAY));
  store[agencyId].wallet = (store[agencyId].wallet||0) + (tx.amount||0);
  const txs = store[agencyId].transactions || [];
  const id = 'tx-'+Math.random().toString(36).slice(2,9);
  const record = { id, ...tx, balance: store[agencyId].wallet };
  store[agencyId].transactions = [record, ...txs];
  localStorage.setItem('ndaku_agencies', JSON.stringify(store));
  try{ window.dispatchEvent(new CustomEvent('ndaku-agency-change', { detail: { agencyId, type: 'tx_added' } })); }catch(e){}
  return record;
}

export async function getProducts(agencyId){
  await new Promise(r=>setTimeout(r, DELAY));
  return (store[agencyId] && store[agencyId].products) || [];
}

export async function getAds(agencyId){
  await new Promise(r=>setTimeout(r, DELAY));
  return (store[agencyId] && store[agencyId].ads) || [];
}

export async function getTransactions(agencyId){
  await new Promise(r=>setTimeout(r, DELAY));
  return (store[agencyId] && store[agencyId].transactions) || [];
}

export function currentAgencySession(){
  try{ return JSON.parse(localStorage.getItem('ndaku_agency_session')||'null'); }catch(e){ return null; }
}

export function logoutAgency(){ localStorage.removeItem('ndaku_agency_session'); }

const agenciesApi = { registerAgency, fetchAgency, loginAgency, updateAgency,
  addProduct, updateProduct, deleteProduct, getProducts,
  addAd, updateAd, deleteAd, getAds,
  addTransaction, getTransactions,
  currentAgencySession, logoutAgency };

export default agenciesApi;

