import React from 'react';
import OwnerSidebar from './OwnerSidebar';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { getDashboardMetrics } from '../../data/fakeMetrics';
import '../../styles/owner.css';

export default function OwnerLayout({ children }){
  const [collapsed, setCollapsed] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotif, setShowNotif] = React.useState(false);
  const [showMessages, setShowMessages] = React.useState(false);
  const [ownerUnread, setOwnerUnread] = React.useState(0);
  const [metrics, setMetrics] = React.useState({ visits:0, bookings:0, revenue:0 });

  React.useEffect(()=>{
    const m = getDashboardMetrics('owner-123');
    setMetrics(m);
  },[]);

  const navigate = useNavigate();

  React.useEffect(()=>{
    const load = ()=>{
      try{
        const msgs = JSON.parse(localStorage.getItem('owner_messages')||'[]');
        const unread = msgs.filter(m=> !m.read).length;
        setOwnerUnread(unread);
      }catch(e){ setOwnerUnread(0); }
    };
    load();
    const handler = (e)=>{ load(); };
    window.addEventListener('ndaku-owner-message', handler);
    return () => window.removeEventListener('ndaku-owner-message', handler);
  },[]);

  return (
    <div className="dashboard-shell">
      <div className={`left-col ${collapsed ? 'collapsed' : ''}`}>
        <div className="left-gradient">
          <div className="left-top">
            <div className="logo-wrap"><img src="/logo192.png" alt="logo"/></div>
          </div>
          <div className="left-nav">
            <OwnerSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
          </div>
        </div>
      </div>

      <div className={`center-panel ${collapsed ? 'expanded' : ''}`}>
        <div className="center-card">
          <div className="top-row d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="search-area">
                <input className="form-control" placeholder="Rechercher" />
              </div>
            </div>
            <div className="top-actions d-flex align-items-center gap-2">
              <div className="action-wrap" style={{position:'relative'}}>
                <button className="icon-btn" onClick={() => { setShowProfile(s => !s); setShowNotif(false); setShowMessages(false); }} aria-label="profile"><FaUser /></button>
                {showProfile && (
                  <div className="dropdown-panel">
                    <div className="dropdown-card">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <img src="/logo192.png" alt="avatar" style={{width:44,height:44,borderRadius:8}} />
                        <div>
                          <div className="fw-bold">Propriétaire Demo</div>
                          <div className="small text-muted">Compte partenaire</div>
                        </div>
                      </div>
                      <div className="dropdown-item">Mon profil</div>
                      <div className="dropdown-item">Paramètres</div>
                      <div className="dropdown-item text-danger">Se déconnecter</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="action-wrap" style={{position:'relative'}}>
                <button className="icon-btn" onClick={() => { setShowNotif(s => !s); setShowProfile(false); setShowMessages(false); }} aria-label="notifications"><FaBell /><span className="badge-dot">3</span></button>
                {showNotif && (
                  <div className="dropdown-panel">
                    <div className="dropdown-card">
                      <div className="fw-bold mb-2">Notifications</div>
                      <div className="dropdown-item small text-muted">Nouvelle demande de visite — 09:30</div>
                      <div className="dropdown-item small text-muted">Message reçu — Marie</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="action-wrap" style={{position:'relative'}}>
                <button className="icon-btn" onClick={() => { setShowMessages(s => !s); setShowProfile(false); setShowNotif(false); }} aria-label="messages"><FaEnvelope />{ownerUnread>0 && <span className="badge-dot" style={{background:'#dc3545'}}>{ownerUnread}</span>}</button>
                {showMessages && (
                  <div className="dropdown-panel">
                    <div className="dropdown-card">
                      <div className="fw-bold mb-2">Messages récents</div>
                      <div className="dropdown-item small text-muted">Jean: Intéressé par la visite</div>
                      <div className="dropdown-item small text-muted">Marie: Besoin d'infos</div>
                    </div>
                  </div>
                )}
              </div>

              <button className="icon-btn danger" onClick={() => { navigate('/'); }} aria-label="logout"><FaSignOutAlt /></button>
            </div>
          </div>

         

          {/* center content specific to page */}
          <div className="center-divider mt-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
