import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Chip,
  Card,
  CardMedia,
  useTheme,
  Paper,
  Divider,
  Alert,
  alpha,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { agents, properties as sampleProps, owners as sampleOwners } from '../../data/fakedata';

const COMMUNES_KINSHASA = [
  'Bandalungwa',
  'Barumbu',
  'Bumbu',
  'Gombe',
  'Kalamu',
  'Kasa-Vubu',
  'Kimbanseke',
  'Kinshasa',
  'Kintambo',
  'Kisenso',
  'Lemba',
  'Limete',
  'Lingwala',
  'Makala',
  'Maluku',
  'Masina',
  'Matete',
  'Mont-Ngafula',
  'Ndjili',
  'Ngaba',
  'Ngaliema',
  'Ngiri-Ngiri',
  'Nsele',
  'Selembao'
];

export default function OwnerPropertyForm({onSave, initial={}}){
  const defaults = {
    title: initial.title || initial.name || '',
    type: initial.type || 'APPARTEMENT',
    price: initial.price || '',
    address: initial.address || '',
    description: initial.description || '',
    commune: initial.commune || 'Gombe',
    agentId: initial.agentId || (agents && agents[0] && agents[0]._id) || null,
    chambres: initial.chambres || initial.bedrooms || '0',
    douches: initial.douches || '0',
    salon: initial.salon || '1',
    cuisine: initial.cuisine || '1',
    sdb: initial.sdb || '0',
    superficie: initial.superficie || initial.area || '',
    features: initial.features || [],
    status: initial.status || 'vente',
    geoloc: initial.geoloc || { lat: '', lng: '' }
  };

  const [p, setP] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [remoteAgents, setRemoteAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState(null);
  const mountedRef = useRef(true);

  // images as array for multi-upload
  const [images, setImages] = useState(initial.images ? initial.images.slice() : (defaults.image ? [defaults.image] : []));

  useEffect(()=>{ setP(prev => ({...prev, images})); }, [images]);


  const types = useMemo(()=>{
    const fromSample = Array.from(new Set((sampleProps||[]).map(x=>x.type).filter(Boolean)));
    const base = ['Appartement','Maison','Villa','Studio','Terrain','Terrain vide','Boutique','Place commerciale','Magasin','Penthouse','Salle de fête','Voiture'];
    const merged = Array.from(new Set([...fromSample, ...base]));
    return merged;
  }, []);

  const toggleFeature = (f)=>{
    const next = p.features && p.features.includes(f) ? p.features.filter(x=>x!==f) : [...(p.features||[]), f];
    setP({...p, features: next});
  };

  const submit = (e)=>{ e && e.preventDefault && e.preventDefault(); onSave(p); };

  const isResidential = ['Appartement','Maison','Villa','Studio','Penthouse'].includes(p.type);
  const isLand = p.type && p.type.toLowerCase().includes('terrain');
  const isCommercial = ['Boutique','Place commerciale','Magasin'].includes(p.type);

  // Simple client-side validation
  const validate = ()=>{
    const err = {};
    if(!p.title || !p.title.trim()) err.title = 'Le titre est requis';
    if(p.price && isNaN(Number(p.price))) err.price = 'Le prix doit être un nombre';
    if(isResidential && (!p.chambres || Number(p.chambres) < 0)) err.chambres = 'Nombre de chambres invalide';
    // geolocation validation: require both lat and lng to place on map
    const lat = p.geoloc && p.geoloc.lat !== undefined ? Number(p.geoloc.lat) : NaN;
    const lng = p.geoloc && p.geoloc.lng !== undefined ? Number(p.geoloc.lng) : NaN;
    if(Number.isNaN(lat) || Number.isNaN(lng)){
      err.geoloc = 'Coordonnées GPS (latitude et longitude) valides requises';
    } else {
      if(lat < -90 || lat > 90) err.geoloc = 'Latitude doit être entre -90 et 90';
      if(lng < -180 || lng > 180) err.geoloc = 'Longitude doit être entre -180 et 180';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = (e)=>{ e.preventDefault(); if(!validate()) return; onSave({...p, images}); };

  // Leaflet map preview refs/state
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && !!window.L);

  useEffect(()=>{
    if(leafletReady) return;
    // load leaflet css and script dynamically
    const cssId = 'leaflet-css';
    if(!document.getElementById(cssId)){
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const scriptId = 'leaflet-js';
    if(!document.getElementById(scriptId)){
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.onload = ()=> setLeafletReady(true);
      document.body.appendChild(s);
    } else {
      setLeafletReady(true);
    }
  }, [leafletReady]);

  // update map when coords change and leaflet is ready
  useEffect(()=>{
    const lat = p.geoloc && p.geoloc.lat !== undefined && p.geoloc.lat !== '' ? Number(p.geoloc.lat) : NaN;
    const lng = p.geoloc && p.geoloc.lng !== undefined && p.geoloc.lng !== '' ? Number(p.geoloc.lng) : NaN;
    if(!leafletReady || Number.isNaN(lat) || Number.isNaN(lng)) return;
    const L = window.L;
    if(!mapInstanceRef.current){
      // create map
      try{
        mapInstanceRef.current = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }catch(e){
        // silent
      }
    } else {
      mapInstanceRef.current.setView([lat, lng], 13);
      if(markerRef.current){ markerRef.current.setLatLng([lat, lng]); }
      else { markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current); }
    }
  }, [leafletReady, p.geoloc]);

  // determine preferred agents from owner draft or sampleOwners
  const ownerDraft = useMemo(()=>{
    try{ const raw = localStorage.getItem('owner_request_draft'); if(raw) return JSON.parse(raw); }catch(e){}
    return null;
  }, []);

  const preferredAgentIds = useMemo(()=>{
    if(ownerDraft && ownerDraft.preferredAgents) return ownerDraft.preferredAgents;
    if(sampleOwners && sampleOwners[0] && sampleOwners[0].preferredAgents) return sampleOwners[0].preferredAgents;
    return null;
  }, [ownerDraft]);
  // Fetch agents from backend (prefer user-scoped endpoint). Fallback to local fake data if unavailable.
  useEffect(()=>{ return ()=>{ mountedRef.current = false; }; }, []);

  const fetchAgents = async () => {
    try{
      setAgentsLoading(true);
      setAgentsError(null);
      const base = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/+$/, '');
      const token = localStorage.getItem('ndaku_auth_token');
      const tryUrls = [`${base}/api/agents/me`, `${base}/api/agents?site=${process.env.REACT_APP_SITE_ID || ''}`, `${base}/api/agents`];
      let got = null;
      for(const u of tryUrls){
        console.log('OwnerPropertyForm:fetch - trying', u);
        try{
          const res = await fetch(u, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
          console.log('OwnerPropertyForm:fetch - response status', u, res.status);
          if(!res.ok) continue;
          const json = await res.json();
          console.log('OwnerPropertyForm:fetch - json', u, json);
          const items = Array.isArray(json) ? json : (json.data || json.items || json.agents || json);
          if(items && Array.isArray(items) && items.length){ got = items; break; }
        }catch(e){ console.warn('OwnerPropertyForm:fetch - error fetching', u, e); }
      }
      if(!mountedRef.current) return;
      if(got && Array.isArray(got) && got.length){
        const mapped = got.map(a => ({ id: a._id || a.id || a.userId, prenom: a.prenom || a.firstName || '', nom: a.nom || a.lastName || '', name: a.name || a.fullName || '', raw: a }));
        console.log('OwnerPropertyForm:fetch - mapped remote agents', mapped);
        if(mountedRef.current) setRemoteAgents(mapped);
      }
    }catch(e){ if(mountedRef.current) setAgentsError(e?.message || String(e)); }
    finally{ if(mountedRef.current) setAgentsLoading(false); }
  };

  useEffect(()=>{ fetchAgents(); }, [preferredAgentIds]);

  const agentOptions = useMemo(()=>{
    let opts = [];
    if(remoteAgents && remoteAgents.length){
      if(preferredAgentIds && preferredAgentIds.length){
        const filtered = remoteAgents.filter(a => preferredAgentIds.some(pref => String(pref) === String(a.id) || String(pref) === String(a._id) || String(pref) === String(a.raw && a.raw._id) || String(pref) === String(a.raw && a.raw.id)));
        console.log('OwnerPropertyForm:agentOptions - filtered remoteAgents by preferredAgentIds', { preferredAgentIds, filteredCount: filtered.length });
        // if filtering yields results, use them; otherwise fall back to remoteAgents
        opts = (filtered && filtered.length) ? filtered : remoteAgents;
      } else {
        opts = remoteAgents;
      }
    } else {
      if(preferredAgentIds && preferredAgentIds.length){
        const filtered = agents.filter(a=> preferredAgentIds.some(pref => String(pref) === String(a.id) || String(pref) === String(a._id)));
        opts = (filtered && filtered.length) ? filtered : agents;
      } else {
        opts = agents;
      }
    }
    console.log('OwnerPropertyForm:agentOptions computed', { preferredAgentIds, remoteAgentsCount: (remoteAgents||[]).length, optsCount: (opts||[]).length, optsSample: (opts||[]).slice(0,3) });
    return opts;
  }, [remoteAgents, preferredAgentIds]);

  // Log on render to confirm component mounts
  console.log('OwnerPropertyForm:render - component mounted', { initial, defaults });

  // image helpers
  const addFiles = (fileList)=>{
    const files = Array.from(fileList).slice(0,8 - images.length); // limit to 8 images
    const readers = files.map(f=> new Promise(res=>{
      const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs=> setImages(prev=> [...prev, ...imgs]));
  };

  const removeImage = (idx)=> setImages(prev=> prev.filter((_,i)=> i!==idx));

  const useMyLocation = ()=>{
    if(!navigator.geolocation) { setErrors(prev=>({...prev, geoloc:'Géolocalisation non supportée par votre navigateur'})); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      setP(prev=> ({...prev, geoloc: { lat, lng }}));
      setErrors(prev=>{ const copy = {...prev}; delete copy.geoloc; return copy; });
    }, err=>{
      setErrors(prev=>({...prev, geoloc: 'Impossible d obtenir la position: ' + (err.message||err.code)}));
    }, {enableHighAccuracy:true, timeout:8000});
  };

  const theme = useTheme();
  
  const commonTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      backgroundColor: 'background.paper',
    }
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3,
        borderRadius: 0,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: '#fff'
      }}
    >
      <form id="property-form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Titre"
                value={p.title}
                onChange={(e) => setP({ ...p, title: e.target.value })}
                required
                error={!!errors.title}
                helperText={errors.title}
                variant="outlined"
                sx={commonTextFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Type"
                value={p.type}
                onChange={(e) => setP({ ...p, type: e.target.value })}
                variant="outlined"
                sx={commonTextFieldSx}
              >
                {types.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Statut"
                value={p.status || 'vente'}
                onChange={(e) => setP({ ...p, status: e.target.value })}
                variant="outlined"
                sx={commonTextFieldSx}
              >
                <MenuItem value="vente">Vente</MenuItem>
                <MenuItem value="location">Location</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Prix"
                value={p.price}
                onChange={(e) => setP({ ...p, price: e.target.value })}
                error={!!errors.price}
                helperText={errors.price}
                variant="outlined"
                type="number"
                inputProps={{ min: 0 }}
                sx={commonTextFieldSx}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Quartier"
                    value={p.quartier || ''}
                    onChange={(e) => setP({ ...p, quartier: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Commune"
                    value={p.commune || ''}
                    onChange={(e) => setP({ ...p, commune: e.target.value })}
                    required
                  >
                    {COMMUNES_KINSHASA.map((commune) => (
                      <MenuItem key={commune} value={commune}>
                        {commune}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Adresse complète"
                    value={p.address}
                    onChange={(e) => setP({ ...p, address: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Agent"
                value={p.agentId || ''}
                onChange={(e) => setP({ ...p, agentId: e.target.value })}
                helperText={agentsLoading ? 'Chargement des agents...' : agentsError ? `Erreur: ${agentsError}` : ''}
              >
                {agentOptions.map((a) => (
                  <MenuItem key={a.id || a._id } value={a.id || a._id}>
                    {a.prenom && a.nom ? `${a.prenom} ${a.nom}` : (a.name || a.fullName || a.prenom || a.nom || `Agent ${a.prenom, a.nom}`)}
                  </MenuItem>
                ))}
              </TextField>
              {preferredAgentIds && preferredAgentIds.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Agents suggérés selon vos préférences
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Agents trouvés: {agentOptions ? agentOptions.length : 0}
                </Typography>
                <Button size="small" variant="outlined" onClick={() => fetchAgents()} disabled={agentsLoading}>
                  {agentsLoading ? 'Chargement...' : 'Réessayer'}
                </Button>
                {agentsError && (
                  <Typography variant="caption" color="error" sx={{ ml: 1 }}>{agentsError}</Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={p.description}
            onChange={(e) => setP({ ...p, description: e.target.value })}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Images (max 8)
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                }}
              >
                {images.map((src, idx) => (
                  <Paper 
                    key={idx} 
                    sx={{ 
                      position: 'relative',
                      height: 90,
                      overflow: 'hidden',
                      borderRadius: 0,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="90"
                      image={src}
                      alt="preview"
                      sx={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(idx)}
                      sx={{
                        position: 'absolute',
                        right: 4,
                        top: 4,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        borderRadius: 0,
                        '&:hover': { 
                          bgcolor: theme.palette.error.light,
                          color: theme.palette.error.contrastText,
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
                {images.length < 8 && (
                  <Button
                    component="label"
                    variant="outlined"
                    sx={{
                      height: 90,
                      borderRadius: 0,
                      borderStyle: 'dashed',
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <AddIcon />
                      <Typography variant="caption" color="text.secondary">
                        Ajouter une image
                      </Typography>
                    </Stack>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Superficie (m²)"
                value={p.superficie}
                onChange={(e) => setP({ ...p, superficie: e.target.value })}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={p.geoloc && p.geoloc.lat !== undefined ? p.geoloc.lat : ''}
                    onChange={(e) =>
                      setP({ ...p, geoloc: { ...p.geoloc, lat: e.target.value } })
                    }
                    error={!!errors.geoloc}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={p.geoloc && p.geoloc.lng !== undefined ? p.geoloc.lng : ''}
                    onChange={(e) =>
                      setP({ ...p, geoloc: { ...p.geoloc, lng: e.target.value } })
                    }
                    error={!!errors.geoloc}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    startIcon={<MyLocationIcon />}
                    onClick={useMyLocation}
                    variant="outlined"
                    size="small"
                  >
                    Utiliser ma position
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Paper
                  sx={{
                    width: '100%',
                    height: 200,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                    flex: 1,
                  }}
                >
                  <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
                </Paper>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: theme.palette.grey[50],
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Aperçu de la position (OpenStreetMap)
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {errors.geoloc && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors.geoloc}
            </Alert>
          )}

          {isResidential && (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Chambres"
                  inputProps={{ min: 0 }}
                  value={p.chambres}
                  onChange={(e) => setP({ ...p, chambres: Number(e.target.value) })}
                  error={!!errors.chambres}
                  helperText={errors.chambres}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Douches"
                  inputProps={{ min: 0 }}
                  value={p.douches}
                  onChange={(e) => setP({ ...p, douches: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Salon"
                  inputProps={{ min: 0 }}
                  value={p.salon}
                  onChange={(e) => setP({ ...p, salon: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cuisine"
                  inputProps={{ min: 0 }}
                  value={p.cuisine}
                  onChange={(e) => setP({ ...p, cuisine: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="SDB"
                  inputProps={{ min: 0 }}
                  value={p.sdb}
                  onChange={(e) => setP({ ...p, sdb: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}

          {isCommercial && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                borderRadius: 0,
                borderColor: theme.palette.divider,
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Caractéristiques
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Parking', 'Cuisine', 'Sécurité', 'Vitrine'].map((f) => (
                  <Chip
                    key={f}
                    label={f}
                    onClick={() => toggleFeature(f)}
                    color={p.features && p.features.includes(f) ? 'primary' : 'default'}
                    variant={p.features && p.features.includes(f) ? 'filled' : 'outlined'}
                    sx={{ 
                      borderRadius: 0,
                      height: 32,
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                      ...(p.features && p.features.includes(f) 
                        ? {
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                              bgcolor: theme.palette.primary.dark,
                            },
                          }
                        : {
                            borderColor: theme.palette.divider,
                            '&:hover': {
                              bgcolor: theme.palette.action.hover,
                            },
                          }
                      ),
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {Object.keys(errors).length > 0 && (
            <Paper 
              sx={{ 
                p: 2,
                borderLeft: `4px solid ${theme.palette.error.main}`,
                bgcolor: alpha(theme.palette.error.main, 0.03),
                borderRadius: 0,
              }}
            >
              <Stack spacing={0.5}>
                {Object.values(errors).map((v, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: theme.palette.error.main,
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.error.main,
                        fontWeight: 500
                      }}
                    >
                      {v}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </form>
    </Paper>
  );
}
