import React from 'react';
import OwnerSidebar from '../components/owner/OwnerSidebar';
import OwnerStatsCard from '../components/owner/OwnerStatsCard';
import { FaEye, FaCalendarCheck, FaClock, FaWallet, FaBars, FaSearch } from 'react-icons/fa';
import '../styles/owner.css';
import OwnerApplicationStatus from '../components/owner/OwnerApplicationStatus';
import OwnerCalendar from '../components/owner/OwnerCalendar';
import { FaUser, FaBell, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { getDashboardMetrics } from '../data/fakeMetrics';
import OwnerLayout from '../components/owner/OwnerLayout';

export default function OwnerDashboard() {
    const [profileCompletion, setProfileCompletion] = React.useState(null);
    const [collapsed, setCollapsed] = React.useState(false);
    const [showProfile, setShowProfile] = React.useState(false);
    const [showNotif, setShowNotif] = React.useState(false);
    const [showMessages, setShowMessages] = React.useState(false);
    const [metrics, setMetrics] = React.useState({ visits: 0, bookings: 0, revenue: 0 });
    const [animateBars, setAnimateBars] = React.useState(false);

    React.useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('owner_profile_completion') || 'null');
            setProfileCompletion(stored?.pct ?? 78);
        } catch (e) { setProfileCompletion(78); }
        // load fake metrics for the demo owner
        const m = getDashboardMetrics('owner-123');
        setMetrics(m);
        // trigger chart animation on next tick
        setTimeout(() => setAnimateBars(true), 120);
    }, []);

    const navigate = require('react-router-dom').useNavigate();

    return (
        <OwnerLayout>
            < div className="center-divider">

                {/* Stat tiles as full-width row under topbar */}
                <div className="stat-row d-flex gap-2 mb-3 mt-3">
                    <div className="tile flex-fill"> <small>Visites</small><div className="tile-value">128</div></div>
                    <div className="tile flex-fill"> <small>Rendez-vous</small><div className="tile-value">24</div></div>
                    <div className="tile flex-fill"> <small>Messages</small><div className="tile-value">12</div></div>
                    <div className="tile flex-fill"> <small>Revenus</small><div className="tile-value">$3,240</div></div>
                </div>
                <div className="content-grid">
                    <div className="left-block">
                        <div className="card calendar-card">
                            <div className="card-body">
                                <h6>Calendar & Attendance</h6>
                                <OwnerCalendar ownerId={/* owner id - from auth/profile later */ 'owner-123'} />
                            </div>
                        </div>
                        <div className="card notif-card mt-3">
                            <div className="card-body">
                                <h6>Activities Notification</h6>
                                <p className="small text-muted">Two recent notifications shown here with a 'View All' action.</p>
                            </div>
                        </div>
                    </div>

                    <div className="right-block">
                        <div className="card perf-card mb-3">
                            <div className="card-body">
                                <h6>kino-app performance</h6>
                                <div className="chart-placeholder perf-chart">
                                    {/* improved inline SVG chart with subtle grid and gradient bars */}
                                    <svg width="100%" height="120" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="performance chart">
                                        <defs>
                                            <linearGradient id="gradA" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
                                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
                                            </linearGradient>
                                            <linearGradient id="gradB" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.95" />
                                                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
                                            </linearGradient>
                                            <linearGradient id="gradC" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#34D399" stopOpacity="0.95" />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                                            </linearGradient>
                                        </defs>
                                        {/* grid lines */}
                                        <g stroke="#eef2f7" strokeWidth="1">
                                            <line x1="20" y1="20" x2="300" y2="20" />
                                            <line x1="20" y1="45" x2="300" y2="45" />
                                            <line x1="20" y1="70" x2="300" y2="70" />
                                            <line x1="20" y1="95" x2="300" y2="95" />
                                        </g>
                                        {/* bars - height driven by metrics (max baseline = 100 for scale) */}
                                        <g transform="translate(0,0)">
                                            <g transform="translate(44,0)" className={`bar-group ${animateBars ? 'grow' : ''}`}>
                                                <rect x="0" y="30" width="44" height="66" rx="6" fill="url(#gradA)" opacity="0.95" />
                                            </g>
                                            <g transform="translate(120,0)" className={`bar-group ${animateBars ? 'grow' : ''}`}>
                                                <rect x="0" y="18" width="44" height="78" rx="6" fill="url(#gradB)" opacity="0.95" />
                                            </g>
                                            <g transform="translate(196,0)" className={`bar-group ${animateBars ? 'grow' : ''}`}>
                                                <rect x="0" y="8" width="44" height="88" rx="6" fill="url(#gradC)" opacity="0.95" />
                                            </g>
                                        </g>
                                        {/* labels and values */}
                                        <g fill="#6b7280" fontSize="10" textAnchor="middle">
                                            <text x="66" y="110">Visits</text>
                                            <text x="142" y="110">Bookings</text>
                                            <text x="218" y="110">Revenue</text>
                                        </g>
                                        <g textAnchor="middle">
                                            <text className="value-label" x="66" y="98">{metrics.visits}</text>
                                            <text className="value-label" x="142" y="86">{metrics.bookings}</text>
                                            <text className="value-label" x="218" y="76">${metrics.revenue}</text>
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="card top-scorer">
                            <div className="card-body">
                                <h6>Top Scorer</h6>
                                <div className="scorers d-flex gap-2 mt-2">
                                    <div className="scorer card-highlight">
                                        <div className="scorer-name">Brandon Harris</div>
                                        <div className="scorer-score">99.90%</div>
                                        <div className="scorer-rank">1st</div>
                                    </div>
                                    <div className="scorer card-muted">
                                        <div className="scorer-name">Charles James</div>
                                        <div className="scorer-score">99.76%</div>
                                        <div className="scorer-rank">2nd</div>
                                    </div>
                                    <div className="scorer card-warning">
                                        <div className="scorer-name">Mike Peter</div>
                                        <div className="scorer-score">99.50%</div>
                                        <div className="scorer-rank">3rd</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </OwnerLayout>

    );
}
