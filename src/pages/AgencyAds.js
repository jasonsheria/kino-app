import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import Modal from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import { currentAgencySession, getAds, addAd, updateAd, deleteAd, getProducts } from '../api/agencies';
import { Line } from 'react-chartjs-2';

// simple cost estimator for launching an ad
function estimateCost({ promoPrice=0, durationDays=7 }){
  // fee = base 5 + 1% of promoPrice per day
  const fee = Math.max(5, Math.round((promoPrice * 0.01) * durationDays + 5));
  return fee;
}

export default function AgencyAds(){
  const [ads, setAds] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(null);
  const [productId, setProductId] = React.useState('');
  const [promoPrice, setPromoPrice] = React.useState('');
  const [durationDays, setDurationDays] = React.useState(7);
  const [description, setDescription] = React.useState('');
  const [viewing, setViewing] = React.useState(null); // ad for stats modal
  const agencyId = currentAgencySession()?.id;
  const navigate = useNavigate();

  React.useEffect(()=>{ if(!agencyId) return; (async ()=>{ setLoading(true); setAds(await getAds(agencyId)); setProducts(await getProducts(agencyId)); setLoading(false); })(); }, [agencyId]);

  const openCreate = ()=>{ setEdit(null); setProductId(''); setPromoPrice(''); setDurationDays(7); setDescription(''); setOpen(true); };
  const openEdit = (a)=>{ setEdit(a); setProductId(a.productId||''); setPromoPrice(a.promoPrice||''); setDurationDays(a.durationDays||7); setDescription(a.description||''); setOpen(true); };

  const saveDraft = async ()=>{
    // prepare ad object but don't publish until payment
    const draft = {
      id: edit?.id || ('ad-draft-'+Date.now()),
      productId,
      promoPrice: Number(promoPrice) || 0,
      durationDays: Number(durationDays) || 7,
      description,
      createdAt: new Date().toISOString(),
      active: false,
      views: edit?.views || 0,
      requests: edit?.requests || []
    };
    // show confirmation and route to payment flow
    const amount = estimateCost(draft);
    const pending = { type: 'agency_ad', agencyId, amount, adDraft: draft };
    try{ localStorage.setItem('agency_pending_payment', JSON.stringify(pending)); }catch(e){ console.error(e); }
    setOpen(false);
    navigate('/agency/pay');
  };

  const remove = async (id)=>{ await deleteAd(agencyId, id); setAds(await getAds(agencyId)); };

  const viewStats = (ad)=> setViewing(ad);

  const chartForAd = (ad)=>{
    // fake timeseries from ad.views (if array present or generate sample)
    const labels = ['J-6','J-5','J-4','J-3','J-2','J-1','Aujourd\'hui'];
    const data = Array.from({length:7}, (_,i)=> Math.max(0, Math.floor((ad.views||0)/7) + Math.floor(Math.random()*5)));
    return { labels, datasets: [{ label: 'Vues', data, borderColor: '#13c296', backgroundColor: '#13c29633', tension:0.3 }] };
  };

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-center justify-content-between">
          <h4>Publicités</h4>
          <button className="btn owner-btn-primary" onClick={openCreate}>Nouvelle publicité</button>
        </div>
        <div className="small text-muted mb-2">Sélectionnez un produit pour promouvoir, définissez le prix promotionnel, la durée et la description.</div>
        {loading ? <div>Chargement...</div> : (
          <div>
            {ads.length===0 && <div className="small text-muted">Aucune publicité</div>}
            {ads.map(a=> (
              <div className="card p-3 mb-2" key={a.id}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold">{(products.find(p=>p.id===a.productId)||{}).name || a.title || 'Promotion'}</div>
                    <div className="small text-muted">{a.description}</div>
                    <div className="mt-2 small text-muted">Vues: {a.views||0} • Durée: {a.durationDays || '-'} jours</div>
                  </div>
                  <div className="text-end">
                    <div className="h5 text-success">{a.promoPrice ? `${a.promoPrice} €` : ''}</div>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={()=> viewStats(a)}>Stats</button>
                      <button className="btn btn-sm btn-link me-2" onClick={()=> openEdit(a)}>Éditer</button>
                      <button className="btn btn-sm btn-danger" onClick={()=> remove(a.id)}>Supprimer</button>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <strong>Demandes reçues:</strong>
                  <ul className="list-unstyled small mb-0 mt-2">
                    {(a.requests||[]).length===0 && <li className="text-muted">Aucune demande</li>}
                    {(a.requests||[]).map(r=> (<li key={r.id} className="py-1">{r.name||'Client'} — {r.message||''}</li>))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={open} onClose={()=> setOpen(false)}>
          <div style={{minWidth:360}}>
            <h5>{edit? 'Modifier publicité':'Nouvelle publicité'}</h5>
            <div className="mb-2">
              <label className="form-label small">Produit</label>
              <select className="form-select" value={productId} onChange={e=> setProductId(e.target.value)}>
                <option value="">-- Sélectionner un produit --</option>
                {products.map(p=> (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div className="mb-2">
              <label className="form-label small">Prix promotionnel (€)</label>
              <input type="number" className="form-control" value={promoPrice} onChange={e=> setPromoPrice(e.target.value)} />
            </div>
            <div className="mb-2 d-flex gap-2">
              <div style={{flex:1}}>
                <label className="form-label small">Durée (jours)</label>
                <input type="number" className="form-control" value={durationDays} onChange={e=> setDurationDays(Number(e.target.value))} />
              </div>
              <div style={{width:160}}>
                <label className="form-label small">Coût estimé</label>
                <div className="form-control-plaintext fw-bold">{estimateCost({ promoPrice: Number(promoPrice||0), durationDays })} €</div>
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label small">Description</label>
              <textarea className="form-control" rows={3} value={description} onChange={e=> setDescription(e.target.value)} />
            </div>
            <div className="mt-3 d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={()=> setOpen(false)}>Annuler</button>
              <button className="btn owner-btn-primary" onClick={saveDraft}>Lancer la promotion (Payer)</button>
            </div>
          </div>
        </Modal>

        <Modal open={!!viewing} onClose={()=> setViewing(null)}>
          {viewing && (
            <div style={{minWidth:360}}>
              <h5>Statistiques — {(products.find(p=>p.id===viewing.productId)||{}).name || 'Promotion'}</h5>
              <div style={{height:220}}>
                <Line data={chartForAd(viewing)} />
              </div>
              <div className="mt-3 small text-muted">Vues totales: {viewing.views||0}</div>
            </div>
          )}
        </Modal>
      </div>
    </AgencyLayout>
  );
}
