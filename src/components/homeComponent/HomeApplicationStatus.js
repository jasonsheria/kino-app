import React, { useEffect, useState } from 'react';

export default function HomeApplicationStatus({ applicationId }){
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try{
      if(applicationId){
        const res = await fetch(`/api/owner/application/${applicationId}/status`);
        if(res.ok){ const j = await res.json(); setStatus(j); }
        else setStatus({ status: 'unknown', notes: 'Impossible de récupérer le statut' });
      } else {
        // fallback demo: read from localStorage if present
        const demo = JSON.parse(localStorage.getItem('owner_application_status')||'null');
        setStatus(demo || { status: 'none', notes: 'Aucune demande trouvée' });
      }
    }catch(e){ setStatus({ status: 'error', notes: 'Erreur réseau' }); }
    setLoading(false);
  };

  useEffect(()=>{ loadStatus(); }, [applicationId]);

  const colorFor = s => s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'danger' : 'secondary';

  return (
    <div className="card owner-card p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <div className="small text-muted">Statut de la demande</div>
          <div className={`h5 fw-bold text-${colorFor(status?.status)}`}>{(status && status.status) ? status.status.toUpperCase() : (loading? 'Chargement...' : 'Aucune')}</div>
          <div className="small text-muted">{status && status.notes ? status.notes : 'Dernière mise à jour non disponible'}</div>
        </div>
        <div>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadStatus} disabled={loading}>{loading? '...' : 'Rafraîchir'}</button>
        </div>
      </div>
    </div>
  );
}
