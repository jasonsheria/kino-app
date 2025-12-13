import React, { useState, useEffect, useRef } from 'react';
import { ReactComponent as Logo } from '../../assets/logo.svg';
import { Link, useLocation } from 'react-router-dom';
import { FaCar, FaTree, FaBuilding, FaGlassCheers, FaBars, FaTimes, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { useOwnerProfile } from '../../hooks/useOwnerProfile';
import { getDashboardMetrics } from '../../data/fakeMetrics';
import ProfileCard from './ProfileCard';
import '../../styles/owner.css';
import { Button } from '@mui/material';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  useTheme,
  useMediaQuery,
  Drawer,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import HomeSidebar from './HomeSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useMessageContext } from '../../contexts/MessageContext';
// Données de test pour les notifications
const TEST_NOTIFICATIONS = [
  // {
  //   id: 'notif1',
  //   title: 'Nouvelle réservation',
  //   message: 'Une nouvelle réservation a été effectuée pour votre appartement',
  //   unread: true,
  //   timestamp: new Date().toISOString()
  // },
  // {
  //   id: 'notif2',
  //   title: 'Message reçu',
  //   message: 'Vous avez reçu un nouveau message concernant votre annonce',
  //   unread: true,
  //   timestamp: new Date().toISOString()
  // },
  // {
  //   id: 'notif3',
  //   title: 'Paiement reçu',
  //   message: 'Le paiement de la réservation #1234 a été confirmé',
  //   unread: true,
  //   timestamp: new Date().toISOString()
  // }
];
export default function HomeLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);
  const [menuOpen, setMenuOpen] = React.useState(!isMobile);
  const [anchorProfile, setAnchorProfile] = React.useState(null);
  const [anchorProp, setAnchorProp] = React.useState(null);
  const hoverCloseTimer = useRef(null);
  const menuPaperRef = useRef(null);
  const [anchorNotif, setAnchorNotif] = React.useState(null);
  const [anchorMessages, setAnchorMessages] = React.useState(null);
  const [ownerUnread, setOwnerUnread] = React.useState(0);
  const [metrics, setMetrics] = React.useState({ visits: 0, bookings: 0, revenue: 0 });
  const { ownerProfile, loading, error } = useOwnerProfile();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuRefMobile = useRef(null); // separate ref for compact/mobile wrapper
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
    if (!menuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
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


    window.addEventListener('keydown', handleKeyDown);

    // Auto focus first focusable element
    const firstFocusable = drawerRef.current?.querySelector('a[href], button:not([disabled])');
    setTimeout(() => {
      // Prefer focusing the close button for better discoverability
      (drawerCloseBtnRef.current || firstFocusable)?.focus();
    }, 100);

    return () => {
      unlockScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Close dropdowns and drawer when clicking outside specific elements
  useEffect(() => {
    const onDocClick = (e) => {
      if (drawerRef.current && menuOpen && !drawerRef.current.contains(e.target) && !e.target.closest('.kn-menu-toggle')) {
        setMenuOpen(false);
      }
      // close dropdown menus when clicking outside
      const inDesktop = userMenuRef.current?.contains(e.target);
      const inMobile = userMenuRefMobile.current?.contains(e.target);
      if (!inDesktop && !inMobile) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

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
        setMenuOpen(false);
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
    setMenuOpen(false);
  }, [location]);

  // close notification dropdown on navigation
  useEffect(() => {
    setNotifOpen(false);
  }, [location]);

  const { user } = useAuth();
  // NotificationContext (socket-based notifications)
  const { notifications: realNotifications = [], removeNotification, markAllRead, markRead } = useNotifications();
  // MessageContext (messages / suggestions loaded via HTTP requests)
  const { messages: messageMessages = [], unreadCount: messagesUnreadCount = 0, markAsRead } = useMessageContext();
  // Use notifications from NotificationContext as primary source, fallback to TEST_NOTIFICATIONS
  const notifications = [...(realNotifications || []), ...TEST_NOTIFICATIONS];
  const notificationUnreadCount = (realNotifications || []).filter(n => n.unread).length;

  // Style commun pour les icônes (géré via CSS .kn-icon)
  const { isConnected, send } = useWebSocket();
  const socketConnected = isConnected();

  React.useEffect(() => {
    const m = getDashboardMetrics('owner-123');
    setMetrics(m);
    console.log("dans le nav la status du socket", socketConnected)
  }, [socketConnected]);

  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem('ndaku_auth_token');
      localStorage.removeItem('token');
    } catch (e) { /* ignore */ }
    navigate('/');
  };

  React.useEffect(() => {
    const computeOwnerUnread = () => {
      try {
        const ownerId = ownerProfile?.user?._id || (() => { try { const d = JSON.parse(localStorage.getItem('owner_request_draft') || 'null'); return d && d.id ? String(d.id) : null; } catch (e) { return null; } })();
        if (!ownerId) { setOwnerUnread(0); return; }
        const unread = (realNotifications || []).filter(m => String(m.userId) === String(ownerId) && (m.unread !== false)).length;
        setOwnerUnread(unread);
      } catch (e) { setOwnerUnread(0); }
    };
    computeOwnerUnread();
    // Recompute when notifications or owner profile change
  }, [realNotifications, ownerProfile]);
  // Cleanup hover close timer on unmount
  useEffect(() => {
    return () => {
      try { clearTimeout(hoverCloseTimer.current); } catch (e) { /* ignore */ }
    };
  }, []);
  const drawerWidth = 260;

  React.useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ mt: '10px', mb : '10px', display: 'flex', bgcolor: theme.palette.grey[100] }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%' },
          ml: { xs: 0, md: menuOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Toolbar>
          {/* Brand / logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', marginRight: 12, marginTop:'-3px' }}>
            {/* Inline SVG component to ensure animation and cross-browser rendering */}
            <Logo width={34} height={34} style={{ marginRight: 8 }} />
            <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 400, fontSize: "1rem", color: "#138f6b" }}>K-App</Typography>
          </Link>

          {/* On mobile show a menu loicon that opens the sidebar. On desktop we render the primary navigation in the topbar. */}
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMenuOpen(!menuOpen)}
              sx={{
                mr: 2,
                display: 'flex',
                bgcolor: theme.palette.grey[100],
                '&:hover': {
                  bgcolor: theme.palette.grey[200],
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
              <Button className="kn-menu-text animated-link" component={Link} to="/" color={location.pathname === '/' ? 'primary' : 'inherit'} sx={{ textTransform: 'none' }}>Accueil</Button>
              <Button className="kn-menu-text animated-link" component={Link} to="/about" color={location.pathname === '/about' ? 'primary' : 'inherit'} sx={{ textTransform: 'none' }}>À propos</Button>

              {/* Properties dropdown (hover on desktop, click on mobile) */}
              <Button
                id="properties-button"
                aria-controls={Boolean(anchorProp) ? 'properties-menu' : undefined}
                aria-haspopup="true"
                onMouseEnter={(e) => { if (!isMobile) { setAnchorProp(e.currentTarget); } }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    // If the pointer is moving into the menu paper, don't start the close timer.
                    try {
                      const related = e.relatedTarget || document.activeElement;
                      if (menuPaperRef.current && related && menuPaperRef.current.contains(related)) {
                        // pointer moved into menu - do nothing, menu's onMouseEnter will keep it open
                        return;
                      }
                    } catch (err) {
                      // ignore and proceed to set timer
                    }
                    hoverCloseTimer.current = setTimeout(() => setAnchorProp(null), 2200);
                  }
                }}
                color={['/voitures', '/terrain', '/appartement', '/salle'].includes(location.pathname) ? 'primary' : 'inherit'}
                className="kn-menu-text animated-link"
                sx={{ textTransform: 'none', gap : '0px' }}
                endIcon={<FaChevronDown />}
              >
                Immobilier
              </Button>

              <Button className="kn-menu-text animated-link" component={Link} to="/contact" color={location.pathname === '/contact' ? 'primary' : 'inherit'} sx={{ textTransform: 'none', color: "#0f888880", marginLeft: "6px" }}>Contact</Button>

              {/* Owner / Login CTAs on desktop */}
              <Button className="kn-menu-text animated-link" component={Link} to="/owner/onboard" variant="outlined" color="primary" sx={{ ml: 1, fontWeight: 400 }}>
                Propriétaire
              </Button>

            </Box>
          )}

          <Box
            sx={{
              position: 'relative',
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.grey[100],
              '&:hover': { backgroundColor: theme.palette.grey[200] },
              marginRight: theme.spacing(2),
              marginLeft: 0,
              width: { xs: '100%', sm: 'auto' },
              display: { xs: 'none', sm: 'block' },
            }}
          >
            <Box sx={{
              padding: theme.spacing(0.5, 1),
              height: '40px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <SearchIcon sx={{ p: 0.5, color: 'text.secondary' }} />
              <InputBase
                placeholder="Rechercher..."
                sx={{
                  ml: 1,
                  flex: 1,
                  '& .MuiInputBase-input': {
                    padding: theme.spacing(1, 1, 1, 0),
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            '& .MuiIconButton-root': {
              width: 40,
              height: 40,
              borderRadius: theme.shape.borderRadius,
            }
          }}>
            {/* Dev-only: quick notification emitter for testing. Enable by adding ?devNotify=1 to URL */}
            {typeof window !== 'undefined' && window.location.search.includes('devNotify=1') && user && (
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    const payload = {
                      type: 'emitNotification',
                      user: user.id || user._id,
                      senderId: user.id || user._id,
                      title: 'Test notification',
                      message: `Test from ${user.email || user.name || 'you'} at ${new Date().toLocaleTimeString()}`,
                      source: 'dev'
                    };
                    if (send) send(payload);
                    else console.warn('Socket send not available');
                  } catch (e) { console.error(e); }
                }}
                sx={{ mr: 1 }}
                title="Emit test notification"
              >
                <FaBell />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={(e) => setAnchorNotif(e.currentTarget)}
              sx={{
                bgcolor: 'transparent',
                '&:hover': { bgcolor: theme.palette.grey[100] }
              }}
            >
              <Badge
                badgeContent={notificationUnreadCount || 0}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: 10,
                    height: 16,
                    minWidth: 16,
                  }
                }}
              >
                <FaBell size={18} />
              </Badge>
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => setAnchorMessages(e.currentTarget)}
              sx={{
                bgcolor: 'transparent',
                '&:hover': { bgcolor: theme.palette.grey[100] }
              }}
            >
              <Badge
                badgeContent={messagesUnreadCount || 0}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: 10,
                    height: 16,
                    minWidth: 16,
                  }
                }}
              >
                <FaEnvelope size={18} />
              </Badge>
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

            <IconButton
              onClick={(e) => setAnchorProfile(e.currentTarget)}
              sx={{
                ml: 0.5,
                p: 0.5,
                '&:hover': { bgcolor: theme.palette.grey[100] }
              }}
            >

              <Avatar
                src={ownerProfile?.user?.profileUrl || ""}
                sx={{
                  width: 32,
                  height: 32,
                  border: socketConnected ? `2px solid ${theme.palette.background.paper}` : `2px solid #00c59b}`,
                  backgroundColor: socketConnected ? '##ffffff' : '#888',
                  color: socketConnected ? '#00c59b' : '#888',
                  boxShadow: theme.shadows[2]
                }}

              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Only render the drawer on mobile - on desktop the nav is in the topbar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          sx={{
            width: { dm: drawerWidth },
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[2],
              backgroundImage: 'none',
            },
            width: menuOpen ? drawerWidth : 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
          }}
          PaperProps={{
            elevation: 2,
          }}
        >
          <Toolbar />
          <HomeSidebar collapsed={!menuOpen} user={user} setMenuOpen={setMenuOpen} />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${menuOpen ? drawerWidth : 0}px)` },
          // ml: { xs: 0, md: menuOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          // pt: { xs: 2, sm: 3 },
          // px: { xs: 2, sm: 3 },
          mt: '64px', // height of AppBar
          
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
        }}

      >
        {children}
      </Box>

      <Menu
        anchorEl={anchorProfile}
        open={Boolean(anchorProfile)}
        onClose={() => setAnchorProfile(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: 250,
            boxShadow: theme.shadows[8],
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <ProfileCard onClose={() => setAnchorProfile(null)} />
        <Divider />
        {user ?
          (<MenuItem
            className="kn-menu-text"
            onClick={() => {
              setAnchorProfile(null);
              navigate('/profile');
            }}
            sx={{ py: 1.5 }}
          >
            <FaUser style={{ marginRight: 12 }} />
            <span style={{ fontWeight: 400 }}>Profil</span>
          </MenuItem>) : (null)
        }
        <Divider />
        {user ?
          (<MenuItem
            className="kn-menu-text"
            onClick={() => {
              localStorage.removeItem('ndaku_auth_token');
              localStorage.removeItem('ndaku_user')
              window.location.href=('/');
              setAnchorProfile(null);
            }}
            sx={{
              py: 1.5,
              color: 'error.main',
              '&:hover': {
                bgcolor: theme.palette.error.lighter,
              }
            }}
          >
            <FaSignOutAlt style={{ marginRight: 12 }} />
            <span style={{ fontWeight: 400 }}>Déconnexion</span>
          </MenuItem>) : (
            <MenuItem
              className="kn-menu-text"
              onClick={() => {
                setAnchorProfile(null);
                navigate('/login');
              }}
              sx={{ py: 1.5 }}
            >
              <FaUser style={{ marginRight: 12 }} />
              <span style={{ fontWeight: 400 }}>Connexion</span>
            </MenuItem>
          )
        }

      </Menu>

      {/* Properties dropdown menu (desktop) */}
      <Menu
        id="properties-menu"
        anchorEl={anchorProp}
        open={Boolean(anchorProp)}
        onClose={() => setAnchorProp(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        MenuListProps={{ 'aria-labelledby': 'properties-button' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 520,
            maxWidth: 900,
            p: 2,
            boxShadow: theme.shadows[10],
          },
          // attach ref to the Paper element so we can detect relatedTarget containment
          ref: menuPaperRef,
          onMouseEnter: () => { if (!isMobile) { clearTimeout(hoverCloseTimer.current); } },
          onMouseLeave: () => { if (!isMobile) { hoverCloseTimer.current = setTimeout(() => setAnchorProp(null), 20000); } }
        }}
      >
        {/* Rich mega-menu for Immobilier: two columns with detailed descriptions and example articles */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Immobilier</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Découvrez les différents types de biens disponibles sur la plateforme, avec des articles et des conseils pour chaque catégorie.</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box component={Link} to="/voitures" className="animated-link kn-menu-text" onClick={() => setAnchorProp(null)} sx={{ textDecoration: 'none', color: 'inherit', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaCar /> Voitures</Typography>
                <Typography variant="caption" color="text.secondary">Voitures d'occasion et neuves listées par nos agents. Ex: "Guide d'achat 2025"</Typography>
              </Box>

              <Box component={Link} to="/terrain" className="animated-link kn-menu-text" onClick={() => setAnchorProp(null)} sx={{ textDecoration: 'none', color: 'inherit', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaTree /> Terrain</Typography>
                <Typography variant="caption" color="text.secondary">Parcelles et terrains constructibles — conseils de zonage et exemples d'annonces.</Typography>
              </Box>

              <Box component={Link} to="/appartement" className="animated-link kn-menu-text" onClick={() => setAnchorProp(null)} sx={{ textDecoration: 'none', color: 'inherit', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaBuilding /> Appartement</Typography>
                <Typography variant="caption" color="text.secondary">Appartements à louer ou à vendre — voir exemples d'articles: "Trouver un appartement en centre-ville".</Typography>
              </Box>

              <Box component={Link} to="/salle" className="animated-link kn-menu-text" onClick={() => setAnchorProp(null)} sx={{ textDecoration: 'none', color: 'inherit', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaGlassCheers /> Salle de fête</Typography>
                <Typography variant="caption" color="text.secondary">Salles pour événements — exemples d'articles sur la réservation et l'organisation.</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderLeft: { xs: 'none', sm: `1px solid ${theme.palette.divider}` }, pl: { xs: 0, sm: 2 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ressources & Articles</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2">Guide: Bien choisir son appartement</Typography>
                <Typography variant="caption" color="text.secondary">Conseils pratiques pour évaluer la qualité, le quartier et le prix.</Typography>
              </Box>
              <Box sx={{ p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2">Article: Acheter un terrain en 2025</Typography>
                <Typography variant="caption" color="text.secondary">Tout savoir sur les démarches et la réglementation locale.</Typography>
              </Box>
              <Box sx={{ p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="subtitle2">Conseils: Organiser un événement</Typography>
                <Typography variant="caption" color="text.secondary">Checklist pour la location d'une salle et la logistique.</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Aperçu: chaque page contient de nombreuses annonces, photos et descriptions détaillées — survolez pour découvrir.</Typography>
            </Box>
          </Box>
        </Box>
      </Menu>

      <Menu
        anchorEl={anchorNotif}
        open={Boolean(anchorNotif)}
        onClose={() => setAnchorNotif(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxHeight: 400,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          {/* Render notifications from NotificationContext (socket-driven) */}
          {
            notifications.map((notif) => {
              const id = notif.id || notif._id || notif.name || JSON.stringify(notif);
              const title = notif.title || notif.name || notif.sender || 'Notification';
              const body = notif.message || notif.description || notif.details || '';
              const timestamp = notif.timestamp || notif.date || notif.createdAt || new Date().toISOString();
              const isUnread = notif.isRead === undefined ? !!notif.unread : !notif.isRead ? true : false;
              return (
                <MenuItem
                  key={id}
                  className="kn-menu-text"
                  sx={{ py: 1.5 }}
                  onClick={() => {
                    try {
                      // mark as read in NotificationContext if available
                      if (markRead) markRead(id);
                    } catch (e) { /* ignore */ }
                    setAnchorNotif(null);
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {title}
                    </Typography>
                    {body && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {body}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })
          }
        </Box>
      </Menu>

      <Menu
        anchorEl={anchorMessages}
        open={Boolean(anchorMessages)}
        onClose={() => setAnchorMessages(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxHeight: 400,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
            Messages récents
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          {/* Render messages from MessageContext (HTTP-loaded / suggestions) */}
          {messageMessages.length === 0 && (
            <MenuItem sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2">Aucun message récent</Typography>
              </Box>
            </MenuItem>
          )}
          {messageMessages.map((m) => {
            const id = m.id || m._id || JSON.stringify(m);
            const sender = m.sender || m.name || m.email || 'Contact';
            const excerpt = m.subject || m.body || m.excerpt || '';
            const date = m.date || m.createdAt || new Date().toISOString();
            const isUnread = m.isRead === undefined ? !!m.unread : !m.isRead ? true : false;
            return (
              <MenuItem
                key={id}
                className="kn-menu-text"
                sx={{ py: 1.5 }}
                onClick={async () => {
                  try {
                    if (markAsRead) await markAsRead(id);
                  } catch (e) { /* ignore */ }
                  setAnchorMessages(null);
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>{sender}{isUnread ? '' : ''}</Typography>
                  {excerpt && (
                    <Typography variant="caption" color="text.secondary" display="block">{excerpt}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">{new Date(date).toLocaleString()}</Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </Box>
  );
}
