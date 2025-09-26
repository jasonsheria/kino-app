import React from 'react';
import OwnerSidebar from './OwnerSidebar';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import ProfileCard from './ProfileCard';
import { getDashboardMetrics } from '../../data/fakeMetrics';
import '../../styles/owner.css';
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
import OwnerProfile from '../../pages/OwnerProfile';

export default function OwnerLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = React.useState(!isMobile);
  const [anchorProfile, setAnchorProfile] = React.useState(null);
  const [anchorNotif, setAnchorNotif] = React.useState(null);
  const [anchorMessages, setAnchorMessages] = React.useState(null);
  const [ownerUnread, setOwnerUnread] = React.useState(0);
  const [metrics, setMetrics] = React.useState({ visits: 0, bookings: 0, revenue: 0 });

  React.useEffect(() => {
    const m = getDashboardMetrics('owner-123');
    setMetrics(m);
  }, []);

  const navigate = useNavigate();

  React.useEffect(() => {
    const ownerId = (() => { try { const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id ? String(d.id) : 'owner-123'; } catch(e){ return 'owner-123'; } })();
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
          width: { xs: '100%', md: `calc(100% - ${menuOpen ? drawerWidth : 0}px)` },
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
                badgeContent={3}
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
                src={OwnerProfile.profileUrl || ""}
                sx={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[2]
                }}
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        sx={{
          width: { dm : drawerWidth},
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
        <Toolbar /> {/* Space for the AppBar */}
        <OwnerSidebar collapsed={!menuOpen} />
      </Drawer>

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
        <MenuItem 
          onClick={() => {
            setAnchorProfile(null);
            navigate('/owner/profile');
          }} 
          sx={{ py: 1.5 }}
        >
          <FaUser style={{ marginRight: 12 }} />
          Éditer mon profil
        </MenuItem>
        <Divider />
        <MenuItem
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
          Se déconnecter
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
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          <MenuItem sx={{ py: 1.5 }}>
            <Box>
              <Typography variant="body2">
                Nouvelle demande de visite
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Il y a 30 minutes
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem sx={{ py: 1.5 }}>
            <Box>
              <Typography variant="body2">
                Message reçu — Marie
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Il y a 1 heure
              </Typography>
            </Box>
          </MenuItem>
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
          <Typography variant="subtitle1" fontWeight={600}>
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
