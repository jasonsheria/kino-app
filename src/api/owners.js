// Simple owners API stub persisted to localStorage
const DELAY = 300;

let owners = null;
try{ owners = JSON.parse(localStorage.getItem('ndaku_owners')||'null'); }catch(e){ owners = null; }
if(!owners){
  owners = {
    'owner-123': {
      id: 'owner-123',
      name: 'Propriétaire Demo',
      email: 'owner@example.com',
      phone: '+33 6 12 34 56 78',
      subscription: 'basic',
      rating: 4.5,
      certified: false,
      certificationNote: '',
      certRequested: false,
      avatar: '/logo192.png'
    }
  };
  localStorage.setItem('ndaku_owners', JSON.stringify(owners));
}

export async function fetchOwner(ownerId){
  await new Promise(r=>setTimeout(r,DELAY));
  return owners[ownerId] || null;
}

export async function updateOwner(ownerId, patch){
  await new Promise(r=>setTimeout(r,DELAY));
  owners[ownerId] = { ...(owners[ownerId]||{id:ownerId}), ...patch };
  localStorage.setItem('ndaku_owners', JSON.stringify(owners));
  return owners[ownerId];
}

export async function deleteOwner(ownerId){
  await new Promise(r=>setTimeout(r,DELAY));
  if(owners[ownerId]){
    delete owners[ownerId];
    localStorage.setItem('ndaku_owners', JSON.stringify(owners));
    return true;
  }
  return false;
}

// simple sessions stub
export async function listSessions(ownerId){
  await new Promise(r=>setTimeout(r,DELAY));
  return [{ id:'s1', device:'Chrome — Windows', ip:'81.12.34.5', last:'2025-08-17 10:12' }];
}

export default { fetchOwner, updateOwner };
