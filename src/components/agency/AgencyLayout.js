import React from 'react';
import AgencySidebar from './AgencySidebar';
import { useNavigate, Link } from 'react-router-dom';
import { currentAgencySession, fetchAgency, logoutAgency } from '../../api/agencies';
import { FaBell, FaEnvelope, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { 
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function AgencyLayout({ children }){
  const [collapsed, setCollapsed] = React.useState(false);
  const [agency, setAgency] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(()=>{
    const session = currentAgencySession();
    if(!session) return; // keep non-blocking; login handled elsewhere
    (async ()=>{
      const a = await fetchAgency(session.id);
      if(a) setAgency(a);
    })();

    // simulate realtime notifications/messages arriving
    const n1 = setInterval(()=>{
      setNotifications(prev => [
        ...(prev||[]).slice(0,4),
        { id: Date.now().toString(), text: 'Nouvelle visite sur une annonce', time: 'maintenant' }
      ]);
      setMessages(prev => (prev||[]).slice(0,4));
    }, 15000);
    return () => clearInterval(n1);
  }, []);

  const handleLogout = ()=>{ logoutAgency(); navigate('/agency/login'); };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const drawerWidth = collapsed ? 72 : 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar for mobile */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={isMobile ? !collapsed : true}
        onClose={() => setCollapsed(true)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            background: 'linear-gradient(180deg, var(--ndaku-primary), #10a37f)',
            color: 'white',
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          p: 2
        }}>
          {/* Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: collapsed ? 'center' : 'space-between',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="/logo192.png" alt="logo" style={{ width: 40, height: 40, borderRadius: 8 }} />
              {!collapsed && (
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  NDAKU
                </Typography>
              )}
            </Box>
            {!isMobile && (
              <IconButton
                onClick={() => setCollapsed(!collapsed)}
                sx={{ 
                  color: 'white',
                  display: collapsed ? 'none' : 'flex',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            )}
          </Box>

          {/* Sidebar Content */}
          <AgencySidebar collapsed={collapsed} />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: isMobile ? 0 : drawerWidth,
      }}>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setCollapsed(!collapsed)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
              {agency ? agency.name : 'Agence'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="large" color="default">
                <Badge badgeContent={notifications.length} color="error">
                  <FaBell size={20} />
                </Badge>
              </IconButton>

              <IconButton 
                component={Link} 
                to="/agency/messages" 
                size="large" 
                color="default"
              >
                <Badge badgeContent={messages.length} color="success">
                  <FaEnvelope size={20} />
                </Badge>
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={agency?.avatar || '/logo192.png'}
                  alt="avatar"
                  sx={{ width: 36, height: 36, cursor: 'pointer' }}
                  onClick={handleClick}
                />

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} to="/agency/profile" onClick={handleClose}>
                    Profil
                  </MenuItem>
                  <MenuItem component={Link} to="/agency/settings" onClick={handleClose}>
                    Paramètres
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); handleLogout(); }} sx={{ color: 'error.main' }}>
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
