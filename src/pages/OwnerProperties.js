import React, { useState, useMemo, useEffect } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import OwnerPropertyForm from '../components/owner/OwnerPropertyForm';
import PropertyCard from '../components/property/PropertyCard';
import Modal from '../components/common/Modal';
import '../styles/owner.css';
import { agents } from '../data/fakedata';
import { getListingRequests, acceptListingRequest, rejectListingRequest } from '../api/ownerActions';

export default function OwnerProperties() {
  const [properties, setProperties] = useState(JSON.parse(localStorage.getItem('owner_props') || '[]'));
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState({ q: '', type: 'all' });

  // determine owner types: try owner_request_draft, then owner_application, then derive from props
  const ownerTypes = useMemo(() => {
    try {
      const draftRaw = localStorage.getItem('owner_request_draft');
      if (draftRaw) { const d = JSON.parse(draftRaw); if (d.types && d.types.length) return d.types; }
    } catch (e) { }
    try {
      const apps = JSON.parse(localStorage.getItem('owner_application') || 'null');
      if (apps) { const head = Array.isArray(apps) ? apps[0] : apps; if (head && head.meta && head.meta.types && head.meta.types.length) return head.meta.types; }
    } catch (e) { }
    const typesFromProps = Array.from(new Set((properties || []).map(p => p.type).filter(Boolean)));
    return typesFromProps.length ? typesFromProps : ['Appartement', 'Voiture', 'Terrain'];
  }, [properties]);

  const stats = useMemo(() => {
    const total = properties.length;
    const byType = {};
    ownerTypes.forEach(t => byType[t] = properties.filter(p => p.type === t).length);
    return { total, byType };
  }, [properties, ownerTypes]);

  const openAdd = () => { setEditIndex(null); setModalOpen(true); };
  const openEdit = (i) => { setEditIndex(i); setModalOpen(true); };
  const [editing, setEditing] = useState(null);

  const remove = (i) => { if (!window.confirm('Supprimer ce bien ?')) return; const next = [...properties]; next.splice(i, 1); setProperties(next); localStorage.setItem('owner_props', JSON.stringify(next)); };
  const save = (p) => {
    const next = [...properties];
    if (editIndex != null) {
      next[editIndex] = { ...next[editIndex], ...p };
    } else {
      const assign = { ...p, id: Date.now(), agentId: p.agentId || (agents[0] && agents[0].id) };
      next.push(assign);
    }
    setProperties(next);
    localStorage.setItem('owner_props', JSON.stringify(next));
    setModalOpen(false);
    setEditIndex(null);
  };

  const filtered = properties.filter(p => {
    if (filter.type && filter.type !== 'all' && p.type !== filter.type) return false;
    if (filter.q && filter.q.trim().length) { const q = filter.q.toLowerCase(); return (p.title && p.title.toLowerCase().includes(q)) || (p.type && p.type.toLowerCase().includes(q)); }
    return true;
  });

  const [requests, setRequests] = useState([]);
  useEffect(()=>{ setRequests(getListingRequests()); }, []);

  const handleAccept = async (id)=>{
    if(!window.confirm('Accepter cette demande et lier le bien à l\'agence ?')) return;
    try{
      await acceptListingRequest(id);
      setRequests(getListingRequests());
      setProperties(JSON.parse(localStorage.getItem('owner_props') || '[]'));
    }catch(e){ alert('Impossible d\'accepter la demande : '+ String(e)); }
  };

  const handleReject = (id)=>{
    if(!window.confirm('Rejeter cette demande ?')) return;
    rejectListingRequest(id);
    setRequests(getListingRequests());
  };

  return (
    <OwnerLayout>
      <div>
        {/* Stats row */}
        <div className="d-flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="stat-card">
            <div className="stat-title">Total de biens</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub small text-muted">Tous types confondus</div>
          </div>
          {ownerTypes.map((t, idx) => (
            <div className="stat-card" key={t}>
              <div className="stat-title">{t}</div>
              <div className="stat-value">{stats.byType[t] || 0}</div>
              <div className="stat-sub small text-muted">Disponible</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="filter-bar mb-3">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="form-control" placeholder="Rechercher un bien" style={{ width: 320 }} value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
            <select className="form-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} style={{ width: 200 }}>
              <option value="all">Tous les types</option>
              {ownerTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button title="Réinitialiser" className="btn btn-outline-secondary" onClick={() => { setFilter({ q: '', type: 'all' }) }} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              {/* reset icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 1 0-2.6 6.1L21 21v-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div>
            <button title="Ajouter un bien" className="btn" onClick={openAdd} style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: '#0d6efd', color: '#fff', border: 'none', boxShadow: '0 2px 6px rgba(13,110,253,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {/* Pending listing requests */}
        {requests.length>0 && (
          <div className="mb-3">
            <h5>Demandes de liaisons d'agences</h5>
            {requests.map(r=> (
              <div key={r.id} className="card p-2 mb-2 d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">Agence: {r.agencyId}</div>
                  <div className="small text-muted">Propriété: {r.propertyId} — {new Date(r.date).toLocaleString()}</div>
                </div>
                <div>
                  <button className="btn btn-sm btn-success me-2" onClick={()=> handleAccept(r.id)}>Accepter</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=> handleReject(r.id)}>Rejeter</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Properties grid */}
        <div className="property-grid">
          {filtered.map((p, i) => (
            <div key={p.id || i}>
              <PropertyCard property={p} />
              <div className="d-flex justify-content-between mt-2">
                <div />
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEdit(properties.indexOf(p))}>Modifier</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(properties.indexOf(p))}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-12"><div className="text-center small text-muted">Aucun bien trouvé</div></div>}
        </div>

        <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditIndex(null); }}>
          <div style={{ minWidth: 420 }}>
            <OwnerPropertyForm onSave={save} initial={editIndex != null ? properties[editIndex] : {}} />
          </div>
        </Modal>
      </div>
    </OwnerLayout>
  );
}
