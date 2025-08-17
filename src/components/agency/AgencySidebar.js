import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBullhorn, FaBoxes, FaWallet, FaCog, FaShieldAlt } from 'react-icons/fa';
import { currentAgencySession } from '../../api/agencies';

export default function AgencySidebar({ collapsed }){
  const session = currentAgencySession();
  const [counts, setCounts] = React.useState({ ads:0, products:0, txs:0 });

  React.useEffect(()=>{
    if(!session) return;
    try{
      const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
      const a = store[session.id] || {};
      setCounts({ ads: (a.ads||[]).length, products: (a.products||[]).length, txs: (a.transactions||[]).length });
    }catch(e){ setCounts({ ads:0, products:0, txs:0 }); }
  }, [session]);

  return (
    <div className={`card owner-card ${collapsed? 'compact':''}`}>
      <div className="card-body owner-sidebar">
        <nav className="nav flex-column" aria-label="agency navigation">
          <NavLink aria-label="dashboard" className="nav-link d-flex align-items-center gap-2" to="/agency/dashboard"><FaTachometerAlt /> {!collapsed && 'Tableau de bord'}</NavLink>
          <NavLink aria-label="ads" className="nav-link d-flex align-items-center gap-2" to="/agency/ads"><FaBullhorn /> {!collapsed && 'Publicité'}{!collapsed && counts.ads>0 && <span className="badge-dot">{counts.ads}</span>}</NavLink>
          <NavLink aria-label="products" className="nav-link d-flex align-items-center gap-2" to="/agency/products"><FaBoxes /> {!collapsed && 'Produits'}{!collapsed && counts.products>0 && <span className="badge-dot">{counts.products}</span>}</NavLink>
          <NavLink aria-label="wallet" className="nav-link d-flex align-items-center gap-2" to="/agency/wallet"><FaWallet /> {!collapsed && 'Wallet'}{!collapsed && counts.txs>0 && <span className="badge-dot">{counts.txs}</span>}</NavLink>
          <NavLink aria-label="settings" className="nav-link d-flex align-items-center gap-2" to="/agency/settings"><FaCog /> {!collapsed && 'Paramètres'}</NavLink>
          <NavLink aria-label="security" className="nav-link d-flex align-items-center gap-2" to="/agency/security"><FaShieldAlt /> {!collapsed && 'Sécurité'}</NavLink>
          <NavLink aria-label="privacy" className="nav-link d-flex align-items-center gap-2" to="/agency/privacy">{!collapsed && 'Confidentialité'}</NavLink>
        </nav>
      </div>
    </div>
  );
}
