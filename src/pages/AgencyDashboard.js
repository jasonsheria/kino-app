import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { currentAgencySession, fetchAgency } from '../api/agencies';
import { Link } from 'react-router-dom';

export default function AgencyDashboard(){
  const [stats, setStats] = React.useState({ products:0, ads:0, txs:0, balance:0 });
  const session = currentAgencySession();

  const load = async ()=>{
    // if(!session) return;
    const a = await fetchAgency(session.id);
    setStats({ products: (a.products||[]).length, ads: (a.ads||[]).length, txs: (a.transactions||[]).length, balance: a.wallet||0 });
  };

  React.useEffect(()=>{ load(); const h = ()=> load(); window.addEventListener('ndaku-agency-change', h); return () => window.removeEventListener('ndaku-agency-change', h); }, []);

  return (
    <AgencyLayout>
      <div>
        <h4>Tableau de bord agence</h4>
        <div className="small text-muted mb-3">Vue d'ensemble: performances, publicités et produits.</div>
        <div className="d-flex gap-3 flex-wrap">
          <Link to="/agency/products" className="card p-3 text-decoration-none" style={{minWidth:160}} aria-label="products-card">
            <div className="small text-muted">Produits</div>
            <div className="h4">{stats.products}</div>
            <div className="small text-muted">Gérer vos produits</div>
          </Link>
          <Link to="/agency/ads" className="card p-3 text-decoration-none" style={{minWidth:160}} aria-label="ads-card">
            <div className="small text-muted">Publicités</div>
            <div className="h4">{stats.ads}</div>
            <div className="small text-muted">Voir vos campagnes</div>
          </Link>
          <Link to="/agency/wallet" className="card p-3 text-decoration-none" style={{minWidth:160}} aria-label="wallet-card">
            <div className="small text-muted">Wallet</div>
            <div className="h4">{stats.balance} €</div>
            <div className="small text-muted">Transactions: {stats.txs}</div>
          </Link>
        </div>
      </div>
    </AgencyLayout>
  );
}
