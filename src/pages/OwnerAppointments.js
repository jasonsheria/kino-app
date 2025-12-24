

import React, { useEffect, useMemo, useRef, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getAppointmentsForOwner as getLocalAppts } from '../data/fakeAppointments';
import MessengerWidget from '../components/common/Messenger';
import {
  Box, Grid, Paper, Stack, Typography, TextField, Button, useTheme, useMediaQuery,
  IconButton, Grow, Switch, FormControlLabel, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip, Divider, Tabs, Tab, Badge, Tooltip
} from '@mui/material';
import { Print as PrintIcon, FileDownload as FileDownloadIcon, Block as BlockIcon, Delete as DeleteIcon, Add as AddIcon, ChevronLeft, ChevronRight, Today as TodayIcon, ViewModule as ViewMonthIcon, ViewWeek as ViewWeekIcon, ViewDay as ViewDayIcon, Add as AddFabIcon, Check as CheckIcon, Phone as PhoneIcon, Message as MessageIcon } from '@mui/icons-material';
import { FaWhatsapp } from 'react-icons/fa';
import { Fab, Skeleton } from '@mui/material';
import { useNotifications } from '../contexts/NotificationContext';
import { alpha } from '@mui/material/styles';

import { saveAppointment, updateAppointment } from '../data/fakeAppointments';
import { confirmReservation, rejectReservation, fetchAppointments } from '../api/appointments';
import {tronquerTexte } from '../utils/util'
// Fonctions locales pour manipuler les rendez-vous fakeAppointments

function ownerIdFromDraft() { try { const d = JSON.parse(localStorage.getItem('owner_request_draft') || 'null'); return d && d.id ? String(d.id) : 'owner-123'; } catch (e) { return 'owner-123'; } }

export default function OwnerAppointments() {
  const ownerId = ownerIdFromDraft();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockMode, setBlockMode] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const { notifications: allNotifications = [] } = useNotifications();
  const [notifications, setNotifications] = useState(() => { try { return allNotifications.filter(n => String(n.userId) === String(ownerId)); } catch (e) { return []; } });

  const [filterProperty, setFilterProperty] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' });
  // Pour éviter les updates infinis
  const lastFilter = useRef({ filterProperty: 'all', from: '', to: '' });

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [proposalDialog, setProposalDialog] = useState(null);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [selectedContactForMessenger, setSelectedContactForMessenger] = useState(null);
  const [webrtcModalOpen, setWebrtcModalOpen] = useState(false);
  const [selectedContactForCall, setSelectedContactForCall] = useState(null);

  const calendarRef = useRef(null);

  useEffect(() => { try { localStorage.setItem(`owner_blocked_${ownerId}`, JSON.stringify(blockedDates)); } catch (e) { } }, [blockedDates, ownerId]);
  // Keep notifications in sync with NotificationContext
  useEffect(() => {
    try {
      setNotifications(allNotifications.filter(n => String(n.userId) === String(ownerId)));
    } catch (e) { setNotifications([]); }
  }, [allNotifications, ownerId]);

  useEffect(() => {
    const el = document.querySelectorAll('.appt-card');
    el.forEach((n) => { n.style.transform = 'translateY(8px)'; n.style.transition = 'transform .36s cubic-bezier(.2,.9,.2,1)'; });
    setTimeout(() => el.forEach((n) => { n.style.transform = 'translateY(0)'; }), 80);
  }, [appts.length]);

  // Calculer les rendez-vous filtrés AVANT leur utilisation
  const filtered = appts.filter(a => (filterProperty === 'all' || a.propertyId === filterProperty) && (!range.from || a.date >= range.from) && (!range.to || a.date <= range.to));
  const unconfirmed = filtered.filter(a => a.status == 'pending' && a.status !== 'cancelled');
  const confirmed = filtered.filter(a => a.status === 'confirmed');

  const events = useMemo(() => filtered.map(a => ({ id: a.id, title: `${a.time} • ${a.name || a.guestName || 'Visiteur'}`, start: `${a.date}T${a.time}:00`, extendedProps: a })), [filtered]);
  const blockedEvents = useMemo(() => blockedDates.map(b => ({ id: `b-${b.id}`, title: 'Occupé', start: `${b.date}T00:00:00`, allDay: true, extendedProps: { blocked: true, ...b } })), [blockedDates]);
  const proposalEvents = useMemo(() => notifications.filter(n => n.type === 'proposal').map(n => ({ id: `p-${n.id}`, title: `${n.time} • Proposition • ${n.name || n.guestName || 'Visiteur'}`, start: `${n.date}T${n.time}:00`, extendedProps: { proposal: true, ...n } })), [notifications]);

  const mergedEvents = useMemo(() => [...blockedEvents, ...proposalEvents, ...events], [blockedEvents, proposalEvents, events]);

  const [calendarTitle, setCalendarTitle] = useState('');

  const handleEventClick = async (clickInfo) => {
    // const ext = clickInfo.event.extendedProps || {};
    // if (ext.proposal) {
    //   const nid = ext.id || ext.notificationId || null;
    //   const notif = notifications.find(n => String(n.id) === String(nid) || String(n.id) === String(ext.id));
    //   if (notif) setProposalDialog(notif);
    //   return;
    // }
    // const existing = appts.find(x => String(x.id) === String(clickInfo.event.id));
    // if (!existing) return;
    // const nextStatus = existing.status === 'confirmed' ? 'pending' : 'confirmed';
    // await updateAppointment(ownerId, existing.id, { status: nextStatus }).catch(() => { });
    // setAppts(s => s.map(x => x.id === existing.id ? { ...x, status: nextStatus } : x));
  };

  const confirm = async (id) => {
    try {
      await confirmReservation(id);
      setAppts(s => s.map(x => x.id === id ? { ...x, status: 'confirmed' } : x));
    } catch (e) { }
  };
  const cancel = async (id) => {
    try {
      await rejectReservation(id);
      setAppts(s => s.map(x => x.id === id ? { ...x, status: 'cancelled' } : x));
    } catch (e) { }
  };

  const onDateSelect = (selectInfo) => {
    const date = selectInfo.startStr.slice(0, 10);
    const time = selectInfo.startStr.slice(11, 16);
    setBookingDraft({ date, time, propertyId: filterProperty === 'all' ? null : filterProperty });
    setBookingDialogOpen(true);
  };

  const properties = useMemo(() => {
    const set = new Set(appts.map(a => a.propertyId).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [appts]);

  const [rightTab, setRightTab] = useState(0);
  const rightTabs = [
    { label: <Badge color="error" badgeContent={unconfirmed.length}>Non confirmés</Badge> },
    { label: <Badge color="success" badgeContent={confirmed.length}>Confirmés</Badge> },
    { label: `Bloqués (${blockedDates.length})` }
  ];

  // Fonction pour actualiser les rendez-vous (fetch direct depuis l'API / simulation)
  const [lastFetchSource, setLastFetchSource] = useState(null);
  const refreshAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      console.debug('[OwnerAppointments] refreshAppointments ownerId=', ownerId);
      let data = [];
      let usedSource = 'remote';
      try {
        data = await fetchAppointments(ownerId);
        console.debug('[OwnerAppointments] fetchAppointments returned length=', Array.isArray(data) ? data.length : 'non-array');
      } catch (e) {
        console.warn('[OwnerAppointments] fetchAppointments failed, falling back to local store', e);
        data = getLocalAppts(ownerId) || [];
        usedSource = 'local-fetch-error-fallback';
      }

      // Normalize received appointments
      let mapped = (Array.isArray(data) ? data : []).map(a => ({
        id: a.id || a._id || String(a._id || a.id || Math.random()).slice(2),
        date: a.date || a.createdAt || a.created_at || null,
        time: a.time || a.heure || null,
        guestName: a.guestName || a.name || a.userName || null,
        propertyId: a.propertyId || a.property || (a.property && (a.property._id || a.property.id)) || null,
        status: a.status || 'pending',
        ownerId: a.ownerId || a.owner || a.owner_id || null,
        note: a.note || a.notes || '',
        name: a.name || a.guestName || 'Visiteur'
      }));

      // If remote returned empty but local store has entries, prefer local
      if ((!Array.isArray(mapped) || mapped.length === 0)) {
        const local = getLocalAppts(ownerId) || [];
        if (Array.isArray(local) && local.length > 0) {
          console.warn('[OwnerAppointments] remote returned 0; using local store with', local.length, 'items');
          mapped = local.map(a => ({
            id: a.id || a._id || String(a._id || a.id || Math.random()).slice(2),
            date: a.date || a.createdAt || a.created_at || null,
            time: a.time || a.heure || null,
            guestName: a.guestName || a.name || a.userName || null,
            propertyId: a.propertyId || a.property || (a.property && (a.property._id || a.property.id)) || null,
            status: a.status || 'pending',
            ownerId: a.ownerId || a.owner || a.owner_id || null,
            note: a.note || a.notes || '',
            name: a.name || a.guestName || 'Visiteur'
          }));
          usedSource = 'local-fallback';
        } else {
          usedSource = usedSource || 'empty';
        }
      } else {
        usedSource = usedSource || 'remote';
      }

      setAppts(mapped);
      setBlockedDates(mapped.filter(a => a.status === 'cancelled'));
      setLastFetchSource(usedSource);

      // keep backward compatibility for components listening to this event
      try { window.dispatchEvent(new CustomEvent('ndaku:appointments-updated', { detail: { appointments: mapped } })); } catch (e) { }
    } catch (e) {
      console.error('Erreur lors du rafraîchissement des rendez-vous:', e);
      // fallback to local read
      try {
        const local = getLocalAppts(ownerId) || [];
        setAppts(local);
        setBlockedDates(local.filter(a => a.status === 'cancelled'));
        setLastFetchSource('local-fallback-exception');
      } catch (err2) {
        setLastFetchSource('error');
      }
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Actualiser les rendez-vous au chargement de la page
  useEffect(() => {
    refreshAppointments();
  }, [ownerId, refreshAppointments]);

  // Écouter les mises à jour asynchrones des rendez-vous depuis le module de données
  useEffect(() => {
    const onApptsUpdated = (ev) => {
      try {
        const aps = ev && ev.detail && Array.isArray(ev.detail.appointments) ? ev.detail.appointments : null;
        if (aps) {
          setAppts(aps.map(a => ({ ...a, status: a.status })));
          setBlockedDates(aps.filter(a => a.status === 'cancelled'));
          setLoading(false);
        } else {
          // fallback: re-read local store
          refreshAppointments();
        }
      } catch (e) {
        console.error('Erreur en traitant ndaku:appointments-updated', e);
      }
    };
    window.addEventListener('ndaku:appointments-updated', onApptsUpdated);

    // Ensure we re-read appointments immediately after attaching listener so we don't miss
    // an earlier dispatch that happened before mount (module-level fetch may have finished).
    try {
      refreshAppointments();
    } catch (e) {
      console.error('Error refreshing appointments after attaching listener', e);
    }

    return () => window.removeEventListener('ndaku:appointments-updated', onApptsUpdated);
  }, [refreshAppointments]);

  const stats = useMemo(() => ({
    total: appts.length,
    confirmed: appts.filter(a => a.status === 'confirmed').length,
    pending: appts.filter(a => a.status === 'pending').length,
    blocked: blockedDates.length
  }), [appts, blockedDates]);

  return (
    <OwnerLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        {/* Header + actions */}
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ mb: 3, width: '100%' }}>
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mb: .5 }}>Rendez-vous</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>Gérez vos rendez‑vous, bloquez des jours et traitez les propositions.</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 }, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button startIcon={<FileDownloadIcon />} size="small" variant="outlined" sx={{ minWidth: 36, px: 1 }}>Exporter</Button>
            <Button startIcon={<PrintIcon />} size="small" variant="outlined" sx={{ minWidth: 36, px: 1 }}>Imprimer</Button>
            <Button startIcon={<AddIcon />} size="small" variant="contained" color="primary" sx={{ minWidth: 36, px: 1, fontWeight: 700 }} onClick={() => { setBookingDraft({ date: '', time: '09:00', propertyId: null, guestName: '' }); setBookingDialogOpen(true); }}>Ajouter</Button>
          </Stack>
        </Stack>

        {/* Summary cards */}
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 3 }}>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            {[{
              label: 'Total rendez-vous', value: stats.total, color: theme.palette.primary.dark,
            }, {
              label: 'Confirmés', value: stats.confirmed, color: theme.palette.success.dark
            }, {
              label: 'En attente', value: stats.pending, color: theme.palette.warning.dark, 
            }, {
              label: 'Jours bloqués', value: stats.blocked, color: theme.palette.text.primary, 
            }].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={c.label} sx={{ display: 'flex', width: '47.5%', justifyContent: 'center' }}>
                <Paper elevation={2} sx={{ p: 2.5, minHeight: 120, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: c.bg, boxShadow: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5, color: c.color }}>{c.label}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: c.color }}>{c.value}</Typography>
                </Paper>
              </Grid>
            ))}

            {/* design des boutton */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{
                p: 3,
                border: `1.5px solid ${theme.palette.primary.light}`,
                minHeight: 120,
                bgcolor: theme.palette.background.paper,
                borderRadius: 3,
                boxShadow: '0 4px 16px 0 rgba(56,189,248,0.10)'
              }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                    <TextField
                      select
                      size="medium"
                      fullWidth
                      value={filterProperty}
                      onChange={e => {
                        if (lastFilter.current.filterProperty !== e.target.value) {
                          setFilterProperty(e.target.value);
                          lastFilter.current.filterProperty = e.target.value;
                        }
                      }}
                      SelectProps={{ native: true }}
                      sx={{
                        borderRadius: 0,
                        background: theme.palette.grey[50],
                        '& fieldset': { borderColor: theme.palette.primary.light },
                        fontWeight: 700,
                        fontSize: 16
                      }}
                    >
                      {properties.map(p => {
                        const val = p === 'all' ? 'all' : (typeof p === 'object' ? (p._id || p.id || String(p)) : p);
                        const label = p === 'all' ? 'Toutes les propriétés' : (typeof p === 'object' ? (p.titre || p.name || p._id || String(p)) : p);
                        return <option key={val} value={val}>{tronquerTexte(label, 25)}</option>;
                      })}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={3} sx={{ width: '100%' }}>
                    <TextField
                      size="medium"
                      type="date"
                      fullWidth
                      value={range.from}
                      onChange={e => {
                        if (lastFilter.current.from !== e.target.value) {
                          setRange(r => ({ ...r, from: e.target.value }));
                          lastFilter.current.from = e.target.value;
                        }
                      }}
                      sx={{ borderRadius: 0, background: theme.palette.grey[50], '& fieldset': { borderColor: theme.palette.primary.light }, fontWeight: 700, fontSize: 16 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} sx={{ width: '100%' }}>
                    <TextField
                      size="medium"
                      type="date"
                      fullWidth
                      value={range.to}
                      onChange={e => {
                        if (lastFilter.current.to !== e.target.value) {
                          setRange(r => ({ ...r, to: e.target.value }));
                          lastFilter.current.to = e.target.value;
                        }
                      }}
                      sx={{ borderRadius: 0, background: theme.palette.grey[50], '& fieldset': { borderColor: theme.palette.primary.light }, fontWeight: 700, fontSize: 16 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={blockMode}
                            onChange={e => setBlockMode(e.target.checked)}
                            color="warning"
                            sx={{
                              '& .MuiSwitch-thumb': { backgroundColor: blockMode ? theme.palette.warning.main : theme.palette.grey[300] },
                              '& .MuiSwitch-track': { backgroundColor: blockMode ? theme.palette.warning.light : theme.palette.grey[200] }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: blockMode ? theme.palette.warning.dark : theme.palette.text.secondary }}>
                            <BlockIcon sx={{ fontSize: 18, mr: 1, color: blockMode ? theme.palette.warning.dark : theme.palette.text.secondary }} />
                            Marquer occupé
                          </Box>
                        }
                        sx={{ ml: 0, mr: 0 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Main content */}
        <Grid container spacing={3} sx={{ width: '100%' }}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2,  width: '100%', minHeight: 520, bgcolor: theme.palette.background.paper, boxShadow: 0}}>
              {/* Custom toolbar above calendar for precise layout */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, width: '100%' }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ gap: 1 }}>
                  <IconButton size="small" onClick={() => calendarRef.current?.getApi().prev()}><ChevronLeft /></IconButton>
                  <IconButton size="small" onClick={() => calendarRef.current?.getApi().next()}><ChevronRight /></IconButton>
                  <Button size="small" startIcon={<TodayIcon />} sx={{ px: 1, minWidth: 36 }} onClick={() => calendarRef.current?.getApi().today()}>aujourd'hui</Button>
                </Stack>

                {/* <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.primary.dark }}>{calendarTitle}</Typography> */}

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ gap: 1 }}>
                  <IconButton size="small" onClick={() => calendarRef.current?.getApi().changeView('dayGridMonth')} title="Mois"><ViewMonthIcon /></IconButton>
                  <IconButton size="small" onClick={() => calendarRef.current?.getApi().changeView('timeGridWeek')} title="Semaine"><ViewWeekIcon /></IconButton>
                  {/* <IconButton size="small" onClick={() => calendarRef.current?.getApi().changeView('timeGridDay')} title="Jour"><ViewDayIcon /></IconButton> */}
                </Stack>
              </Box>

              {isMobile && loading && (
                <Skeleton variant="rectangular" height={520} animation="wave" />
              )}
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={mergedEvents}
                eventClick={handleEventClick}
                selectable={true}
                select={onDateSelect}
                ref={calendarRef}
                height={isMobile ? 520 : 720}
                datesSet={(info) => setCalendarTitle(info.view.title)}
                eventContent={(arg) => {
                  const ext = arg.event.extendedProps || {};
                  return (
                    <div style={{ padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{arg.event.title}</div>
                      {ext.blocked && <div style={{ fontSize: 11, color: '#666' }}>⚑</div>}
                    </div>
                  );
                }}
                eventDidMount={(info) => {
                  info.el.setAttribute('title', info.event.title + ' — ' + (info.event.extendedProps.note || ''));
                  const status = info.event.extendedProps.status;
                  if (status === 'confirmed') info.el.style.background = '#d1fae5';
                  if (status === 'cancelled') info.el.style.opacity = '0.5';
                  if (info.event.extendedProps.blocked) { info.el.style.background = '#f5f5f5'; info.el.style.border = '1px solid #ddd'; }
                  if (info.event.extendedProps.proposal) { info.el.style.background = '#fff8dc'; info.el.style.border = '1px solid #f0c36d'; }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ overflow: 'hidden', width: '100%', bgcolor: theme.palette.background.paper }}>
              <Tabs value={rightTab} onChange={(e, v) => setRightTab(v)} variant="fullWidth" sx={{ width: '100%' }}>
                {rightTabs.map((tab, i) => <Tab key={i} label={tab.label} sx={{ fontWeight: 700, fontSize: 16, textTransform: 'none', letterSpacing: 0.5 }} />)}
              </Tabs>
              <Divider />
              <Box sx={{ p: 2, minHeight: 320, maxHeight: 640, overflowY: 'auto', width: '100%' }}>
                {/* Tableau filtré par statut, tous affichés */}
                <Box>
                  {loading && (
                    <Stack spacing={1}>
                      <Skeleton variant="rectangular" height={64} />
                      <Skeleton variant="rectangular" height={64} />
                    </Stack>
                  )}
                  { !loading && unconfirmed.length + confirmed.length + blockedDates.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Aucun rendez-vous à afficher</Typography>
                  )}
                  {/* Confirmés */}
                  {rightTab===1 && !loading && confirmed.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.success.dark, mb: 1 }}>Confirmés</Typography>
                      {confirmed.map(a => (
                        <Paper key={a.id} sx={{ gap:12 ,p: 1.5, mb: 1.5,  bgcolor: "linear-gradient(135deg, #5a97ef 0%, #3d7fd5 100%)", boxShadow: 'rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px'}}>
                          <Stack direction="column" spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#4a4d4c' }}>{a.date} {a.time}</Typography>
                                <Typography variant="body2" sx={{ color: '#4a4d4c' }}>{a.name || a.guestName || 'Visiteur'} • {a.propertyId && typeof a.propertyId === 'object' ? a.propertyId.titre || a.propertyId._id || '—' : a.propertyId || '—'}</Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} sx={{ minWidth: 40 }}>
                                <Tooltip title="Annuler" arrow>
                                  <IconButton size="small" sx={{ border :'1px solid' ,bgcolor: 'rgba(255,255,255,0.15)', color: '#4a4d4c', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }} onClick={() => cancel(a.id)}>
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                            {/* Contact Buttons - Premium Style */}
                            <Stack direction="row" spacing={0.75} sx={{ width: '100%', pt: 0.5 }}>
                              <Tooltip title="Appel vidéo (WebRTC)" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    border : "1px solid",
                                    flex: 1,
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: 'rgba(255,255,255,0.25)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    setSelectedContactForCall(a);
                                    setWebrtcModalOpen(true);
                                  }}
                                >
                                  <PhoneIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Envoyer un message" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    flex: 1,
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: 'rgba(255,255,255,0.25)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    setSelectedContactForMessenger(a);
                                    setMessengerOpen(true);
                                  }}
                                >
                                  <MessageIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="WhatsApp" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    flex: 1,
                                    bgcolor: '#25D366',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: '#20BA58',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    const phoneNumber = a.phone || '250788000000';
                                    window.open(`https://wa.me/${phoneNumber}?text=Bonjour ${a.name}, j'ai un rendez-vous le ${a.date} à ${a.time}. Pouvez-vous confirmer votre présence ?`, '_blank');
                                  }}
                                >
                                  <FaWhatsapp style={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </>
                  )}
                  {/* En attente */}
                  {rightTab===0 && !loading && unconfirmed.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.warning.dark, mb: 1 }}>En attente</Typography>
                      {unconfirmed.map(a => (
                        <Paper key={a.id} sx={{ p: 1.5, mb: 1.5, boxShadow: 'rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px' }}>
                          <Stack direction="column" spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#fff' }}>{a.date} {a.time}</Typography>
                                <Typography variant="body2" sx={{ color: '#4a4d4c' }}>{a.name || a.guestName || 'Visiteur'} • {a.propertyId && typeof a.propertyId === 'object' ? a.propertyId.titre || a.propertyId._id || '—' : a.propertyId || '—'}</Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} sx={{ minWidth: 90 }}>
                                <Tooltip title="Confirmer" arrow>
                                  <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#4a4d4c', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }} onClick={() => confirm(a.id)}>
                                    <CheckIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Annuler" arrow>
                                  <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#4a4d4c', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }} onClick={() => cancel(a.id)}>
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                            {/* Contact Buttons - Premium Style */}
                            <Stack direction="row" spacing={0.75} sx={{ width: '100%', pt: 0.5 }}>
                              <Tooltip title="Appel vidéo (WebRTC)" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    flex: 1,
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: 'rgba(255,255,255,0.25)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    setSelectedContactForCall(a);
                                    setWebrtcModalOpen(true);
                                  }}
                                >
                                  <PhoneIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Envoyer un message" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    flex: 1,
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: 'rgba(255,255,255,0.25)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    setSelectedContactForMessenger(a);
                                    setMessengerOpen(true);
                                  }}
                                >
                                  <MessageIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="WhatsApp" arrow placement="top">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    flex: 1,
                                    bgcolor: '#25D366',
                                    color: '#fff',
                                    borderRadius: 1.2,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    gap: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': { 
                                      bgcolor: '#20BA58',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                  }} 
                                  onClick={() => {
                                    const phoneNumber = a.phone || '250788000000';
                                    window.open(`https://wa.me/${phoneNumber}?text=Bonjour ${a.name}, j'ai un rendez-vous le ${a.date} à ${a.time}. Pouvez-vous confirmer votre présence ?`, '_blank');
                                  }}
                                >
                                  <FaWhatsapp style={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </>
                  )}
                  {/* Bloqués */}
                  {rightTab===2 && blockedDates.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 1 }}>Jours bloqués</Typography>
                      {blockedDates.map(b => (
                        <Paper key={b.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.palette.warning.light, boxShadow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.18) }}><BlockIcon /></Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 800, color: theme.palette.warning.dark }}>{b.date}{b.propertyId ? ` — ${typeof b.propertyId === 'object' ? b.propertyId.titre || b.propertyId._id || '—' : b.propertyId}` : ''}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{b.note}</Typography>
                            </Box>
                          </Box>
                          <IconButton size="small" sx={{ color: theme.palette.error.main }} onClick={() => setBlockedDates(s => s.filter(x => x.id !== b.id))}><DeleteIcon /></IconButton>
                        </Paper>
                      ))}
                    </>
                  )}
                </Box>
                
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Booking dialog */}
        <Dialog open={bookingDialogOpen} onClose={() => { setBookingDialogOpen(false); setBookingDraft(null); }} fullWidth maxWidth="sm">
          <DialogTitle>{blockMode ? 'Marquer jour occupé' : 'Nouvelle réservation'}</DialogTitle>
          <DialogContent>
            {bookingDraft && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <TextField label="Date" size="small" value={bookingDraft.date} InputProps={{ readOnly: true }} />
                <TextField label="Heure" size="small" value={bookingDraft.time} InputProps={{ readOnly: true }} />
                <TextField label="Propriété" size="small" value={bookingDraft.propertyId && typeof bookingDraft.propertyId === 'object' ? bookingDraft.propertyId.titre || bookingDraft.propertyId._id || '—' : bookingDraft.propertyId || 'Toutes'} InputProps={{ readOnly: true }} />
                {!blockMode && <TextField label="Nom du visiteur / motif" size="small" value={bookingDraft.guestName || ''} onChange={e => {
                  if (!bookingDraft.guestName || bookingDraft.guestName !== e.target.value) setBookingDraft(d => ({ ...d, guestName: e.target.value }));
                }} />}
                {blockMode && <TextField label="Note (optionnel)" size="small" value={bookingDraft.note || ''} onChange={e => {
                  if (!bookingDraft.note || bookingDraft.note !== e.target.value) setBookingDraft(d => ({ ...d, note: e.target.value }));
                }} />}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setBookingDialogOpen(false); setBookingDraft(null); }} sx={{ borderRadius: 1 }}>Annuler</Button>
            <Button onClick={async () => {
              if (!bookingDraft) return;
              const date = bookingDraft.date; const time = bookingDraft.time; const pid = bookingDraft.propertyId;
              if (blockMode) {
                if (blockedDates.find(b => b.date === date && (b.propertyId === null || b.propertyId === pid))) { window.alert('Date déjà marquée occupée'); return; }
                const id = 'b' + Math.random().toString(36).slice(2, 9);
                const blocked = { id, date, propertyId: pid, note: bookingDraft.note || 'Bloqué manuellement' };
                setBlockedDates(s => [blocked, ...s]);
                setBookingDialogOpen(false); setBookingDraft(null); return;
              }
              if (blockedDates.find(b => b.date === date && (b.propertyId === null || b.propertyId === pid))) { window.alert('Cette date est marquée occupée.'); return; }
              if (!bookingDraft.guestName) { window.alert('Veuillez saisir le nom du visiteur.'); return; }
              const id = 'a' + Math.random().toString(36).slice(2, 9);
              const appt = { id, ownerId, date, time, guestName: bookingDraft.guestName, propertyId: pid || 'p1', note: bookingDraft.note || 'Ajouté via calendrier', status: 'pending' };
              await saveAppointment(ownerId, appt).catch(() => { });
              setAppts(s => [...s, appt]);
              setBookingDialogOpen(false); setBookingDraft(null);
            }} variant="contained" sx={{ borderRadius: 1 }}>{blockMode ? 'Marquer' : 'Ajouter'}</Button>
          </DialogActions>
        </Dialog>

        {/* Proposal dialog */}
        <Dialog open={!!proposalDialog} onClose={() => setProposalDialog(null)} fullWidth maxWidth="sm">
          <DialogTitle>Proposition de rendez-vous</DialogTitle>
          <DialogContent>
            {proposalDialog && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <TextField label="Proposition par" size="small" value={proposalDialog.guestName} InputProps={{ readOnly: true }} />
                <TextField label="Date" size="small" value={proposalDialog.date} InputProps={{ readOnly: true }} />
                <TextField label="Heure" size="small" value={proposalDialog.time} InputProps={{ readOnly: true }} />
                <TextField label="Propriété" size="small" value={proposalDialog.propertyId && typeof proposalDialog.propertyId === 'object' ? proposalDialog.propertyId.titre || proposalDialog.propertyId._id || '—' : proposalDialog.propertyId || '—'} InputProps={{ readOnly: true }} />
                <TextField label="Détail" size="small" value={proposalDialog.note || ''} InputProps={{ readOnly: true }} multiline minRows={2} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (proposalDialog) setNotifications(s => s.filter(x => x.id !== proposalDialog.id)); setProposalDialog(null); }} sx={{ borderRadius: 1 }}>Refuser</Button>
            <Button onClick={async () => {
              if (!proposalDialog) return;
              const n = proposalDialog;
              const appt = { id: 'a' + Math.random().toString(36).slice(2, 9), ownerId, date: n.date, time: n.time, guestName: n.guestName, propertyId: n.propertyId || 'p1', note: n.note || 'Accepté', status: 'confirmed' };
              await saveAppointment(ownerId, appt).catch(() => { });
              setAppts(s => [...s, appt]);
              setNotifications(s => s.filter(x => x.id !== n.id));
              setProposalDialog(null);
            }} variant="contained" sx={{ borderRadius: 1 }}>Accepter</Button>
          </DialogActions>
        </Dialog>

        {/* Messenger Modal */}
        {messengerOpen && selectedContactForMessenger && (
          <MessengerWidget 
            open={messengerOpen}
            onClose={() => {
              setMessengerOpen(false);
              setSelectedContactForMessenger(null);
            }}
            userId={ownerId}
            initialAgentId={selectedContactForMessenger.id}
          />
        )}

        {/* WebRTC Call Modal - Placeholder */}
        <Dialog 
          open={webrtcModalOpen} 
          onClose={() => {
            setWebrtcModalOpen(false);
            setSelectedContactForCall(null);
          }} 
          fullWidth 
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Appel vidéo avec {selectedContactForCall?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 3, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main }}>
                <PhoneIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h6" sx={{ mb: 1 }}>Prêt pour l'appel vidéo</Typography>
              <Typography variant="body2" color="text.secondary">
                Appel avec <strong>{selectedContactForCall?.name}</strong> le <strong>{selectedContactForCall?.date} à {selectedContactForCall?.time}</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 2, color: theme.palette.warning.main }}>
                ℹ️ Vérifiez que votre caméra et microphone sont activés avant de commencer l'appel.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => {
                setWebrtcModalOpen(false);
                setSelectedContactForCall(null);
              }} 
              sx={{ borderRadius: 1 }}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              color="success"
              sx={{ borderRadius: 1, fontWeight: 700 }}
              onClick={() => {
                // Déclencher l'événement pour ouvrir le vrai modal WebRTC
                window.dispatchEvent(new CustomEvent('startWebRTCCall', { 
                  detail: { 
                    contactId: selectedContactForCall?.id, 
                    contactName: selectedContactForCall?.name,
                    appointmentDate: selectedContactForCall?.date,
                    appointmentTime: selectedContactForCall?.time
                  } 
                }));
                setWebrtcModalOpen(false);
                setSelectedContactForCall(null);
              }}
            >
              Démarrer l'appel
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </OwnerLayout>
  );
}
