import React, { useEffect, useMemo, useState } from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import AgentCard from '../components/agent/AgentCard';
import Modal from '../components/common/Modal';
import { currentAgencySession } from '../api/agencies';

export default function AgencyAgents(){
  const session = currentAgencySession();
  const agencyId = session?.id;

  const [agents, setAgents] = useState([]);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = ()=>{
    try{
      const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
      const a = store[agencyId] || {};
      setAgents(a.agents || []);
    }catch(e){ setAgents([]); }
  };

  useEffect(()=>{ load(); const h = ()=> load(); window.addEventListener('ndaku-agency-change', h); return () => window.removeEventListener('ndaku-agency-change', h); }, [agencyId]);

  const filtered = useMemo(()=> agents.filter(x=> !filter || x.name.toLowerCase().includes(filter.toLowerCase())), [agents, filter]);

  const openAdd = ()=>{ setEditing({ name:'', email:'', phone:'', address:'', photo:'/img/logo.svg', status:'Actif' }); setModalOpen(true); };
  const openEdit = (a)=>{ setEditing({ ...a }); setModalOpen(true); };

  const persist = (next)=>{
    try{
      const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
      const a = store[agencyId] || {};
      a.agents = next;
      store[agencyId] = a;
      localStorage.setItem('ndaku_agencies', JSON.stringify(store));
      window.dispatchEvent(new Event('ndaku-agency-change'));
      setAgents(next);
    }catch(e){ console.error(e); }
  };

  const save = (form)=>{
    if(!form.name){ window.alert('Nom requis'); return; }
    let next;
    if(form.id) next = agents.map(x=> x.id===form.id ? form : x);
    else next = [{ ...form, id: Date.now().toString() }, ...agents];
    persist(next);
    setModalOpen(false);
  };

  const remove = (id)=>{ if(!window.confirm('Supprimer cet agent ?')) return; const next = agents.filter(x=> x.id!==id); persist(next); };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1">Agents</h4>
            <div className="small text-muted">Gérez les agents de votre agence</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input className="form-control form-control-sm" placeholder="Rechercher un agent" value={filter} onChange={e=>setFilter(e.target.value)} style={{width:220}} />
            <button className="btn btn-sm btn-primary" onClick={openAdd}>Ajouter un agent</button>
          </div>
        </div>

        <div className="row">
          {filtered.map(a=> (
            <div key={a.id} className="col-12 col-md-6 col-lg-4">
              <div style={{padding:8}}>
                <AgentCard agent={{ name: a.name, photo: a.photo||'/img/logo.svg', address: a.address||'', email: a.email||'', status: a.status||'Actif' }} />
                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=> openEdit(a)}>Editer</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=> remove(a.id)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="col-12"><div className="text-center small text-muted">Aucun agent trouvé</div></div>}
        </div>

        <Modal open={modalOpen} onClose={()=>setModalOpen(false)}>
          <div style={{minWidth:360}}>
            <h5>{editing?.id ? 'Modifier l\'agent' : 'Ajouter un agent'}</h5>
            <input className="form-control mb-2" placeholder="Nom" value={editing?.name||''} onChange={e=> setEditing({...editing, name:e.target.value})} />
            <input className="form-control mb-2" placeholder="Email" value={editing?.email||''} onChange={e=> setEditing({...editing, email:e.target.value})} />
            <input className="form-control mb-2" placeholder="Téléphone" value={editing?.phone||''} onChange={e=> setEditing({...editing, phone:e.target.value})} />
            <input className="form-control mb-2" placeholder="Adresse" value={editing?.address||''} onChange={e=> setEditing({...editing, address:e.target.value})} />
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={()=> save(editing)}>Enregistrer</button>
              <button className="btn btn-outline-secondary" onClick={()=>setModalOpen(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      </div>
    </AgencyLayout>
  );
}
