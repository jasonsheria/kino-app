import React, { useEffect, useState, useMemo } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import AgentCard from '../components/agent/AgentCard';
import Modal from '../components/common/Modal';
import '../styles/owner.css';
import { agents as globalAgents, owners } from '../data/fakedata';

export default function OwnerAgents(){
  const owner = owners[0] || { id:1, preferredAgents: [] };
  const ownerId = owner.id;

  const [items, setItems] = useState([]);
  useEffect(()=>{ try{ const s = JSON.parse(localStorage.getItem(`owner_agents_${ownerId}`)||'null'); setItems(Array.isArray(s)?s: owner.preferredAgents.map(id=> globalAgents.find(a=>a.id===id)).filter(Boolean)); }catch(e){ setItems(owner.preferredAgents.map(id=> globalAgents.find(a=>a.id===id)).filter(Boolean)); } },[ownerId]);
  const persist = (next)=>{ try{ localStorage.setItem(`owner_agents_${ownerId}`, JSON.stringify(next)); }catch(e){} setItems(next); };

  const [filter, setFilter] = useState('');
  const filtered = useMemo(()=> items.filter(a=> !filter || a.name.toLowerCase().includes(filter.toLowerCase())),[items, filter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const openAdd = ()=>{ setEdit({ name:'', email:'', phone:'' }); setModalOpen(true); };
  const openEdit = (a)=>{ setEdit({ ...a }); setModalOpen(true); };
  const remove = (id)=>{ if(!window.confirm('Supprimer cet agent associé ?')) return; const next = items.filter(x=> x.id!==id); persist(next); };

  const save = (form)=>{
    if(!form.name){ window.alert('Nom requis'); return; }
    let next;
    if(form.id) next = items.map(x=> x.id===form.id ? form : x);
    else next = [{ ...form, id: Date.now(), photo: form.photo || globalAgents[0].photo }, ...items];
    persist(next); setModalOpen(false);
  };

  return (
    <OwnerLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1">Agents associés</h4>
            <div className="small text-muted">Gérez vos agents et favoris</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input className="form-control form-control-sm" placeholder="Rechercher un agent" value={filter} onChange={e=>setFilter(e.target.value)} style={{width:240}} />
            <button className="btn btn-sm btn-primary" onClick={openAdd}>Ajouter un agent</button>
          </div>
        </div>

        <div className="row">
          {filtered.map(a=> (
            <div key={a.id} className="col-12 col-md-6 col-lg-4">
              <div style={{padding:8}}>
                <AgentCard agent={a} />
                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=>openEdit(a)}>Editer</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(a.id)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="col-12"><div className="text-center small text-muted">Aucun agent trouvé</div></div>}
        </div>

        <Modal open={modalOpen} onClose={()=>setModalOpen(false)}>
          <div style={{minWidth:360}}>
            <h5>{edit? 'Modifier l\'agent' : 'Ajouter un agent'}</h5>
            <input className="form-control mb-2" placeholder="Nom" value={edit?.name||''} onChange={e=> setEdit({...edit, name:e.target.value})} />
            <input className="form-control mb-2" placeholder="Email" value={edit?.email||''} onChange={e=> setEdit({...edit, email:e.target.value})} />
            <input className="form-control mb-2" placeholder="Téléphone" value={edit?.phone||''} onChange={e=> setEdit({...edit, phone:e.target.value})} />
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={()=> save(edit || { name: '', email:'', phone:'' })}>Enregistrer</button>
              <button className="btn btn-outline-secondary" onClick={()=>setModalOpen(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      </div>
    </OwnerLayout>
  );
}
