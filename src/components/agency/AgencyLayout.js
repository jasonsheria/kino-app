import React from 'react';
import AgencySidebar from './AgencySidebar';
import { useNavigate, Link } from 'react-router-dom';
import { currentAgencySession, fetchAgency, logoutAgency } from '../../api/agencies';
import { FaBell, FaEnvelope, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

export default function AgencyLayout({ children }){
  const [collapsed, setCollapsed] = React.useState(false);
  const [agency, setAgency] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(()=>{
    const session = currentAgencySession();
    if(!session) return; // keep non-blocking; login handled elsewhere
    (async ()=>{
      const a = await fetchAgency(session.id);
      if(a) setAgency(a);
    })();

    // simulate realtime notifications/messages arriving
    const n1 = setInterval(()=>{
      setNotifications(prev => [
        ...(prev||[]).slice(0,4),
        { id: Date.now().toString(), text: 'Nouvelle visite sur une annonce', time: 'maintenant' }
      ]);
      setMessages(prev => (prev||[]).slice(0,4));
    }, 15000);
    return () => clearInterval(n1);
  }, []);

  const handleLogout = ()=>{ logoutAgency(); navigate('/agency/login'); };

  return (
    <div className="dashboard-shell">
      <div className={`left-col ${collapsed? 'collapsed':''}`}>
        <div className="left-gradient">
          <div className="left-top"><div className="logo-wrap"><img src="/logo192.png" alt="logo"/></div></div>
          <div className="left-nav"><AgencySidebar collapsed={collapsed} /></div>
        </div>
      </div>
      <div className={`center-panel ${collapsed? 'expanded':''}`}>
        <div className="center-card">
          <div className="top-row d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-link" onClick={()=> setCollapsed(s => !s)} aria-label="toggle-sidebar">{collapsed? '▶':'◀'}</button>
              <strong>{agency? agency.name : 'Agence'}</strong>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <button className="btn btn-link" aria-label="notifications"><FaBell size={18} /></button>
                {notifications.length>0 && <span className="badge bg-danger position-absolute" style={{top:0,right:0,fontSize:11}}>{notifications.length}</span>}
              </div>
              <div className="position-relative">
                <Link to="/agency/messages" className="btn btn-link" aria-label="messages"><FaEnvelope size={18} /></Link>
                {messages.length>0 && <span className="badge bg-success position-absolute" style={{top:0,right:0,fontSize:11}}>{messages.length}</span>}
              </div>
              <div className="d-flex align-items-center gap-2">
                {agency && <img src={agency.avatar||'/logo192.png'} alt="avatar" style={{width:36, height:36, borderRadius:18}} />}
                <button className="btn btn-link" aria-label="logout" title="Se déconnecter" onClick={handleLogout}><FaSignOutAlt size={18} /></button>
                <div className="dropdown">
                  <button className="btn btn-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"><FaUserCircle size={20} /></button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/agency/profile">Profil</Link></li>
                    <li><Link className="dropdown-item" to="/agency/settings">Paramètres</Link></li>
                    <li><hr className="dropdown-divider"/></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Se déconnecter</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="center-divider mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
