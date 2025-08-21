import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCar, FaTree, FaBuilding, FaGlassCheers, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  const drawerRef = useRef(null);

  // Sticky navbar handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsSticky(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Drawer focus trap and keyboard navigation
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Auto focus first focusable element
    const firstFocusable = drawerRef.current?.querySelector('a[href], button:not([disabled])');
    setTimeout(() => firstFocusable?.focus(), 100);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  return (
    <header className={`kn-header ${isSticky ? 'sticky' : ''} ${isHidden ? 'hidden' : ''}`} ref={headerRef}>
      <nav className="kn-nav">
        {/* Logo et marque */}
        <Link to="/" className="kn-brand">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt=""
            className="kn-brand-logo"
          />
          <span className="kn-brand-text">Kino-App</span>
        </Link>

        {/* Navigation desktop */}
        <div className="kn-menu">
          <Link 
            to="/"
            className={`kn-menu-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Accueil
          </Link>
          
          <a href="#apropos" className="kn-menu-link">
            À propos
          </a>

          <div className="kn-dropdown">
            <button
              className="kn-dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Immobilier
              <FaChevronDown
                style={{
                  transform: `rotate(${dropdownOpen ? '180deg' : '0'})`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            <div className={`kn-dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
              <Link to="/voitures" className="kn-dropdown-item">
                <FaCar /> Voitures
              </Link>
              <Link to="/terrain" className="kn-dropdown-item">
                <FaTree /> Terrain
              </Link>
              <Link to="/appartement" className="kn-dropdown-item">
                <FaBuilding /> Appartement
              </Link>
              <Link to="/salle" className="kn-dropdown-item">
                <FaGlassCheers /> Salle de fête
              </Link>
            </div>
          </div>

          <a href="#contact" className="kn-menu-link">
            Contact
          </a>
        </div>

        {/* Boutons d'action */}
        <div className="kn-cta-group ct-1">
          <Link to="/owner/onboard" className="kn-cta kn-cta-outline">
            Devenir propriétaire
          </Link>
          <Link to="/login" className="kn-cta kn-cta-filled">
            Connexion
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          className="kn-menu-toggle"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={isDrawerOpen}
        >
          <FaBars />
        </button>
      </nav>

      {/* Drawer mobile */}
      <div 
        className={`kn-drawer-backdrop ${isDrawerOpen ? 'show' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />
      
      <aside
        ref={drawerRef}
        className={`kn-drawer ${isDrawerOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
      >
        <div className="kn-drawer-header">
          <Link to="/" className="kn-brand" onClick={() => setIsDrawerOpen(false)}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt=""
              className="kn-brand-logo"
            />
            <span className="kn-brand-text">Kino-App</span>
          </Link>
          <button
            className="kn-drawer-close"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Fermer le menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="kn-drawer-body">
          <nav className="kn-drawer-nav">
            <Link
              to="/"
              className={`kn-drawer-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              Accueil
            </Link>
            <a
              href="#apropos"
              className="kn-drawer-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              À propos
            </a>
            <Link
              to="/voitures"
              className={`kn-drawer-link ${location.pathname === '/voitures' ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <FaCar /> Voitures
            </Link>
            <Link
              to="/terrain"
              className={`kn-drawer-link ${location.pathname === '/terrain' ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <FaTree /> Terrain
            </Link>
            <Link
              to="/appartement"
              className={`kn-drawer-link ${location.pathname === '/appartement' ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <FaBuilding /> Appartement
            </Link>
            <Link
              to="/salle"
              className={`kn-drawer-link ${location.pathname === '/salle' ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <FaGlassCheers /> Salle de fête
            </Link>
            <a
              href="#contact"
              className="kn-drawer-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Contact
            </a>
            <div className="kn-cta-group" style={{ margin: '16px 0' , flexDirection : "column"}}>
              <Link
                to="/owner/onboard"
                className="kn-cta kn-cta-outline"
                onClick={() => setIsDrawerOpen(false)}
                style={{ width: '100%' }}
              >
                Devenir propriétaire
              </Link>
              <Link
                to="/login"
                className="kn-cta kn-cta-filled"
                onClick={() => setIsDrawerOpen(false)}
                style={{ width: '100%' }}
              >
                Connexion
              </Link>
            </div>
          </nav>
        </div>
      </aside>
    </header>
  );
};

export default Navbar;

