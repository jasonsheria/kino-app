import React from 'react';
import AgencySidebar from './AgencySidebar';
import { useNavigate } from 'react-router-dom';
import { currentAgencySession, fetchAgency, logoutAgency } from '../../api/agencies';

export default function AgencyLayout({ children }){
  const [collapsed, setCollapsed] = React.useState(false);
  const [agency, setAgency] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(()=>{
    const session = currentAgencySession();
    if(!session) return navigate('/agency/login');
    (async ()=>{
      const a = await fetchAgency(session.id);
      if(!a) return navigate('/agency/login');
      setAgency(a);
    })();
  }, [navigate]);

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
              <button className="btn btn-link" onClick={()=> setCollapsed(s => !s)}>{collapsed? '▶':'◀'}</button>
              <strong>{agency? agency.name : 'Agence'}</strong>
            </div>
            <div className="d-flex align-items-center gap-2">
              {agency && <img src={agency.avatar||'/logo192.png'} alt="avatar" style={{width:36, height:36, borderRadius:18}} />}
              <button className="btn owner-btn-outline" onClick={handleLogout}>Se déconnecter</button>
            </div>
          </div>
          <div className="center-divider mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
