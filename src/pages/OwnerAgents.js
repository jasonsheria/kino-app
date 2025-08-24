import React, { useEffect, useState, useMemo } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import AgentCard from '../components/agent/AgentCard';
import '../styles/owner.css';
import { agents as globalAgents, owners } from '../data/fakedata';
import {
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
  Grow,
  Slide
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function OwnerAgents(){
  const owner = owners[0] || { id:1, preferredAgents: [] };
  const ownerId = owner.id;

  const [items, setItems] = useState([]);
  useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem(`owner_agents_${ownerId}`)||'null');
      setItems(Array.isArray(s)?s: owner.preferredAgents.map(id=> globalAgents.find(a=>a.id===id)).filter(Boolean));
    }catch(e){
      setItems(owner.preferredAgents.map(id=> globalAgents.find(a=>a.id===id)).filter(Boolean));
    }
  },[ownerId]);
  const persist = (next)=>{ try{ localStorage.setItem(`owner_agents_${ownerId}`, JSON.stringify(next)); }catch(e){} setItems(next); };

  const [filter, setFilter] = useState('');
  const filtered = useMemo(()=> items.filter(a=> !filter || a.name.toLowerCase().includes(filter.toLowerCase())),[items, filter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const openAdd = ()=>{ setEdit({ firstName:'', lastName:'', middleName:'', name:'', email:'', phone:'', facebook:'', address:'', photo: '' }); setModalOpen(true); };
  const openEdit = (a)=>{ setEdit({ ...a }); setModalOpen(true); };
  const remove = (id)=>{ if(!window.confirm('Supprimer cet agent associé ?')) return; const next = items.filter(x=> x.id!==id); persist(next); };

  const save = (form)=>{
    if(!form.name && !(form.firstName || form.lastName)){
      window.alert('Nom ou prénom requis'); return;
    }
    let next;
    if(form.id) next = items.map(x=> x.id===form.id ? form : x);
    else next = [{ ...form, id: Date.now(), photo: form.photo || (globalAgents[0] && globalAgents[0].photo) }, ...items];
    persist(next); setModalOpen(false);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <OwnerLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header + actions */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Agents associés</Typography>
              <Typography variant="body2" color="text.secondary">Gérez vos agents et favoris</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Rechercher un agent"
                value={filter}
                onChange={e=>setFilter(e.target.value)}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  '& .MuiOutlinedInput-root': { borderRadius: 0, backgroundColor: theme.palette.grey[50] }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: filter ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilter('')} sx={{ borderRadius: 0 }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
              <Button
                variant="contained"
                onClick={openAdd}
                sx={{ borderRadius: 0, px: 3, minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Ajouter un agent
              </Button>
            </Stack>
          </Stack>

          {/* Stats row - two per line on mobile, equal size */}
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, width: '100%', borderRadius: 0, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center' }}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography variant="h6" fontWeight={600}>{items.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total agents</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, width: '100%', borderRadius: 0, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center' }}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography variant="h6" fontWeight={600}>{items.filter(a=>a.isFavorite).length}</Typography>
                  <Typography variant="body2" color="text.secondary">Favoris</Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>

        {/* Agents grid */}
        <Grid container spacing={3}>
          {filtered.map((a, idx)=> (
            <Grid item key={a.id} xs={6} sm={6} md={4}>
              <Grow in style={{ transformOrigin: '0 0 0' }} timeout={200 + (idx * 60)}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: '0 0 auto' }}>
                    <AgentCard agent={a} />
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button size="small" variant="outlined" onClick={()=>openEdit(a)} sx={{ borderRadius: 0 }}>Editer</Button>
                    <Button size="small" variant="outlined" color="error" onClick={()=>remove(a.id)} sx={{ borderRadius: 0 }}>Supprimer</Button>
                  </Box>
                </Paper>
              </Grow>
            </Grid>
          ))}

          {filtered.length===0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" color="text.secondary">Aucun agent trouvé</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        <Dialog
          open={modalOpen}
          onClose={()=>setModalOpen(false)}
          TransitionComponent={Transition}
          fullWidth
          maxWidth="sm"
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: 0, m: 0 } }}
        >
          <DialogTitle>{edit && edit.id ? 'Modifier l\'agent' : 'Ajouter un agent'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Nom"
                    size="small"
                    value={edit?.lastName||edit?.name||''}
                    onChange={e=> setEdit({...edit, lastName:e.target.value, name: `${(edit?.firstName||'').trim()} ${e.target.value}`.trim() })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Post-nom"
                    size="small"
                    value={edit?.middleName||''}
                    onChange={e=> setEdit({...edit, middleName:e.target.value})}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Prénom"
                    size="small"
                    value={edit?.firstName||''}
                    onChange={e=> setEdit({...edit, firstName:e.target.value, name: `${e.target.value} ${(edit?.lastName||'')}`.trim() })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Email"
                size="small"
                value={edit?.email||''}
                onChange={e=> setEdit({...edit, email:e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                fullWidth
              />
              <TextField
                label="Téléphone"
                size="small"
                value={edit?.phone||''}
                onChange={e=> setEdit({...edit, phone:e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                fullWidth
              />
              <TextField
                label="Facebook"
                size="small"
                value={edit?.facebook||''}
                onChange={e=> setEdit({...edit, facebook:e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                fullWidth
              />
              <TextField
                label="Adresse"
                size="small"
                value={edit?.address||''}
                onChange={e=> setEdit({...edit, address:e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                fullWidth
              />

              {/* Photo upload + preview */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Photo de profil</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Box sx={{ width: 96, height: 96, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: 'background.paper' }}>
                    {edit?.photo ? (
                      <img src={edit.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ color: 'text.secondary', fontSize: 12 }}>Aucune</Box>
                    )}
                  </Box>
                  <Box>
                    <input
                      accept="image/*"
                      id="agent-photo-input"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={e=>{
                        const f = e.target.files && e.target.files[0];
                        if(!f) return;
                        const reader = new FileReader();
                        reader.onload = (ev)=> setEdit({...edit, photo: ev.target.result});
                        reader.readAsDataURL(f);
                      }}
                    />
                    <label htmlFor="agent-photo-input">
                      <Button component="span" size="small" variant="outlined" sx={{ borderRadius: 0 }}>Choisir une photo</Button>
                    </label>
                    {edit?.photo && (
                      <Button size="small" color="error" onClick={()=> setEdit({...edit, photo: ''})} sx={{ ml: 1, borderRadius: 0 }}>Supprimer</Button>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={()=>setModalOpen(false)} sx={{ borderRadius: 0 }}>Annuler</Button>
            <Button variant="contained" onClick={()=> save(edit || { name: '', email:'', phone:'' })} sx={{ borderRadius: 0 }}>Enregistrer</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </OwnerLayout>
  );
}
