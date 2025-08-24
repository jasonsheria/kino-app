import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, ListItemText, ListItemAvatar, Avatar, Badge, Divider } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { saveAppointment } from '../../api/appointments';

function ownerIdFromDraft(){ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id ? String(d.id) : 'owner-123'; }catch(e){ return 'owner-123'; } }

const Header = ({ mode, toggleMode }) => {
  const ownerId = ownerIdFromDraft();
  const [anchor, setAnchor] = useState(null);
  const [notifications, setNotifications] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(`owner_notifications_${ownerId}`)) || []; }catch(e){ return []; } });

  useEffect(()=>{
    const handler = () => { try{ const n = JSON.parse(localStorage.getItem(`owner_notifications_${ownerId}`)) || []; setNotifications(n); }catch(e){} };
    window.addEventListener('owner_notifications_updated', handler);
    return ()=> window.removeEventListener('owner_notifications_updated', handler);
  },[ownerId]);

  const open = Boolean(anchor);
  const handleOpen = (e)=> setAnchor(e.currentTarget);
  const handleClose = ()=> setAnchor(null);

  const removeNotification = (id)=>{
    try{ const cur = JSON.parse(localStorage.getItem(`owner_notifications_${ownerId}`)) || []; const updated = cur.filter(x=> x.id !== id); localStorage.setItem(`owner_notifications_${ownerId}`, JSON.stringify(updated)); window.dispatchEvent(new Event('owner_notifications_updated')); setNotifications(updated); }catch(e){}
  };

  const acceptProposal = async (n)=>{
    try{
      const appt = { id: 'a'+Math.random().toString(36).slice(2,9), ownerId, date: n.date, time: n.time, guestName: n.guestName, propertyId: n.propertyId || 'p1', note: n.note || 'Accepté', status: 'confirmed' };
      await saveAppointment(ownerId, appt).catch(()=>{});
      removeNotification(n.id);
    }catch(e){ console.error(e); }
  };

  const refuseProposal = (n)=>{ removeNotification(n.id); };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Ndaku Immobilier
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={handleOpen} aria-controls={open? 'notif-menu' : undefined} aria-haspopup="true">
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu id="notif-menu" anchorEl={anchor} open={open} onClose={handleClose} PaperProps={{ sx: { width: 320 } }}>
            <MenuItem disabled>
              <ListItemText primary="Notifications" secondary={`${notifications.length} nouvelle(s)`} />
            </MenuItem>
            <Divider />
            {notifications.length===0 && <MenuItem><ListItemText primary="Aucune notification" /></MenuItem>}
            {notifications.map(n => (
              <MenuItem key={n.id} sx={{ alignItems: 'flex-start' }}>
                <ListItemAvatar>
                  <Avatar>{n.guestName? n.guestName[0] : 'U'}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={`${n.date} ${n.time} — ${n.guestName}`} secondary={n.note} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                  <IconButton size="small" color="success" onClick={()=> { acceptProposal(n); }}><CheckCircleIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={()=> { refuseProposal(n); }}><CloseIcon fontSize="small" /></IconButton>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          <IconButton color="inherit" onClick={toggleMode}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
