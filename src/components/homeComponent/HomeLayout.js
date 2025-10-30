import React, { useState, useEffect, useRef } from 'react';
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
  {
    id: 'notif1',
    title: 'Nouvelle réservation',
    message: 'Une nouvelle réservation a été effectuée pour votre appartement',
    unread: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 'notif2',
    title: 'Message reçu',
    message: 'Vous avez reçu un nouveau message concernant votre annonce',
    unread: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 'notif3',
    title: 'Paiement reçu',
    message: 'Le paiement de la réservation #1234 a été confirmé',
    unread: true,
    timestamp: new Date().toISOString()
  }
];
export default function HomeLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);
  const [menuOpen, setMenuOpen] = React.useState(!isMobile);
  const [anchorProfile, setAnchorProfile] = React.useState(null);
  const [anchorProp, setAnchorProp] = React.useState(null);
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
  const { notifications: realNotifications, removeNotification, markAllRead, markRead } = useNotifications();
  // Notifications provenant du contexte de messages (MessageContext)
  const { notification: messageNotifications, UnreadNotificationsCount, markNotificationAsRead } = useMessageContext();
  // Fusionner les notifications réelles avec les données de test comme fallback
  const notifications = [...(messageNotifications || []), ...(realNotifications || []), ...TEST_NOTIFICATIONS];

  // Style commun pour les icônes (géré via CSS .kn-icon)
  const { isConnected } = useWebSocket();
  const socketConnected = isConnected();

  React.useEffect(() => {
    const m = getDashboardMetrics('owner-123');
    setMetrics(m);
    console.log("dans le nav la status du socket", socketConnected)
  }, [socketConnected]);

  const navigate = useNavigate();

  React.useEffect(() => {
    const ownerId = (() => { try { const d = JSON.parse(localStorage.getItem('owner_request_draft') || 'null'); return d && d.id ? String(d.id) : 'owner-123'; } catch (e) { return 'owner-123'; } })();
    const load = () => {
      try {
        const msgs = JSON.parse(localStorage.getItem('owner_notifications_' + ownerId) || '[]');
        const unread = msgs.filter(m => m.unread !== false).length;
        setOwnerUnread(unread);
      } catch (e) { setOwnerUnread(0); }
    };
    load();
    const handler = () => { load(); };
    window.addEventListener('owner_notifications_updated', handler);
    window.addEventListener('ndaku-owner-message', handler);
    return () => { window.removeEventListener('owner_notifications_updated', handler); window.removeEventListener('ndaku-owner-message', handler); };
  }, []);

  const drawerWidth = 260;

  React.useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.grey[100] }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${!menuOpen ? drawerWidth : 0}px)` },
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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', marginRight: 12 }}>
            <img src="/img/logo.svg" alt="Kino App" style={{ width: 34, height: 34, marginRight: 8 }} />
            <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800 }}>K-App</Typography>
          </Link>

          {/* On mobile show a menu icon that opens the sidebar. On desktop we render the primary navigation in the topbar. */}
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
              <Button className="kn-menu-text" component={Link} to="/" color={location.pathname === '/' ? 'primary' : 'inherit'} sx={{ textTransform: 'none' }}>Accueil</Button>
              <Button className="kn-menu-text" component={Link} to="/about" color={location.pathname === '/about' ? 'primary' : 'inherit'} sx={{ textTransform: 'none' }}>À propos</Button>

              {/* Properties dropdown */}
              <Button
                id="properties-button"
                aria-controls={Boolean(anchorProp) ? 'properties-menu' : undefined}
                aria-haspopup="true"
                onClick={(e) => setAnchorProp(e.currentTarget)}
                color={['/voitures', '/terrain', '/appartement', '/salle'].includes(location.pathname) ? 'primary' : 'inherit'}
                className="kn-menu-text"
                sx={{ textTransform: 'none' }}
                endIcon={<FaChevronDown />}
              >
                Immobilier
              </Button>

              <Button className="kn-menu-text" component={Link} to="/contact" color={location.pathname === '/contact' ? 'primary' : 'inherit'} sx={{ textTransform: 'none' }}>Contact</Button>

              {/* Owner / Login CTAs on desktop */}
              <Button className="kn-menu-text" component={Link} to="/owner/onboard" variant="contained" color="primary" sx={{ ml: 2, fontWeight: 400 }}>
                Propriétaire
              </Button>
              {!user && (
                <Button className="kn-menu-text" component={Link} to="/login" variant="outlined" sx={{ ml: 1, fontWeight: 400 }}>
                  Connexion
                </Button>
              )}
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
            <IconButton
              size="small"
              onClick={(e) => setAnchorNotif(e.currentTarget)}
              sx={{
                bgcolor: 'transparent',
                '&:hover': { bgcolor: theme.palette.grey[100] }
              }}
            >
              <Badge
                  badgeContent={UnreadNotificationsCount || 0}
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
                badgeContent={ownerUnread}
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
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 3,
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
        {user &&
          <MenuItem
            className="kn-menu-text"
            onClick={() => {
              setAnchorProfile(null);
              navigate('/profile');
            }}
            sx={{ py: 1.5 }}
          >
            <FaUser style={{ marginRight: 12 }} />
            <span style={{ fontWeight: 400 }}>Profil</span>
          </MenuItem>
        }
        <Divider />
        {user &&
          <MenuItem
            className="kn-menu-text"
            onClick={() => {
              localStorage.removeItem('ndaku_auth_token');
              navigate('/');
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
          </MenuItem>
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
      >
        <MenuItem className="kn-menu-text" component={Link} to="/voitures" onClick={() => setAnchorProp(null)}>
          <FaCar style={{ marginRight: 8 }} /> <span style={{ fontWeight: 400 }}>Voitures</span>
        </MenuItem>
        <MenuItem className="kn-menu-text" component={Link} to="/terrain" onClick={() => setAnchorProp(null)}>
          <FaTree style={{ marginRight: 8 }} /> <span style={{ fontWeight: 400 }}>Terrain</span>
        </MenuItem>
        <MenuItem className="kn-menu-text" component={Link} to="/appartement" onClick={() => setAnchorProp(null)}>
          <FaBuilding style={{ marginRight: 8 }} /> <span style={{ fontWeight: 400 }}>Appartement</span>
        </MenuItem>
        <MenuItem className="kn-menu-text" component={Link} to="/salle" onClick={() => setAnchorProp(null)}>
          <FaGlassCheers style={{ marginRight: 8 }} /> <span style={{ fontWeight: 400 }}>Salle de fête</span>
        </MenuItem>
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
          {/* Render notifications from MessageContext (with sensible fallbacks for shape) */}
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
                  sx={{ py: 1.5 }}
                  onClick={async () => {
                    try {
                      // mark as read in MessageContext if available
                      if (markNotificationAsRead) {
                        markNotificationAsRead(id);
                      }
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
          <MenuItem sx={{ py: 1.5 }}>
            <Box>
              <Typography variant="body2">
                Jean: Intéressé par la visite
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Il y a 15 minutes
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem sx={{ py: 1.5 }}>
            <Box>
              <Typography variant="body2">
                Marie: Besoin d'infos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Il y a 2 heures
              </Typography>
            </Box>
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
}
