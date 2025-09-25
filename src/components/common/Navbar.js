import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCar, FaTree, FaBuilding, FaGlassCheers, FaBars, FaTimes, FaChevronDown, FaBell, FaUserCircle } from 'react-icons/fa';
import './Navbar.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Button } from '@mui/material';

const Navbar = () => {
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseBtnRef = useRef(null);
  const touchStartX = useRef(null);

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
    setTimeout(() => {
      // Prefer focusing the close button for better discoverability
      (drawerCloseBtnRef.current || firstFocusable)?.focus();
    }, 100);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Close dropdowns and drawer when clicking outside specific elements
  useEffect(() => {
    const onDocClick = (e) => {
      if (drawerRef.current && isDrawerOpen && !drawerRef.current.contains(e.target) && !e.target.closest('.kn-menu-toggle')) {
        setIsDrawerOpen(false);
      }
      // close dropdown menus when clicking outside
      if (!userMenuRef.current?.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isDrawerOpen]);

  // Swipe to close on mobile: detect left swipe
  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartX.current = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    };
    const onTouchEnd = (e) => {
      if (!touchStartX.current) return;
      const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      if (endX !== null && touchStartX.current - endX > 50) {
        // swipe left
        setIsDrawerOpen(false);
      }
      touchStartX.current = null;
    };
    const node = drawerRef.current;
    if (node) {
      node.addEventListener('touchstart', onTouchStart);
      node.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      if (node) {
        node.removeEventListener('touchstart', onTouchStart);
        node.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [drawerRef.current]);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  // close notification dropdown on navigation
  useEffect(() => {
    setNotifOpen(false);
  }, [location]);

  const { user } = useAuth();
  const { notifications, removeNotification } = useNotifications();
  const { isConnected } = useWebSocket();
  const socketConnected = isConnected();

  return (
    <header className={`kn-header ${isSticky ? 'sticky' : ''} ${isHidden ? 'hidden' : ''}`} ref={headerRef}>
      <nav className="kn-nav">
        {/* Logo et marque */}
        <Link to="/" className="kn-brand" aria-label="Aller à l'accueil">
          <img
            src="/img/logo.svg"
            alt="Kino-App logo"
            className="kn-brand-logo"
          />
          <span className="kn-brand-text">K-App</span>
        </Link>

        {/* Navigation desktop */}
        <div className="kn-menu">
          <Link
            to="/"
            className={`kn-menu-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Accueil
          </Link>

          <Link to="/about" className="kn-menu-link">
            À propos
          </Link>

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

          <Link to="/contact" className="kn-menu-link">
            Contact
          </Link>
        </div>

        {/* Boutons d'action */}
        <div className="kn-cta-group ct-1">
          {/* Notifications & user status */}
          <div className="kn-notif-wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Afficher les notifications"
              title="Notifications"
            >
              <FaBell aria-hidden="true" />
              {notifications?.length > 0 && (
                <span className="kn-notif-badge">{notifications.length}</span>
              )}
            </Button>

            <div className={`kn-notif-menu ${notifOpen ? 'show' : ''}`} role="menu">
              {notifications?.length > 0 ? (
                notifications.slice().reverse().map((n) => (
                  <div key={n.id || n._id} className="kn-notif-item">
                    <div className="kn-notif-item-body">
                      <div className="kn-notif-title">{n.title || n.name || 'Notification'}</div>
                      <div className="kn-notif-text">{n.message || n.details || n.text}</div>
                    </div>
                    <div className="kn-notif-actions">
                      <button onClick={() => removeNotification(n.id || n._id)} aria-label="Supprimer">✕</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="kn-notif-empty">Aucune notification</div>
              )}
            </div>
          </div>
          <Button
            variant="contained"
            color="primary"
            aria-label="Devenir propriétaire"
            title="Devenir propriétaire"
          >
            <Link to="/owner/onboard"
              style={{
                listStyleType: 'none',
                textDecoration: 'none',
                color: 'white',
              }}
            >
              Propriétaire
            </Link>

          </Button>
          {user ? (
            <div className="kn-user-wrap" ref={userMenuRef}>
              <button className="kn-cta kn-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-haspopup="true" aria-expanded={userMenuOpen} title={user?.name || user?.email}>
                <FaUserCircle className="kn-user-icon" />
                <span className={`kn-online-status ${socketConnected ? 'online' : 'offline'}`} />
              </button>

              <div className={`kn-user-menu ${userMenuOpen ? 'show' : ''}`} role="menu">
                <Link to="/profile" className="kn-user-menu-item" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                <button className="kn-user-menu-item" onClick={() => { setUserMenuOpen(false); /* call logout from context */ window.dispatchEvent(new CustomEvent('appLogout')); }}>Logout</button>
              </div>
            </div>
          ) : (
            < Button
              variant="contained"
              color="primary"
              aria-label="propriétaire"

            >
              <Link to="/login" style={{
                listStyleType: 'none',
                textDecoration: 'none',
                color: 'white',
              }}>Connexion</Link>
            </Button>
          )}
        </div>

        {/* Compact actions shown on mobile (notification + user) */}




        {/* Bouton menu mobile */}
        <div className="kn-compact-actions">
         
          {user ? (
            <div className="kn-user-wrap" ref={userMenuRef}>
              <button className="kn-cta kn-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-haspopup="true" aria-expanded={userMenuOpen} title={user?.name || user?.email}>
                <FaUserCircle className="kn-user-icon" />
                <span className={`kn-online-status ${socketConnected ? 'online' : 'offline'}`} />
              </button>
              <Button
                onClick={() => setNotifOpen(!notifOpen)}
                className="kn-cta kn-user-btn"
                aria-label="Afficher les notifications"
                title="Notifications"
              >
                <FaBell aria-hidden="true" />
                {notifications?.length > 0 && <span className="kn-notif-badge">{notifications.length}</span>}
              </Button>

              <div className={`kn-user-menu ${userMenuOpen ? 'show' : ''}`} role="menu">
                <Link to="/profile" className="kn-user-menu-item" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                <button className="kn-user-menu-item" onClick={() => { setUserMenuOpen(false); /* call logout from context */ window.dispatchEvent(new CustomEvent('appLogout')); }}>Logout</button>
              </div>
            </div>
          ) : (
            <></>
          )}

          <Button
            variant="outlined"
            color="success"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            className="kn-menu-toggle"
            title="Ouvrir le menu"
          >
            <FaBars aria-hidden="true" />
          </Button>
        </div>
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
          <Button
            variant="outlined"
            color="success"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Fermer le menu"
            className="kn-drawer-close"
          >
            <FaTimes />
          </Button>
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
            <Link
              to="/about"
              className="kn-drawer-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              À propos
            </Link>
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
            <Link
              to="/contact"
              className="kn-drawer-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Contact
            </Link>
            <div className="kn-cta-group" style={{ margin: '16px 0', flexDirection: "column" }}>
              <Button
                variant="outlined"
                color="success"
                onClick={() => setIsDrawerOpen(false)}
                style={{ width: '100%' }}
              >
                <Link
                  to="/owner/onboard"
                  className="kn-drawer-link"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Propriétaire
                </Link>
              </Button>

              {user ? (
                <
                >
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ width: '100%' }}
                >
                  <Link
                    to="/login"
                    className="kn-drawer-link"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Connexion
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </header >
  );
};

export default Navbar;

