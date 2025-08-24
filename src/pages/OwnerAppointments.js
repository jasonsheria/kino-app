import React, { useEffect, useMemo, useRef, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { fetchAppointments, updateAppointment, saveAppointment } from '../api/appointments';
import { getAppointmentsForOwner as getLocalAppts } from '../data/fakeAppointments';
import {
  Box, Grid, Paper, Stack, Typography, TextField, Button, useTheme, useMediaQuery,
  IconButton, Grow, Switch, FormControlLabel, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip, Divider, Tabs, Tab, Badge
} from '@mui/material';
import { Print as PrintIcon, FileDownload as FileDownloadIcon, Block as BlockIcon, Delete as DeleteIcon, Add as AddIcon, ChevronLeft, ChevronRight, Today as TodayIcon, ViewModule as ViewMonthIcon, ViewWeek as ViewWeekIcon, ViewDay as ViewDayIcon, Add as AddFabIcon } from '@mui/icons-material';
import { Fab, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';

function ownerIdFromDraft(){ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id ? String(d.id) : 'owner-123'; }catch(e){ return 'owner-123'; } }

export default function OwnerAppointments(){
  const ownerId = ownerIdFromDraft();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockMode, setBlockMode] = useState(false);
  const [blockedDates, setBlockedDates] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(`owner_blocked_${ownerId}`)) || []; }catch(e){ return []; } });
  const [notifications, setNotifications] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(`owner_notifications_${ownerId}`)) || []; }catch(e){ return []; } });

  const [filterProperty, setFilterProperty] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' });

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [proposalDialog, setProposalDialog] = useState(null);

  const calendarRef = useRef(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      const backend = await fetchAppointments(ownerId).catch(()=>[]);
      const local = getLocalAppts(ownerId) || [];
      if(backend.length === 0 && local.length>0){
        for(const a of local){ await saveAppointment(ownerId, { ...a, status: 'pending' }).catch(()=>{}); }
      }
      const final = (backend.length? backend : local).map(a => ({ ...a, status: a.status || 'pending' }));
      if(mounted) setAppts(final);
      setLoading(false);
    })();
    return ()=> mounted = false;
  },[ownerId]);

  useEffect(()=>{ try{ localStorage.setItem(`owner_blocked_${ownerId}`, JSON.stringify(blockedDates)); }catch(e){} },[blockedDates, ownerId]);
  useEffect(()=>{ try{ localStorage.setItem(`owner_notifications_${ownerId}`, JSON.stringify(notifications)); }catch(e){} },[notifications, ownerId]);

  useEffect(()=>{
    const handler = ()=> { try{ const n = JSON.parse(localStorage.getItem(`owner_notifications_${ownerId}`)) || []; setNotifications(n);}catch(e){} };
    window.addEventListener('owner_notifications_updated', handler);
    return ()=> window.removeEventListener('owner_notifications_updated', handler);
  },[ownerId]);

  useEffect(()=>{
    const el = document.querySelectorAll('.appt-card');
    el.forEach((n)=> { n.style.transform = 'translateY(8px)'; n.style.transition = 'transform .36s cubic-bezier(.2,.9,.2,1)'; });
    setTimeout(()=> el.forEach((n)=> { n.style.transform = 'translateY(0)'; }), 80);
  },[appts.length]);

  const events = useMemo(()=> appts.map(a => ({ id: a.id, title: `${a.time} • ${a.guestName}`, start: `${a.date}T${a.time}:00`, extendedProps: a })), [appts]);
  const blockedEvents = useMemo(()=> blockedDates.map(b => ({ id: `b-${b.id}`, title: 'Occupé', start: `${b.date}T00:00:00`, allDay: true, extendedProps: { blocked: true, ...b } })), [blockedDates]);
  const proposalEvents = useMemo(()=> notifications.filter(n=> n.type === 'proposal').map(n=> ({ id: `p-${n.id}`, title: `${n.time} • Proposition • ${n.guestName}`, start: `${n.date}T${n.time}:00`, extendedProps: { proposal: true, ...n } })), [notifications]);

  const mergedEvents = useMemo(()=> [...blockedEvents, ...proposalEvents, ...events], [blockedEvents, proposalEvents, events]);

  const [calendarTitle, setCalendarTitle] = useState('');

  const handleEventClick = async (clickInfo)=>{
    const ext = clickInfo.event.extendedProps || {};
    if(ext.proposal){
      const nid = ext.id || ext.notificationId || null;
      const notif = notifications.find(n=> String(n.id) === String(nid) || String(n.id) === String(ext.id));
      if(notif) setProposalDialog(notif);
      return;
    }
    const existing = appts.find(x => String(x.id) === String(clickInfo.event.id));
    if(!existing) return;
    const nextStatus = existing.status === 'confirmed' ? 'pending' : 'confirmed';
    await updateAppointment(ownerId, existing.id, { status: nextStatus }).catch(()=>{});
    setAppts(s => s.map(x => x.id===existing.id? { ...x, status: nextStatus } : x));
  };

  const filtered = appts.filter(a => (filterProperty==='all' || a.propertyId===filterProperty) && (!range.from || a.date >= range.from) && (!range.to || a.date <= range.to));
  const unconfirmed = filtered.filter(a => a.status !== 'confirmed' && a.status !== 'cancelled');

  const confirm = async (id) => { await updateAppointment(ownerId, id, { status: 'confirmed' }).catch(()=>{}); setAppts(s => s.map(x => x.id===id? { ...x, status:'confirmed' } : x)); };
  const cancel = async (id) => { await updateAppointment(ownerId, id, { status: 'cancelled' }).catch(()=>{}); setAppts(s => s.map(x => x.id===id? { ...x, status:'cancelled' } : x)); };

  const onDateSelect = (selectInfo) => {
    const date = selectInfo.startStr.slice(0,10);
    const time = selectInfo.startStr.slice(11,16);
    setBookingDraft({ date, time, propertyId: filterProperty==='all' ? null : filterProperty });
    setBookingDialogOpen(true);
  };

  const properties = useMemo(()=> {
    const set = new Set(appts.map(a=> a.propertyId).filter(Boolean));
    return ['all', ...Array.from(set)];
  },[appts]);

  const [rightTab, setRightTab] = useState(0);

  const stats = useMemo(()=>({
    total: appts.length,
    confirmed: appts.filter(a=> a.status === 'confirmed').length,
    pending: appts.filter(a=> a.status === 'pending').length,
    blocked: blockedDates.length
  }),[appts, blockedDates]);

  return (
    <OwnerLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Header + actions */}
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Tableau de bord — Rendez-vous</Typography>
            <Typography variant="body2" color="text.secondary">Gérez vos rendez‑vous, bloquez des jours et traitez les propositions.</Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
            <Button startIcon={<FileDownloadIcon />} size="small" variant="outlined">Exporter</Button>
            <Button startIcon={<PrintIcon />} size="small" variant="outlined">Imprimer</Button>
            <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={()=>{ setBookingDraft({ date: '', time: '09:00', propertyId: null, guestName: '' }); setBookingDialogOpen(true); }}>Ajouter</Button>
          </Stack>
        </Stack>

        {/* Summary cards */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 3 }}>
          <Grid container spacing={2}>
            {[{
              label: 'Total', value: stats.total, color: 'text.primary'
            },{
              label: 'Confirmés', value: stats.confirmed, color: 'success.main'
            },{
              label: 'En attente', value: stats.pending, color: 'warning.main'
            },{
              label: 'Jours bloqués', value: stats.blocked, color: 'text.primary'
            }].map((c, i)=> (
              <Grid item xs={6} sm={3} md={2} key={c.label}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minHeight: 84, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, minHeight: 84 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField select size="small" fullWidth value={filterProperty} onChange={e=> setFilterProperty(e.target.value)} SelectProps={{ native: true }}>
                      {properties.map(p => <option key={p} value={p}>{p === 'all' ? 'Toutes les propriétés' : `Propriété ${p}`}</option>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField size="small" type="date" fullWidth value={range.from} onChange={e=> setRange(r=>({...r, from:e.target.value}))} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField size="small" type="date" fullWidth value={range.to} onChange={e=> setRange(r=>({...r, to:e.target.value}))} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel control={<Switch checked={blockMode} onChange={e=> setBlockMode(e.target.checked)} />} label={<><BlockIcon sx={{ fontSize: 16, mr: .5 }} />Marquer occupé</>} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>

  {/* Main content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              {/* Custom toolbar above calendar for precise layout */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton size="small" onClick={()=> calendarRef.current?.getApi().prev()}><ChevronLeft /></IconButton>
                  <IconButton size="small" onClick={()=> calendarRef.current?.getApi().next()}><ChevronRight /></IconButton>
                  <Button size="small" startIcon={<TodayIcon />} onClick={()=> calendarRef.current?.getApi().today()}>Aujourd'hui</Button>
                </Stack>

                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{calendarTitle}</Typography>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton size="small" onClick={()=> calendarRef.current?.getApi().changeView('dayGridMonth')} title="Mois"><ViewMonthIcon /></IconButton>
                  <IconButton size="small" onClick={()=> calendarRef.current?.getApi().changeView('timeGridWeek')} title="Semaine"><ViewWeekIcon /></IconButton>
                  <IconButton size="small" onClick={()=> calendarRef.current?.getApi().changeView('timeGridDay')} title="Jour"><ViewDayIcon /></IconButton>
                </Stack>
              </Box>

              {isMobile && loading && (
                <Skeleton variant="rectangular" height={520} animation="wave" />
              )}
              <FullCalendar
                plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin ]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={mergedEvents}
                eventClick={handleEventClick}
                selectable={true}
                select={onDateSelect}
                ref={calendarRef}
                height={isMobile ? 520 : 720}
                datesSet={(info)=> setCalendarTitle(info.view.title)}
                eventContent={(arg)=>{
                  const ext = arg.event.extendedProps || {};
                  return (
                    <div style={{ padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{arg.event.title}</div>
                      {ext.blocked && <div style={{ fontSize: 11, color: '#666' }}>⚑</div>}
                    </div>
                  );
                }}
                eventDidMount={(info) => {
                  info.el.setAttribute('title', info.event.title + ' — ' + (info.event.extendedProps.note||''));
                  const status = info.event.extendedProps.status;
                  if(status === 'confirmed') info.el.style.background = '#d1fae5';
                  if(status === 'cancelled') info.el.style.opacity = '0.5';
                  if(info.event.extendedProps.blocked) { info.el.style.background = '#f5f5f5'; info.el.style.border = '1px solid #ddd'; }
                  if(info.event.extendedProps.proposal) { info.el.style.background = '#fff8dc'; info.el.style.border = '1px solid #f0c36d'; }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Tabs value={rightTab} onChange={(e,v)=> setRightTab(v)} variant="fullWidth">
                <Tab label={<Badge color="error" badgeContent={unconfirmed.length}>Non confirmés</Badge>} />
                <Tab label={`Bloqués (${blockedDates.length})`} />
              </Tabs>
              <Divider />
              <Box sx={{ p: 2, minHeight: 300, maxHeight: 640, overflowY: 'auto' }}>
                {rightTab === 0 && (
                  <Box>
                    {loading && (
                      <Stack spacing={1}>
                        <Skeleton variant="rectangular" height={64} />
                        <Skeleton variant="rectangular" height={64} />
                      </Stack>
                    )}

                    {!loading && unconfirmed.length===0 && <Typography variant="body2" color="text.secondary">Aucun rendez-vous non confirmé</Typography>}

                    {!loading && unconfirmed.length>0 && (
                      isMobile ? (
                        <Stack spacing={1}>
                          {unconfirmed.map(a => (
                            <Paper key={a.id} sx={{ p: 1.25, borderRadius: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Box>
                                  <Typography sx={{ fontWeight: 700 }}>{a.date} {a.time}</Typography>
                                  <Typography variant="body2" color="text.secondary">{a.guestName} • {a.propertyId}</Typography>
                                </Box>
                                <Stack spacing={1} sx={{ minWidth: 120 }}>
                                  <Button fullWidth size="small" variant="contained" color="success" onClick={()=> confirm(a.id)}>Confirmer</Button>
                                  <Button fullWidth size="small" variant="outlined" color="error" onClick={()=> cancel(a.id)}>Annuler</Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <List>
                          {unconfirmed.map((a)=> (
                            <ListItem key={a.id} secondaryAction={(
                              <Stack direction="row" spacing={1}>
                                <Button size="small" variant="contained" color="success" onClick={()=> confirm(a.id)}>Confirmer</Button>
                                <Button size="small" variant="outlined" color="error" onClick={()=> cancel(a.id)}>Annuler</Button>
                              </Stack>
                            )}>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), mr: 1 }}>{a.guestName? a.guestName[0] : 'U'}</Avatar>
                              <ListItemText primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography sx={{fontWeight:700}}>{a.date} {a.time}</Typography><Chip label={a.propertyId} size="small" /></Box>} secondary={a.guestName + (a.note? ' — '+a.note : '')} />
                            </ListItem>
                          ))}
                        </List>
                      )
                    )}
                  </Box>
                )}

                {rightTab === 1 && (
                  <Box>
                    {blockedDates.length===0 && <Typography variant="body2" color="text.secondary">Aucun jour bloqué</Typography>}
                    {blockedDates.map(b => (
                      <Paper key={b.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12) }}><BlockIcon /></Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>{b.date}{b.propertyId? ` — ${b.propertyId}`: ''}</Typography>
                            <Typography variant="body2" color="text.secondary">{b.note}</Typography>
                          </Box>
                        </Box>
                        <IconButton onClick={()=> setBlockedDates(s => s.filter(x=> x.id !== b.id))}><DeleteIcon /></IconButton>
                      </Paper>
                    ))}
                  </Box>
                )}
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
                <TextField label="Propriété" size="small" value={bookingDraft.propertyId || 'Toutes'} InputProps={{ readOnly: true }} />
                {!blockMode && <TextField label="Nom du visiteur / motif" size="small" value={bookingDraft.guestName || ''} onChange={e => setBookingDraft(d => ({ ...d, guestName: e.target.value }))} />}
                {blockMode && <TextField label="Note (optionnel)" size="small" value={bookingDraft.note || ''} onChange={e => setBookingDraft(d => ({ ...d, note: e.target.value }))} />}
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
              await saveAppointment(ownerId, appt).catch(()=>{});
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
                <TextField label="Propriété" size="small" value={proposalDialog.propertyId || '—'} InputProps={{ readOnly: true }} />
                <TextField label="Détail" size="small" value={proposalDialog.note || ''} InputProps={{ readOnly: true }} multiline minRows={2} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if(proposalDialog) setNotifications(s => s.filter(x => x.id !== proposalDialog.id)); setProposalDialog(null); }} sx={{ borderRadius: 1 }}>Refuser</Button>
            <Button onClick={async () => {
              if (!proposalDialog) return;
              const n = proposalDialog;
              const appt = { id: 'a' + Math.random().toString(36).slice(2, 9), ownerId, date: n.date, time: n.time, guestName: n.guestName, propertyId: n.propertyId || 'p1', note: n.note || 'Accepté', status: 'confirmed' };
              await saveAppointment(ownerId, appt).catch(()=>{});
              setAppts(s => [...s, appt]);
              setNotifications(s => s.filter(x => x.id !== n.id));
              setProposalDialog(null);
            }} variant="contained" sx={{ borderRadius: 1 }}>Accepter</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </OwnerLayout>
  );
}
