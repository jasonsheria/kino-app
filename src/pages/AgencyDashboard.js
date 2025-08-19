import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { currentAgencySession, fetchAgency } from '../api/agencies';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function AgencyDashboard(){
  const [stats, setStats] = React.useState({ products:0, ads:0, txs:0, balance:0, agents:0 });
  const [tasks, setTasks] = React.useState([]);
  const [recent, setRecent] = React.useState([]);
  const session = currentAgencySession();

  const load = async ()=>{
    if(!session) return;
    const a = await fetchAgency(session.id);
    setStats({ products: (a.products||[]).length, ads: (a.ads||[]).length, txs: (a.transactions||[]).length, balance: a.wallet||0, agents: (a.agents||[]).length });
    setTasks(a.tasks || [
      { id: 't1', title: 'Valider nouvelle annonce', due: 'Aujourd\u2019hui', done: false },
      { id: 't2', title: 'Répondre aux messages clients', due: 'Demain', done: false },
    ]);
    setRecent(a.recentActivity || [
      { id: 'r1', text: 'Campagne publicitaire créée', time: '2h' },
      { id: 'r2', text: 'Nouveau produit publié', time: '1j' }
    ]);
  };

  React.useEffect(()=>{
    load();
    const h = ()=> load();
    window.addEventListener('ndaku-agency-change', h);
    return () => window.removeEventListener('ndaku-agency-change', h);
  }, []);

  const chartData = React.useMemo(()=>{
    // derive timeseries for the last 6 months from agency transactions
    const now = new Date();
    const months = [];
    const labels = [];
    for(let i=5;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.push(key);
      labels.push(d.toLocaleString(undefined, { month: 'short' }));
    }
    // aggregate transactions by month
    const prodCounts = months.map(m => 0);
    const adCounts = months.map(m => 0);
    try{
      const a = JSON.parse(localStorage.getItem('ndaku_agencies') || '{}');
      const ag = a[session.id] || {};
      (ag.products||[]).forEach(p => {
        const created = p.created || p.createdAt || p.ts || null;
        if(!created) return;
        const d = new Date(created);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const idx = months.indexOf(key);
        if(idx !== -1) prodCounts[idx] += 1;
      });
      (ag.ads||[]).forEach(ad => {
        const created = ad.created || ad.createdAt || ad.ts || null;
        if(!created) return;
        const d = new Date(created);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const idx = months.indexOf(key);
        if(idx !== -1) adCounts[idx] += 1;
      });
    }catch(e){}

    return {
      labels,
      datasets: [
        { label: 'Produits', data: prodCounts, borderColor: '#13c296', backgroundColor: '#13c29633', tension: 0.3 },
        { label: 'Publicités', data: adCounts, borderColor: '#ff8a65', backgroundColor: '#ff8a6533', tension: 0.3 }
      ]
    };
  }, [stats]);

  return (
    <AgencyLayout>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h3 className="mb-1">Tableau de bord</h3>
            <div className="small text-muted">Vue d'ensemble — performances, publicités, ventes et activités récentes.</div>
          </div>
          <div>
            <Link to="/agency/ads" className="btn btn-outline-success me-2">Nouvelle campagne</Link>
            <Link to="/agency/products" className="btn btn-success">Ajouter un produit</Link>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <div className="card p-3 shadow-sm h-100">
              <div className="small text-muted">Produits</div>
              <div className="h3">{stats.products}</div>
              <div className="small text-muted">Gérer vos produits publiés</div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 shadow-sm h-100">
              <div className="small text-muted">Publicités</div>
              <div className="h3">{stats.ads}</div>
              <div className="small text-muted">Campagnes actives</div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 shadow-sm h-100">
              <div className="small text-muted">Solde</div>
              <div className="h3">{stats.balance} €</div>
              <div className="small text-muted">Transactions: {stats.txs}</div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card p-3 shadow-sm h-100">
              <div className="small text-muted">Agents</div>
              <div className="h3">{stats.agents}</div>
              <div className="small text-muted">Gérer l'équipe</div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card p-3 shadow-sm">
              <h5 className="mb-3">Activité récente</h5>
              <Line data={chartData} />
              <div className="mt-3">
                <h6 className="mb-2">Tâches</h6>
                <ul className="list-group">
                  {tasks.map(t => (
                    <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{t.title}</div>
                        <small className="text-muted">Échéance: {t.due}</small>
                      </div>
                      <div>
                        <button className="btn btn-sm btn-outline-success me-2">Marquer fait</button>
                        <button className="btn btn-sm btn-outline-secondary">Voir</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card p-3 shadow-sm mb-3">
              <h6>Récemment</h6>
              <ul className="list-unstyled small mb-0">
                {recent.map(r => (<li key={r.id} className="py-2 border-bottom">{r.text} <div className="text-muted small">{r.time}</div></li>))}
              </ul>
            </div>
            <div className="card p-3 shadow-sm">
              <h6>Raccourcis</h6>
              <div className="d-flex flex-column gap-2 mt-2">
                <Link to="/agency/products" className="btn btn-outline-primary">Gérer produits</Link>
                <Link to="/agency/ads" className="btn btn-outline-warning">Gérer publicités</Link>
                <Link to="/agency/agents" className="btn btn-outline-success">Gérer agents</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
