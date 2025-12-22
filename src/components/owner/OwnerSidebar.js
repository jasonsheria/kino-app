import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaHome, FaEnvelope, FaWallet, FaStar, FaSignOutAlt, FaUsers, FaCalendarAlt, FaFileAlt, FaUserCircle, FaShieldAlt, FaCog } from 'react-icons/fa';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import { useOwnerProfile } from '../../hooks/useOwnerProfile';
export default function OwnerSidebar({ collapsed }) {
  const location = useLocation();
  const { ownerProfile, loading, error } = useOwnerProfile();

  return (
    <Box >
      {!collapsed && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={ownerProfile?.profileUrl || ownerProfile?.Avatar || "" } />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                Propriétaire
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compte partenaire
              </Typography>
            </Box>
          </Box>
          <Divider />
        </Box>
      )}
        <List sx={{ px: 2 }}>
          {[
            { to: '/owner/dashboard', icon: <FaTachometerAlt />, label: 'Tableau de bord' },
            { to: '/owner/properties', icon: <FaHome />, label: 'Mes biens' },
            { to: '/owner/agents', icon: <FaUsers />, label: 'Agents' },
            { to: '/owner/appointments', icon: <FaCalendarAlt />, label: 'Rendez-vous' },
            // { to: '/owner/messages', icon: <FaEnvelope />, label: 'Messages' },
          ].map(({ to, icon, label }) => (
            <ListItem key={to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={to}
                selected={location.pathname === to}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 44,
                  color: location.pathname === to ? 'primary.main' : 'text.primary',
                  bgcolor: location.pathname === to ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 36,
                    color: location.pathname === to ? 'primary.main' : 'inherit'
                  }}
                >
                  {icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={label} />}
              </ListItemButton>
            </ListItem>
          ))}

          <Divider sx={{ my: 2 }} />

          {[
            { to: '/owner/profile', icon: <FaUserCircle />, label: 'Profil' },
            // { to: '/owner/wallet', icon: <FaWallet />, label: 'Wallet' },
            { to: '/owner/security', icon: <FaShieldAlt />, label: 'Sécurité' },
            // { to: '/owner/subscribe', icon: <FaStar />, label: 'Abonnement' },
          ].map(({ to, icon, label }) => (
            <ListItem key={to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={to}
                selected={location.pathname === to}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 44,
                  color: location.pathname === to ? 'primary.main' : 'text.primary',
                  bgcolor: location.pathname === to ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 36,
                    color: location.pathname === to ? 'primary.main' : 'inherit'
                  }}
                >
                  {icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={label} />}
              </ListItemButton>
            </ListItem>
          ))}

          <Divider sx={{ my: 2 }} />

          {[
            { to: '/owner/settings', icon: <FaCog />, label: 'Paramètres' },
            { to: '/owner/privacy', icon: <FaFileAlt />, label: 'Politique' },
          ].map(({ to, icon, label }) => (
            <ListItem key={to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={to}
                selected={location.pathname === to}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 44,
                  color: location.pathname === to ? 'primary.main' : 'text.primary',
                  bgcolor: location.pathname === to ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 36,
                    color: location.pathname === to ? 'primary.main' : 'inherit'
                  }}
                >
                  {icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={label} />}
              </ListItemButton>
            </ListItem>
          ))}

          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/"
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                <FaSignOutAlt />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Se déconnecter" />}
            </ListItemButton>
          </ListItem>
        </List>
    </Box>
  );
}
