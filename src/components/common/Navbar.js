import React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaTree, FaBuilding, FaGlassCheers } from 'react-icons/fa';
import ChatWidget from './ChatWidget';

const Navbar = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [immobilierOpen, setImmobilierOpen] = useState(false);
  const [display, setDisplay] = useState('none');
  useEffect(() => {
    const scrollThreshold = 100;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsSticky(currentScrollY > scrollThreshold);
          // Show/hide navbar on scroll
          setDisplay(currentScrollY > scrollThreshold ? 'block' : 'none');
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    // close dropdown on outside click / resize / scroll for better UX
    const handleDocClick = (e) => {
      const btn = document.getElementById('propertyDropdown');
      if (!btn) return;
      if (!btn.contains(e.target) && !btn.parentElement.contains(e.target)) {
        setImmobilierOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setImmobilierOpen(false);
    };
    window.addEventListener('click', handleDocClick);
    window.addEventListener('resize', () => setImmobilierOpen(false));
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleDocClick);
      window.removeEventListener('resize', () => setImmobilierOpen(false));
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg navbar-light bg-white shadow-sm custom-navbar ${isSticky ? 'sticky' : ''}`}>
      <div className="container-fluid px-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="logo" style={{ height: 38, marginRight: 12 }} />
          <span className="navbar-brand fw-bold" style={{ color: '#13c296', fontSize: '2rem', letterSpacing: '-1px' }}>Kino-App</span>
        </div>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-lg-2">
            <li className="nav-item align-items-center me-3" style={{ display: display }}>
              <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                <span style={{width:10, height:10, borderRadius:10, background: (window.__ndaku_ws && window.__ndaku_ws.readyState===1) ? '#10b981' : '#ef4444', boxShadow:'0 0 6px rgba(0,0,0,0.12)'}} aria-label="WS status" />
                <small style={{fontSize:12, color:'#6b7280'}}>{(window.__ndaku_ws && window.__ndaku_ws.readyState===1) ? 'Connecté' : 'Hors ligne'}</small>
              </span>
            </li>
            <li className="nav-item"><Link className="nav-link text-success fw-bold" to="/">HOME</Link></li>
            <li className="nav-item"><a className="nav-link" href="#">APROPOS</a></li>
            {/* IMMOBILIER dropdown controlled (opens on click) */}
            <li className={`nav-item dropdown ${immobilierOpen ? 'show' : ''}`}>
              <button
                className="nav-link dropdown-toggle btn btn-link d-flex align-items-center gap-2"
                id="propertyDropdown"
                aria-haspopup="true"
                aria-expanded={immobilierOpen}
                onClick={(e) => { e.preventDefault(); setImmobilierOpen(v => !v); }}
                onKeyDown={(e) => { if (e.key === 'Escape') setImmobilierOpen(false); }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                IMMOBILIER
                <span className={`dropdown-caret ${immobilierOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
              </button>
              <ul className={`dropdown-menu ${immobilierOpen ? 'show' : ''}`} aria-labelledby="propertyDropdown">
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2" to="/voitures" onClick={() => setImmobilierOpen(false)}>
                    <FaCar /> Voitures
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2" to="/terrain" onClick={() => setImmobilierOpen(false)}>
                    <FaTree /> Terrain
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2" to="/appartement" onClick={() => setImmobilierOpen(false)}>
                    <FaBuilding /> Appartement
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2" to="/salle" onClick={() => setImmobilierOpen(false)}>
                    <FaGlassCheers /> Salle de fête
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="pagesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">PAGES</a>
              <ul className="dropdown-menu" aria-labelledby="pagesDropdown">
                <li><a className="dropdown-item" href="#">Agents</a></li>
                <li><a className="dropdown-item" href="#">Subscriptions</a></li>
              </ul>
            </li>
            <li className="nav-item"><a className="nav-link" href="#">CONTACT-NOUS</a></li>
           
            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
              <Link className="btn btn-success fw-bold px-4 py-2" to="/login">Connexion</Link>
            </li>
          </ul>
        </div>
      </div>
      {/* Render chat widget globally */}
      <ChatWidget />
    </nav>
  );
};

export default Navbar;
