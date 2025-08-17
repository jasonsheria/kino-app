import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import Modal from '../components/common/Modal';
import { currentAgencySession, getAds, addAd, updateAd, deleteAd } from '../api/agencies';

export default function AgencyAds(){
  const [ads, setAds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(null);
  const [title, setTitle] = React.useState('');

  const agencyId = currentAgencySession()?.id;
  React.useEffect(()=>{ if(!agencyId) return; (async ()=>{ setLoading(true); setAds(await getAds(agencyId)); setLoading(false); })(); }, [agencyId]);

  const openCreate = ()=>{ setEdit(null); setTitle(''); setOpen(true); };
  const openEdit = (a)=>{ setEdit(a); setTitle(a.title||''); setOpen(true); };
  const save = async ()=>{
    if(!title) return;
    if(edit) await updateAd(agencyId, edit.id, { title }); else await addAd(agencyId, { title });
    setOpen(false); setAds(await getAds(agencyId));
  };
  const remove = async (id)=>{ await deleteAd(agencyId, id); setAds(await getAds(agencyId)); };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between">
          <h4>Publicités</h4>
          <button className="btn owner-btn-primary" onClick={openCreate}>Nouvelle pub</button>
        </div>
        <div className="small text-muted mb-2">Gérez vos campagnes publicitaires ici.</div>
        {loading ? <div>Chargement...</div> : (
          <div>
            {ads.length===0 && <div className="small text-muted">Aucune publicité</div>}
            {ads.map(a=> (
              <div className="card p-2 mb-2 d-flex justify-content-between align-items-center" key={a.id}>
                <div>{a.title}</div>
                <div>
                  <button className="btn btn-sm btn-link" onClick={()=> openEdit(a)}>Éditer</button>
                  <button className="btn btn-sm btn-danger" onClick={()=> remove(a.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={open} onClose={()=> setOpen(false)}>
          <div style={{minWidth:320}}>
            <h5>{edit? 'Modifier publicité':'Nouvelle publicité'}</h5>
            <input className="form-control" value={title} onChange={e=> setTitle(e.target.value)} placeholder="Titre" />
            <div style={{marginTop:12}}>
              <button className="btn owner-btn-primary" onClick={save}>Enregistrer</button>
              <button className="btn btn-link" onClick={()=> setOpen(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      </div>
    </AgencyLayout>
  );
}
