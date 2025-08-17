// Simple reviews API stub persisted to localStorage
const REV_DELAY = 200;

function load(){
  try{ return JSON.parse(localStorage.getItem('ndaku_reviews')||'{}'); }catch(e){ return {}; }
}

function save(data){ localStorage.setItem('ndaku_reviews', JSON.stringify(data)); }

export async function fetchReviews(ownerId){
  await new Promise(r=>setTimeout(r, REV_DELAY));
  const all = load();
  return all[ownerId] || [];
}

export async function addReview(ownerId, review){
  await new Promise(r=>setTimeout(r, REV_DELAY));
  const all = load();
  all[ownerId] = all[ownerId] || [];
  all[ownerId].push(review);
  save(all);
  return review;
}

export default { fetchReviews, addReview };
