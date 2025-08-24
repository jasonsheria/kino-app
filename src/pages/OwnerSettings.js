import React, { useEffect, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import { fetchOwner, updateOwner, deleteOwner } from '../api/owners';
import { useNavigate } from 'react-router-dom';
import { Button, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel, useTheme, useMediaQuery, Container, Paper, Grid, Stack, Typography, Divider, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';

export default function OwnerSettings(){
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const ownerId = (()=>{ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id? d.id : 'owner-123'; }catch(e){ return 'owner-123'; } })();
  const [owner, setOwner] = useState(null);
  const [prefs, setPrefs] = useState({ emailNotifs:true, smsNotifs:false, language:'fr' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ let m=true; fetchOwner(ownerId).then(o=> { if(m && o) setOwner(o); }); return ()=> m=false; },[ownerId]);

  useEffect(()=>{ if(owner && owner.prefs) setPrefs(owner.prefs); },[owner]);

  const save = async ()=>{ setSaving(true); await updateOwner(ownerId, { prefs }); const o = await fetchOwner(ownerId); setOwner(o); setSaving(false); };

  const navigate = useNavigate();

  const removeAccount = async ()=>{
    // open confirmation handled by dialog
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmDelete = async ()=>{
    setConfirmOpen(false);
    const ok = await deleteOwner(ownerId);
    if(ok){ alert('Compte supprimé. Vous serez redirigé.'); navigate('/'); }
    else alert('Suppression impossible.');
  };

  return (
    <OwnerLayout>
      <Container maxWidth="md" style={{paddingTop:20, paddingBottom:40}}>
        <Paper className="settings-paper" elevation={2} style={{padding:18}}>
          <Grid container spacing={2} alignItems="start">
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <div>
                  <Typography variant="h5" component="h1" style={{fontWeight:800}}>Paramètres</Typography>
                  <Typography variant="body2" color="textSecondary">Préférences du compte, notifications et langue.</Typography>
                </div>
                <div>
                  <IconButton aria-label="delete" color="error" onClick={()=> setConfirmOpen(true)} title="Supprimer le compte">
                    <DeleteOutlineIcon />
                  </IconButton>
                </div>
              </Stack>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper variant="outlined" className="settings-section" style={{padding:16}}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <NotificationsActiveOutlinedIcon color="primary" />
                  <Typography variant="h6" style={{fontWeight:700}}>Notifications</Typography>
                </Stack>
                <Divider style={{marginTop:12, marginBottom:12}} />

                <Stack spacing={2}>
                  <FormControlLabel control={
                    <Switch checked={prefs.emailNotifs} onChange={e=> setPrefs({...prefs,emailNotifs:e.target.checked})} color="primary" />
                  } label="Recevoir les notifications par email" />

                  <FormControlLabel control={
                    <Switch checked={prefs.smsNotifs} onChange={e=> setPrefs({...prefs,smsNotifs:e.target.checked})} color="primary" />
                  } label="Recevoir les SMS" />

                  <Stack direction={isSmall ? 'column' : 'row'} spacing={2} alignItems="center">
                    <FormControl size="small" style={{minWidth:160}}>
                      <InputLabel id="lang-label">Langue</InputLabel>
                      <Select labelId="lang-label" value={prefs.language} label="Langue" onChange={e=> setPrefs({...prefs,language:e.target.value})}>
                        <MenuItem value="fr">Français</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>

                    <div style={{flex:1}} />
                    <Button variant="outlined" onClick={()=> { fetchOwner(ownerId).then(o=> setOwner(o)); }} fullWidth={isSmall}>Annuler</Button>
                    <Button variant="contained" className="owner-btn-primary" onClick={save} disabled={saving} fullWidth={isSmall}>{saving? 'Sauvegarde...' : 'Sauvegarder'}</Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" className="settings-section" style={{padding:16}}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LanguageOutlinedIcon color="action" />
                  <Typography variant="subtitle1" style={{fontWeight:700}}>Compte</Typography>
                </Stack>
                <Divider style={{marginTop:12, marginBottom:12}} />
                <Typography variant="body2" color="textSecondary">Supprimer votre compte supprime toutes vos données et ne peut pas être annulé.</Typography>
                <div style={{marginTop:12}}>
                  <Button variant="contained" color="error" onClick={()=> setConfirmOpen(true)} fullWidth>Supprimer mon compte</Button>
                </div>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Dialog open={confirmOpen} onClose={()=> setConfirmOpen(false)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>Confirmer la suppression de votre compte et toutes les données associées ? Cette action est irréversible.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> setConfirmOpen(false)}>Annuler</Button>
            <Button color="error" variant="contained" onClick={handleConfirmDelete}>Supprimer</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </OwnerLayout>
  );
}
