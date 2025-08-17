// Helpers for owner-side actions: manage agency listing requests and acceptance
import { fetchAgency, updateAgency } from './agencies';

const REQ_KEY = 'agency_listing_requests';

export function getListingRequests(){
  try{ return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); }catch(e){ return []; }
}

export function addListingRequest(request){
  const list = getListingRequests();
  const r = { id: 'req-'+Math.random().toString(36).slice(2,9), date: new Date().toISOString(), ...request };
  list.push(r);
  localStorage.setItem(REQ_KEY, JSON.stringify(list));
  return r;
}

export function removeListingRequest(id){
  const list = getListingRequests().filter(r=> r.id !== id);
  localStorage.setItem(REQ_KEY, JSON.stringify(list));
}

export async function acceptListingRequest(id){
  const list = getListingRequests();
  const req = list.find(r=> r.id===id);
  if(!req) throw new Error('request_not_found');
  // attach agency to property
  try{
    const props = JSON.parse(localStorage.getItem('owner_props')||'[]');
    const pidx = props.findIndex(p=> String(p.id) === String(req.propertyId));
    if(pidx===-1) throw new Error('property_not_found');
    props[pidx] = { ...props[pidx], acceptedByAgency: req.agencyId, acceptedAt: new Date().toISOString() };
    localStorage.setItem('owner_props', JSON.stringify(props));

    // update agency record to include accepted listing
    const agency = await fetchAgency(req.agencyId);
    if(agency){
      const listings = agency.acceptedListings || [];
      if(!listings.includes(req.propertyId)) listings.push(req.propertyId);
      await updateAgency(agency.id, { acceptedListings: listings });
    }

    // remove request
    removeListingRequest(id);
    return { success: true };
  }catch(e){ throw e; }
}

export function rejectListingRequest(id){
  removeListingRequest(id);
  return { success: true };
}

export default { getListingRequests, addListingRequest, acceptListingRequest, rejectListingRequest };
