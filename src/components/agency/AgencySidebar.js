import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBullhorn, FaBoxes, FaWallet, FaCog, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { currentAgencySession } from '../../api/agencies';
import { 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme
} from '@mui/material';

export default function AgencySidebar({ collapsed }){
  const session = currentAgencySession();
  const [counts, setCounts] = React.useState({ ads:0, products:0, txs:0 });

  React.useEffect(()=>{
    // if(!session) return;
    try{
      const store = JSON.parse(localStorage.getItem('ndaku_agencies')||'{}');
      const a = store[session.id] || {};
      setCounts({ ads: (a.ads||[]).length, products: (a.products||[]).length, txs: (a.transactions||[]).length });
    }catch(e){ setCounts({ ads:0, products:0, txs:0 }); }
  },[]);

  const theme = useTheme();
  
  const menuItems = [
    { icon: <FaTachometerAlt />, label: 'Tableau de bord', to: '/agency/dashboard' },
    { icon: <FaBullhorn />, label: 'Publicité', to: '/agency/ads', count: counts.ads },
    { icon: <FaBoxes />, label: 'Produits', to: '/agency/products', count: counts.products },
    { icon: <FaWallet />, label: 'Wallet', to: '/agency/wallet', count: counts.txs },
    { icon: <FaCog />, label: 'Paramètres', to: '/agency/settings' },
    { icon: <FaShieldAlt />, label: 'Sécurité', to: '/agency/security' },
    { icon: <FaShieldAlt />, label: 'Confidentialité', to: '/agency/privacy' },
    { icon: <FaUsers />, label: 'Agents', to: '/agency/agents', count: counts.agents }
  ];

  return (
    <List component="nav" sx={{ width: '100%', p: 0 }}>
      {menuItems.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          sx={{
            minHeight: 48,
            px: 2.5,
            '&.active': {
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.16)',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
            transition: 'all 0.2s',
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 36,
            color: 'inherit',
            '.active &': { color: 'white' }
          }}>
            {item.count > 0 ? (
              <Badge 
                badgeContent={item.count} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    right: -3,
                    top: 3,
                    padding: '0 4px',
                    bgcolor: theme.palette.error.main,
                    color: 'white'
                  }
                }}
              >
                {item.icon}
              </Badge>
            ) : item.icon}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText 
              primary={item.label}
              sx={{ 
                '& .MuiTypography-root': { 
                  transition: 'color 0.2s',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '.active &': { color: 'white' }
                }
              }}
            />
          )}
        </ListItemButton>
      ))}
    </List>
  );
}
