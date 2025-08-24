import React, { useEffect, useState } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import { listSessions, updateOwner } from '../api/owners';
import { Container, Grid, Paper, Stack, Typography, TextField, Button, Switch, FormControlLabel, Divider, Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery } from '@mui/material';

export default function OwnerSecurity(){
  const ownerId = (()=>{ try{ const d = JSON.parse(localStorage.getItem('owner_request_draft')||'null'); return d && d.id? d.id : 'owner-123'; }catch(e){ return 'owner-123'; } })();
  const [sessions, setSessions] = useState([]);
  const [twoFA, setTwoFA] = useState(false);
  const [changing, setChanging] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(()=>{ let m=true; listSessions(ownerId).then(s=> m && setSessions(s || [])); return ()=> m=false; },[ownerId]);

  const toggle2FA = async ()=>{
    setChanging(true);
    await updateOwner(ownerId, { twoFA: !twoFA });
    setTwoFA(s => !s);
    setChanging(false);
  };

  const changePassword = async ()=>{
    if(!currentPwd || !newPwd || !confirmPwd){ window.alert('Remplissez tous les champs'); return; }
    if(newPwd !== confirmPwd){ window.alert('Les nouveaux mots de passe ne correspondent pas'); return; }
    // use updateOwner as a placeholder for password change
    await updateOwner(ownerId, { password: newPwd });
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    window.alert('Mot de passe mis à jour');
  };

  const [revoking, setRevoking] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmRevoke = (id)=>{ setRevoking(id); setConfirmOpen(true); };

  const handleRevoke = ()=>{
    if(!revoking) return; // in real app, call API to revoke
    setSessions(s => s.filter(x=> x.id !== revoking));
    setRevoking(null); setConfirmOpen(false);
  };

  return (
    <OwnerLayout>
      <Container maxWidth="md" style={{paddingTop:20, paddingBottom:40}}>
        <Typography variant="h5" style={{fontWeight:800, marginBottom:6}}>Sécurité</Typography>
        <Typography variant="body2" color="textSecondary" style={{marginBottom:18}}>Gérez votre mot de passe, 2FA et vos sessions actives.</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" style={{padding:16}}>
              <Typography variant="h6" style={{fontWeight:700}}>Changer le mot de passe</Typography>
              <Stack spacing={2} style={{marginTop:12}}>
                <TextField type="password" label="Mot de passe actuel" value={currentPwd} onChange={e=> setCurrentPwd(e.target.value)} fullWidth size="small" />
                <TextField type="password" label="Nouveau mot de passe" value={newPwd} onChange={e=> setNewPwd(e.target.value)} fullWidth size="small" />
                <TextField type="password" label="Confirmer le nouveau" value={confirmPwd} onChange={e=> setConfirmPwd(e.target.value)} fullWidth size="small" />
                <div style={{display:'flex', justifyContent: isSmall ? 'stretch' : 'flex-start', gap:8}}>
                  <Button variant="contained" className="owner-btn-primary" onClick={changePassword}>Mettre à jour le mot de passe</Button>
                </div>
              </Stack>

              <Divider style={{marginTop:18, marginBottom:12}} />

              <Typography variant="h6" style={{fontWeight:700}}>Authentification à deux facteurs (2FA)</Typography>
              <Stack direction="row" alignItems="center" spacing={2} style={{marginTop:8}}>
                <Typography className="muted-small">Activer la 2FA (via application d'authentification)</Typography>
                <FormControlLabel control={<Switch checked={twoFA} onChange={toggle2FA} disabled={changing} />} label={twoFA ? 'Activée' : 'Désactivée'} />
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper variant="outlined" style={{padding:16}}>
              <Typography variant="h6" style={{fontWeight:700}}>Sessions actives</Typography>
              <Stack spacing={2} style={{marginTop:12}}>
                {sessions.length===0 && <Typography className="muted-small">Aucune session active détectée.</Typography>}
                {sessions.map(s => (
                  <Paper key={s.id} variant="outlined" style={{padding:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{minWidth:0}}>
                      <Typography style={{fontWeight:800}} noWrap>{s.device}</Typography>
                      <Typography className="muted-small">IP: {s.ip} — {s.last}</Typography>
                    </div>
                    <div>
                      <Button size="small" variant="outlined" color="error" onClick={()=> confirmRevoke(s.id)}>Terminer</Button>
                    </div>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Dialog open={confirmOpen} onClose={()=> setConfirmOpen(false)}>
          <DialogTitle>Terminer la session</DialogTitle>
          <DialogContent>
            <Typography>Terminer cette session maintenant ? L'utilisateur devra se reconnecter.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> setConfirmOpen(false)}>Annuler</Button>
            <Button color="error" variant="contained" onClick={handleRevoke}>Terminer</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </OwnerLayout>
  );
}
