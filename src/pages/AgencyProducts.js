import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import Modal from '../components/common/Modal';
import { currentAgencySession, getProducts, addProduct, updateProduct, deleteProduct } from '../api/agencies';

export default function AgencyProducts(){
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(null);
  const [name, setName] = React.useState('');

  const agencyId = currentAgencySession()?.id;

  React.useEffect(()=>{ if(!agencyId) return; (async ()=>{ setLoading(true); setProducts(await getProducts(agencyId)); setLoading(false); })(); }, [agencyId]);

  const openCreate = ()=>{ setEdit(null); setName(''); setOpen(true); };
  const openEdit = (p)=>{ setEdit(p); setName(p.name||''); setOpen(true); };
  const save = async ()=>{
    if(!name) return;
    if(edit) await updateProduct(agencyId, edit.id, { name }); else await addProduct(agencyId, { name });
    setOpen(false); setLoading(true); setProducts(await getProducts(agencyId)); setLoading(false);
  };
  const remove = async (id)=>{ await deleteProduct(agencyId, id); setProducts(await getProducts(agencyId)); };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between">
          <h4>Produits</h4>
          <button className="btn owner-btn-primary" onClick={openCreate}>Nouveau produit</button>
        </div>
        <div className="small text-muted mb-2">Liste et gestion des produits de l'agence.</div>
        {loading ? <div>Chargement...</div> : (
          <div className="row">
            {products.length===0 && <div className="small text-muted">Aucun produit</div>}
            {products.map(p=> (
              <div className="col-12" key={p.id}>
                <div className="card p-2 mb-2 d-flex justify-content-between align-items-center">
                  <div>{p.name}</div>
                  <div>
                    <button className="btn btn-sm btn-link" onClick={()=> openEdit(p)}>Éditer</button>
                    <button className="btn btn-sm btn-danger" onClick={()=> remove(p.id)}>Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={open} onClose={()=> setOpen(false)}>
          <div style={{minWidth:320}}>
            <h5>{edit? 'Modifier produit':'Nouveau produit'}</h5>
            <input className="form-control" value={name} onChange={e=> setName(e.target.value)} placeholder="Nom du produit" />
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
