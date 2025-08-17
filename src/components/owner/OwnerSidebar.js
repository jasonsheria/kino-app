import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaHome, FaEnvelope, FaWallet, FaStar, FaSignOutAlt, FaBars, FaUsers, FaCalendarAlt, FaFileAlt, FaUserCircle, FaShieldAlt, FaCog } from 'react-icons/fa';

export default function OwnerSidebar({ collapsed, onToggle }) {
  return (
    <div className={`card owner-card ${collapsed ? 'compact' : ''}`}>

      <div className="card-body owner-sidebar" style={{ padding: collapsed ? 8 : 16, paddingRight: 0 }}>
        <div className={`d-flex align-items-center gap-3 mb-3 ${collapsed ? 'compact-header' : ''}`}>

          {!collapsed && (
            <div>
              <div className="fw-bold">Propriétaire</div>
              <div className="small text-muted">Compte partenaire</div>
            </div>
          )}
          {/* collapse button inside the sidebar */}
          <button onClick={() => onToggle && onToggle()} className="btn btn-sm btn-light ms-auto sidebar-collapse-btn" aria-label="toggle sidebar">
            <FaBars />
          </button>
        </div>
        <nav className="nav flex-column">
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/dashboard"><FaTachometerAlt /> {!collapsed && 'Tableau de bord'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/properties"><FaHome /> {!collapsed && 'Mes biens'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/agents"><FaUsers /> {!collapsed && 'Agents'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/appointments"><FaCalendarAlt /> {!collapsed && 'Rendez-vous'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/messages"><FaEnvelope /> {!collapsed && 'Messages'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/profile"><FaUserCircle /> {!collapsed && 'Profil'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/wallet"><FaWallet /> {!collapsed && 'Wallet'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/security"><FaShieldAlt /> {!collapsed && 'Sécurité'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/subscribe"><FaStar /> {!collapsed && 'Abonnement'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/settings"><FaCog /> {!collapsed && 'Paramètres'}</NavLink>
          <NavLink className="nav-link d-flex align-items-center gap-2" to="/owner/privacy"><FaFileAlt /> {!collapsed && 'Politique '}</NavLink>
          <NavLink className="nav-link text-danger d-flex align-items-center gap-2" to="/"><FaSignOutAlt /> {!collapsed && 'Se déconnecter'}</NavLink>
        </nav>
      </div>
    </div>
  );
}
