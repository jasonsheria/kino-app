import React, { useEffect, useState, useMemo } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import AgentCard from '../components/agent/AgentCard';
import '../styles/owner.css';
import { agents as globalAgents, owners } from '../data/fakedata';
import api from '../services/api.service';
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
  Snackbar,
  Alert,
  Grow,
  Slide
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="top" ref={ref} {...props} />;
});
const SITE_ID = process.env.REACT_APP_SITE_ID || '689255f6c544155ff0443a9b';

// small wrapper for agents endpoints
const agentAPI = {
  // If userId is present, call the authenticated endpoint `/api/agents/me` (server reads user from JWT).
  // Otherwise call the public site-scoped endpoint `/api/agents?site=`.
  list: ({ siteId, userId } = {}) => {
      // call the authenticated endpoint; token must be present in api instance
      return api.get('/api/agents/me', { params: { site: siteId, user: userId } });
  },
  get: (id) => api.get(`/api/agents/${id}`),
  create: (data) => api.post(`/api/agents`, data),
  update: (id, data) => api.put(`/api/agents/${id}`, data),
  remove: (id) => api.delete(`/api/agents/${id}`),
  upload: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/api/agents/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
};

export default function OwnerAgents(){
  const owner = owners[0] || { id:1, preferredAgents: [] };
  const ownerId = owner.id;

  // helper: validate a Mongo ObjectId (24 hex chars)
  const isValidObjectId = (val) => typeof val === 'string' && /^[a-fA-F0-9]{24}$/.test(val);

  // Attempt to resolve a valid site id from several places: owner.site_id, ownerId (if ObjectId), or logged user
  // const resolveSiteId = ()=>{
  //   if (isValidObjectId(owner.site_id)) return owner.site_id;
  //   if (isValidObjectId(ownerId)) return ownerId;
  //   try{
  //     const raw = localStorage.getItem('ndaku_user');
  //     if(!raw) return null;
  //     const user = JSON.parse(raw);
  //     if(user){
  //       if(isValidObjectId(user.site_id)) return user.site_id;
  //       if(isValidObjectId(user.site)) return user.site;
  //       if(isValidObjectId(user.id)) return user.id;
  //     }
  //   }catch(e){ /* ignore parse errors */ }
  //   return null;
  // };

  // get current logged user id from localStorage (if available and valid ObjectId)
  const getCurrentUserId = ()=>{
    try{
      const raw = localStorage.getItem('ndaku_user');
      if(!raw) return null;
      const user = JSON.parse(raw);
      const candidate = user?._id || user?.id || user?.userId || user?.id;
      if(isValidObjectId(candidate)) return candidate;
    }catch(e){ /* ignore */ }
    return null;
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, msg: '', severity: 'info' });

  useEffect(()=>{
    let mounted = true;
    const fetchAgents = async ()=>{
      setLoading(true); setError(null);
      try{
        const siteId = process.env.REACT_APP_SITE_ID || owner.site_id || (isValidObjectId(ownerId) ? ownerId : null);
        if(!siteId){
          // no valid site id; fallback to local data
          console.warn('No valid site_id found for agents list');
          setError(new Error('Missing or invalid site_id'));
          return;
        }
        const userId = getCurrentUserId();
        let res;
        if(userId){
          // try authenticated route first; if it fails (401/500) fallback to site route
          try{
            res = await agentAPI.list({ siteId, userId });
          }catch(innerErr){
            console.warn('Authenticated agents fetch failed, falling back to site-scoped list', innerErr);
            res = await api.get('/api/agents', { params: { site: siteId } });
          }
        }else{
          // unauthenticated: call the public site-scoped agents endpoint
          res = await api.get('/api/agents', { params: { site: siteId } });
        }
  if(!mounted) return;
  // tolerate multiple response shapes: [] or { data: [] } or { results: [] }
  const payload = res && res.data ? res.data : res;
  let list = [];
  if (Array.isArray(payload)) list = payload;
  else if (payload && Array.isArray(payload.data)) list = payload.data;
  else if (payload && Array.isArray(payload.results)) list = payload.results;
  else list = [];
  setItems(list);
      }catch(e){
        console.warn('Failed to load agents from API, falling back to local', e);
        setItems(owner.preferredAgents.map(id=> globalAgents.find(a=>a.id===id)).filter(Boolean));
        setError(e);
      }finally{
        if(mounted) setLoading(false);
      }
    };
    fetchAgents();
    return ()=> { mounted = false; };
  },[ownerId]);

  const persist = (next)=>{ setItems(next); };

  const [filter, setFilter] = useState('');
  const filtered = useMemo(()=> items.filter(a=> !filter || a.name.toLowerCase().includes(filter.toLowerCase())),[items, filter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const openAdd = ()=>{ setEdit({ firstName:'', lastName:'', middleName:'', name:'', email:'', phone:'', telephone:'', facebook:'', linkedin:'', twitter:'', address:'', photo: '' }); setModalOpen(true); };
  const openEdit = (a)=>{ setEdit({ ...a }); setModalOpen(true); };
  const removeAgent = async (id)=>{
    // nicer confirmation using window.confirm for now; could be replaced by a Dialog
    if(!window.confirm('Supprimer cet agent associé ?')) return;
    try{
      console.debug('[agents] remove payload id=', id);
      await agentAPI.remove(id);
      const next = items.filter(x=> (x._id || x.id) !== id);
      persist(next);
      console.info('[agents] removed', id);
      setNotification({ open: true, msg: 'Agent supprimé', severity: 'success' });
    }catch(e){
      console.error('Failed to remove agent', e, e?.response?.data || 'no response body');
      setNotification({ open: true, msg: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const save = (form)=>{
    if(!form.name && !(form.firstName || form.lastName)){
      window.alert('Nom ou prénom requis'); return;
    }
    (async ()=>{
      try{
        const siteId = process.env.REACT_APP_SITE_ID || owner.site_id || (isValidObjectId(ownerId) ? ownerId : null);
        if(!siteId){
          window.alert('Impossible d\'effectuer l\'opération : site_id manquant ou invalide.');
          return;
        }
        const userId = getCurrentUserId();
        // Normalize frontend form fields to backend schema keys
        // backend expects: nom (last name), prenom (first name), adresse, telephone, image, site_id, etc.
        const prenom = form.firstName || (form.name ? form.name.split(' ')[0] : '');
        const nom = form.lastName || (form.name ? form.name.split(' ').slice(1).join(' ') : '');
        const adresse = form.address || form.adresse || '';
        const telephone = form.telephone || form.phone || '';
        const image = form.photo || form.image || '';
        const payload = {
          nom,
          prenom,
          email: form.email || '',
          adresse,
          telephone,
          image,
          facebook: form.facebook || '',
          linkedin: form.linkedin || '',
          twitter: form.twitter || '',
          messenger: form.messenger || '',
          site_id: siteId,
        };
        console.debug('[agents] save payload:', payload, 'userId=', userId);
        setSaving(true);
        let res;
        if(form._id || form.id){
          const id = form._id || form.id;
          res = await agentAPI.update(id, payload);
          const next = items.map(x=> (x._id || x.id) === id ? res.data : x);
          persist(next);
          console.info('[agents] updated', id, res.data);
          setNotification({ open: true, msg: 'Agent modifié', severity: 'success' });
        }else{
          res = await agentAPI.create(payload);
          const next = [res.data, ...items];
          persist(next);
          console.info('[agents] created', res.data);
          setNotification({ open: true, msg: 'Agent créé', severity: 'success' });
        }
        setModalOpen(false);
        setSaving(false);
      }catch(e){
        console.error('Failed to save agent', e, e?.response?.data || 'no response');
        // Map axios / server response to user-friendly message
        const serverMsg = e?.response?.data?.message || e?.response?.data || e.message || 'Erreur serveur';
        setNotification({ open: true, msg: `Erreur: ${serverMsg}`, severity: 'error' });
        setSaving(false);
      }
    })();
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
                    <Button size="small" variant="outlined" color="error" onClick={()=>removeAgent(a._id || a.id)} sx={{ borderRadius: 0 }}>Supprimer</Button>
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
                placeholder="e.g. +243 81 234 5678"
                value={edit?.telephone||edit?.phone||''}
                onChange={e=> setEdit({...edit, telephone:e.target.value, phone:e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                fullWidth
              />
              <Grid item xs={12} sm={6}>
                <TextField
                  label="LinkedIn"
                  size="small"
                  value={edit?.linkedin||''}
                  onChange={e=> setEdit({...edit, linkedin:e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Twitter"
                  size="small"
                  value={edit?.twitter||''}
                  onChange={e=> setEdit({...edit, twitter:e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  fullWidth
                />
              </Grid>
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
                      onChange={async e => {
                        const f = e.target.files && e.target.files[0];
                        if (!f) return;
                        // Show local preview immediately
                        const localUrl = URL.createObjectURL(f);
                        setEdit(prev => ({ ...prev, photo: localUrl }));
                        try {
                          const res = await agentAPI.upload(f);
                          // Optionally revokeObjectURL here if you want to clean up
                          setEdit(prev => ({ ...prev, photo: res.data.url }));
                        } catch (err) {
                          console.error('Upload failed', err);
                          // fallback to FileReader if needed
                          const reader = new FileReader();
                          reader.onload = (ev) => setEdit(prev => ({ ...prev, photo: ev.target.result }));
                          reader.readAsDataURL(f);
                        }
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
            <Button variant="contained" onClick={()=> save(edit || { name: '', email:'', phone:'' })} sx={{ borderRadius: 0 }} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={notification.open} autoHideDuration={4000} onClose={()=> setNotification({...notification, open:false})} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert onClose={()=> setNotification({...notification, open:false})} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.msg}
          </Alert>
        </Snackbar>
      </Box>
    </OwnerLayout>
  );
}
