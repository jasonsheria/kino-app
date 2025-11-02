import React, { useEffect } from 'react';
import { Link,NavLink, useLocation } from 'react-router-dom';
import { FaTimes, FaCar, FaTree, FaBuilding, FaGlassCheers } from 'react-icons/fa';
import {
  Box,

} from '@mui/material';
import { Button } from '@mui/material';
import './Navbar.css'
import { useOwnerProfile } from '../../hooks/useOwnerProfile';
export default function HomeSidebar({ collapsed, user, setMenuOpen }) {
  const location = useLocation();
  const { ownerProfile, loading, error } = useOwnerProfile();
  useEffect(() => {
    console.log("ownerProfil", ownerProfile);
  }
    , [ownerProfile]);

  return (
    <Box>
      <div className="kn-drawer-header">
        <Link to="/" className="kn-brand" onClick={() => setMenuOpen(false)}>
          
         <img src="/img/logo.svg" alt="Kino-App logo" className="kn-brand-logo" />
      
          <span className="kn-brand-text">Kino-App</span>
        </Link>
      
      </div>

      <div className="kn-drawer-body">
        <nav className="kn-drawer-nav">
          <Link
            to="/"
            className={`kn-drawer-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Accueil
          </Link>
          <Link
            to="/about"
            className="kn-drawer-link"
            onClick={() => setMenuOpen(false)}
          >
            À propos
          </Link>
          <Link
            to="/voitures"
            className={`kn-drawer-link ${location.pathname === '/voitures' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaCar /> Voitures
          </Link>
          <Link
            to="/terrain"
            className={`kn-drawer-link ${location.pathname === '/terrain' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaTree /> Terrain
          </Link>
          <Link
            to="/appartement"
            className={`kn-drawer-link ${location.pathname === '/appartement' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaBuilding /> Appartement
          </Link>
          <Link
            to="/salle"
            className={`kn-drawer-link ${location.pathname === '/salle' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaGlassCheers /> Salle de fête
          </Link>
          <Link
            to="/contact"
            className="kn-drawer-link"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
          <div className="kn-cta-group" style={{ margin: '16px 0', flexDirection: "column" }}>
            <Button
              variant="outlined"
              color="success"
              onClick={() => setMenuOpen(false)}
              style={{ width: '100%' }}
            >
              <Link
                to="/owner/onboard"
                className="kn-drawer-link"
                onClick={() => setMenuOpen(false)}
              >
                Propriétaire
              </Link>
            </Button>

            {user ? (
              <>
              </>
            ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%' }}
                >
                <Link
                  to="/login"
                  className="kn-drawer-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Connexion
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </Box>
  );
}
