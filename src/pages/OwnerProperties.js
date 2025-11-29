import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OwnerLayout from '../components/owner/OwnerLayout';
import OwnerPropertyForm from '../components/owner/OwnerPropertyForm';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilterBar from '../components/property/PropertyFilterBar';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  DialogTitle,
  DialogActions,
  alpha,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  DirectionsCar as CarIcon,
  Landscape as TerrainIcon
} from '@mui/icons-material';

const placeholderImage = "https://via.placeholder.com/150";

export default function OwnerProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState({ 
    q: '', 
    type: 'all',
    commune: 'Toutes',
    chambres: 'Tous',
    sdb: 'Tous',
    salon: 'Tous',
    cuisine: 'Tous',
    priceMin: '',
    priceMax: '',
    sort: 'relevance'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Normalize various error shapes coming from axios / backend
  const formatError = (errOrMessage) => {
    if (!errOrMessage) return null;
    // If it's already a string
    if (typeof errOrMessage === 'string') return errOrMessage;
    // If it's an array (e.g., validation messages)
    if (Array.isArray(errOrMessage)) return errOrMessage.join(', ');
    // If it's an object, try to extract common fields
    if (typeof errOrMessage === 'object') {
      // If it's an Axios response.data object that contains { message }
      if (errOrMessage.message) {
        if (typeof errOrMessage.message === 'string') return errOrMessage.message;
        if (Array.isArray(errOrMessage.message)) return errOrMessage.message.join(', ');
        try { return JSON.stringify(errOrMessage.message); } catch (e) { /* fallthrough */ }
      }
      // Fallback to stringify the whole object
      try { return JSON.stringify(errOrMessage); } catch (e) { return String(errOrMessage); }
    }
    return String(errOrMessage);
  };

  const ownerTypes = useMemo(() => [
    'APPARTEMENT',
    'MAISON',
    'VILLA',
    'TERRAIN',
    'BUREAU',
    'STUDIO',
    'GARAGE',
    'VEHICULES',
    'MOTO',
    'AUTRE'
  ], []);

  const [stats, setStats] = useState({
    total: 0,
    byType: {}
  });

  const fetchProperties = useCallback(async () => {
    console.log('fetchProperties called with user:', user);
    if (!user?.id && !user?._id) {
      console.log('No user ID found, aborting fetch');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('ndaku_auth_token');

      // First check if user is an owner
      const ownerResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/check-account`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!ownerResponse.data?.owner?._id) {
        setError('Compte propriétaire non trouvé');
        return;
      }

      const ownerId = user._id || user.id;
      console.log('Owner ID:', ownerId);
      
      console.log('Fetching properties for owner:', ownerId);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/owner/${ownerId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      const propertiesData = response.data?.data || [];
      console.log('Properties data:', propertiesData);
      setProperties(propertiesData);
      
      // Update stats
      setStats({
        total: propertiesData.length,
        byType: ownerTypes.reduce((acc, type) => {
          acc[type] = propertiesData.filter(p => p.type === type).length;
          return acc;
        }, {})
      });
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des biens:', err);
      const msg = formatError(err.response?.data?.message) || formatError(err.response?.data) || formatError(err.message) || 'Erreur lors du chargement des propriétés';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, ownerTypes]);

  // Charger les biens au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?._id || user?.id) {
      fetchProperties();
    }
  }, [fetchProperties, user]);

  const openAdd = () => { 
    setEditIndex(null); 
    setModalOpen(true); 
  };

  const openEdit = (i) => { 
    setEditIndex(i); 
    setModalOpen(true); 
  };

  const remove = async (i) => { 
    // Open confirmation dialog instead of using window.confirm
    setDeleteTargetIndex(i);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetIndex == null) return;
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('ndaku_auth_token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/${properties[deleteTargetIndex]._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setDeleteDialogOpen(false);
      setDeleteTargetIndex(null);
      setDeleteError(null);
      // refresh list
      await fetchProperties();
    } catch (err) {
      console.error('Erreur suppression:', err.response?.data || err.message);
      const msg = formatError(err.response?.data?.message) || formatError(err.response?.data) || formatError(err.message) || 'Erreur lors de la suppression';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const save = async (p) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ndaku_auth_token');
      
      // Créer un objet avec toutes les données
      const propertyData = {
        titre: p.title,
        type: p.type,
        prix: Number(p.price),
        description: p.description,
        adresse: p.address,
        commune: p.commune,
        quartier: p.quartier,
        categorie: p.type,
        agent : p?.agentId,
        statut: p.status || 'vente',
        chambres: Number(p.chambres) || 0,
        douches: Number(p.douches) || 0,
        salon: Number(p.salon) || 1,
        cuisine: Number(p.cuisine) || 1,
        sdb: Number(p.sdb) || 0,
        superficie: Number(p.superficie) || 0,
        status: p.status || 'vente',
        proprietaireType: 'Owner',
        proprietaire: user?.id || user?._id,
        geoloc: p.geoloc,
        features: p.features || []
      };

      // Créer FormData
      const formData = new FormData();

      // Convertir les images base64 en fichiers
      const imageFiles = await Promise.all((p.images || []).map(async (imageData, index) => {
        if (imageData instanceof File) return imageData;
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          try {
            const response = await fetch(imageData);
            const blob = await response.blob();
            return new File([blob], `image-${index}.jpg`, { type: 'image/jpeg' });
          } catch (e) { console.warn('Failed converting image data URI', e); return null; }
        }
        return null;
      }));

      // Convertir les vidéos (File instances or data URIs) en File
      const videoFiles = await Promise.all((p.videos || []).map(async (videoData, index) => {
        if (videoData instanceof File) return videoData;
        if (typeof videoData === 'string' && videoData.startsWith('data:video')) {
          try {
            const response = await fetch(videoData);
            const blob = await response.blob();
            const ext = (blob.type && blob.type.split('/')[1]) || 'mp4';
            return new File([blob], `video-${index}.${ext}`, { type: blob.type || 'video/mp4' });
          } catch (e) { console.warn('Failed converting video data URI', e); return null; }
        }
        return null;
      }));

      // Derive keepImages and keepVideos from inputs (existing URLs that are not data URIs)
      let derivedKeepImages = [];
      let derivedKeepVideos = [];
      try {
        derivedKeepImages = (p.images || []).filter(img => typeof img === 'string' && !img.startsWith('data:'));
      } catch (e) { console.warn('Could not derive keepImages', e); }
      try {
        derivedKeepVideos = (p.videos || []).filter(v => typeof v === 'string' && !v.startsWith('data:'));
      } catch (e) { console.warn('Could not derive keepVideos', e); }

      // Ensure keepImages/keepVideos are part of the JSON payload because backend reads @Body('data')
      const finalData = { ...propertyData };
      // Include agentId if selected so backend can link property to an agent
      if (p.agent) finalData.agentId = p.agentId || p.agent;
      if (derivedKeepImages.length) finalData.keepImages = derivedKeepImages;
      if (derivedKeepVideos.length) finalData.keepVideos = derivedKeepVideos;
      // Ajouter les données JSON
      formData.append('data', JSON.stringify(finalData));

      // Ajouter les images/videos
      // For create: backend expects 'images' and 'videos'
      // For update: backend expects 'newImages' and 'newVideos' (see mobilier.controller.ts)
      if (editIndex != null) {
        imageFiles.forEach(file => { if (file) formData.append('newImages', file); });
        videoFiles.forEach(file => { if (file) formData.append('newVideos', file); });

        // append keepImages / keepVideos for update
        try {
          const keepImages = (p.images || []).filter(img => typeof img === 'string' && !img.startsWith('data:'));
          if (keepImages.length) formData.append('keepImages', JSON.stringify(keepImages));
        } catch (e) { console.warn('Could not append derived keepImages', e); }
        try {
          const keepVideos = (p.videos || []).filter(v => typeof v === 'string' && !v.startsWith('data:'));
          if (keepVideos.length) formData.append('keepVideos', JSON.stringify(keepVideos));
        } catch (e) { console.warn('Could not append derived keepVideos', e); }
      } else {
        imageFiles.forEach(file => { if (file) formData.append('images', file); });
        videoFiles.forEach(file => { if (file) formData.append('videos', file); });
      }
      
      // Ajouter les détails spécifiques
      formData.append('chambres', p.chambres || '');
      formData.append('douches', p.douches || '');
      formData.append('salon', p.salon || '1');
      formData.append('cuisine', p.cuisine || '');
      formData.append('sdb', p.sdb || '');
      formData.append('superficie', p.superficie || '');
      formData.append('status', p.status || 'vente');
      
      // Convertir les objets en JSON
      if (p.features) {
        formData.append('features', JSON.stringify(p.features));
      }
      if (p.geoloc) {
        formData.append('geoloc', JSON.stringify(p.geoloc));
      }

      // Gérer les images passed directly in p.images (File instances)
      if (p.images && p.images.length > 0) {
        if (editIndex != null) {
          p.images.forEach((file) => {
            if (file instanceof File) {
              formData.append('newImages', file);
            }
          });
        } else {
          p.images.forEach((file) => {
            if (file instanceof File) {
              formData.append('images', file);
            }
          });
        }
      }

      // Ajouter l'ID du propriétaire
      if (user && user.id) {
        formData.append('ownerId', user.id);
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      if (editIndex != null) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/${properties[editIndex]._id}`,
          formData,
          { headers }
        );
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier`,
          formData,
          { headers }
        );
        
        console.log('Bien créé avec succès:', response.data);
      }
      
      // Recharger la liste des biens et réinitialiser l'état
      await fetchProperties();
      setModalOpen(false);
      setEditIndex(null);
      setError(null);
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data);
      const msg = formatError(err.response?.data?.message) || formatError(err.response?.data) || formatError(err.message) || 'Erreur lors de la sauvegarde';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return (properties || []).filter(p => {
      // Type filter
      if (filter.type && filter.type !== 'all') {
        const filterType = filter.type.toUpperCase();
        const propertyType = (p.type || '').toUpperCase();
        if (propertyType !== filterType) return false;
      }
      
      // Search filter
      if (filter.q && filter.q.trim().length) {
        const q = filter.q.toLowerCase();
        const searchFields = [
          p.titre,
          p.description,
          p.type,
          p.adresse,
          p.commune,
          p.quartier
        ].map(field => (field || '').toLowerCase());
        
        if (!searchFields.some(field => field.includes(q))) return false;
      }

      // Commune filter
      if (filter.commune && filter.commune !== 'Toutes') {
        if (!p.adresse || !p.adresse.toLowerCase().includes(filter.commune.toLowerCase())) return false;
      }

      // Chambres filter
      if (filter.chambres && filter.chambres !== 'Tous') {
        if (filter.chambres === '3+') {
          if ((p.chambres || 0) < 3) return false;
        } else {
          if (String(p.chambres || 0) !== filter.chambres) return false;
        }
      }

      // SDB filter
      if (filter.sdb && filter.sdb !== 'Tous') {
        if (String(p.sdb || p.douches || 0) !== filter.sdb) return false;
      }

      // Salon filter
      if (filter.salon && filter.salon !== 'Tous') {
        if (String(p.salon || 0) !== filter.salon) return false;
      }

      // Cuisine filter
      if (filter.cuisine && filter.cuisine !== 'Tous') {
        if (String(p.cuisine || 0) !== filter.cuisine) return false;
      }

      // Prix range filter
      if (filter.priceMin && Number(p.prix) < Number(filter.priceMin)) return false;
      if (filter.priceMax && Number(p.prix) > Number(filter.priceMax)) return false;

      return true;
    }).sort((a, b) => {
      // Sorting
      switch (filter.sort) {
        case 'price_asc':
          return (a.prix || 0) - (b.prix || 0);
        case 'price_desc':
          return (b.prix || 0) - (a.prix || 0);
        case 'relevance':
        default:
          return 0; // Keep original order
      }
    });
  }, [properties, filter]);

  const [requests, setRequests] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPropertyIcon = (type) => {
    switch(type) {
      case 'Appartement': return <ApartmentIcon />;
      case 'vehicules': return <CarIcon />;
      case 'Terrain': return <TerrainIcon />;
      default: return <HomeIcon />;
    }
  };

  if (!user) {
    return (
      <OwnerLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Veuillez vous connecter pour voir vos propriétés
            </Typography>
          </Paper>
        </Box>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Stats row */}
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            mb: 3,
            '& > .MuiGrid-item': {
              display: 'flex',
            }
          }}
        >
          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                width: '100%',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderRadius: 0,
                border: `1px solid ${theme.palette.primary.dark}`,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Stack spacing={1} width="100%">
                <Typography variant="h6" fontWeight={600}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Total de biens
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          {ownerTypes.map((t, idx) => (
            <Grid item xs={6} md={3} key={t}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: '100%',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ 
                  p: 1.5,
                  borderRadius: 0,
                  bgcolor: theme.palette.grey[50],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  {getPropertyIcon(t)}
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight={600}>
                    {stats.byType[t] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filter bar */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3,
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <TextField
                  placeholder="Rechercher un bien"
                  variant="outlined"
                  size="small"
                  value={filter.q}
                  onChange={(e) => setFilter(f => ({ ...f, q: e.target.value }))}
                  sx={{ 
                    minWidth: { sm: 250 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      backgroundColor: theme.palette.grey[50],
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  select
                  size="small"
                  value={filter.type}
                  onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
                  sx={{ 
                    minWidth: { sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      backgroundColor: theme.palette.grey[50],
                    }
                  }}
                >
                  <MenuItem value="all">Tous les types</MenuItem>
                  {ownerTypes.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderRadius: 0,
                  px: 3,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                Ajouter un bien
              </Button>
            </Stack>
            <PropertyFilterBar
              items={properties}
              onChange={(newFilters) => setFilter(f => ({ ...f, ...newFilters }))}
              defaultFilters={filter}
            />
          </Stack>
        </Paper>

        {/* Cette section a été supprimée car la fonctionnalité de liaison d'agence n'est pas encore implémentée dans l'API */}

        {/* Properties grid */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {filtered.map((p, i) => (
            <Grid item xs={12} sm={6} md={4} key={p._id || i} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 360,
                  boxShadow: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <PropertyCard
                  property={{
                    id: p._id,
                    name: p.titre,
                    description: p.description,
                    type: p.type,
                    price: p.prix,
                    address: p.adresse,
                    images: p.images,
                    agentId: p.agentId,
                    geoloc: p.geoloc || { lat: -4.3250, lng: 15.3220 },
                    status: p.statut,
                    chambres: p.chambres,
                    douches: p.douches,
                    salon: p.salon,
                    cuisine: p.cuisine,
                    sdb: p.sdb,
                    features: p.equipements || [],
                  }}
                />
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => openEdit(properties.indexOf(p))}
                      sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        boxShadow: 1,
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => remove(properties.indexOf(p))}
                      sx={{
                        bgcolor: 'background.paper',
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.lighter' },
                        boxShadow: 1,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          ))}
          {loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                  <CircularProgress size={24} />
                  <Typography color="text.secondary">
                    Chargement des biens...
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}
          {!loading && error && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: 'error.lighter' }}>
                <Typography color="error" align="center">
                  {error}
                </Typography>
              </Paper>
            </Grid>
          )}
          {!loading && !error && filtered.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {filter.q || filter.type !== 'all'
                    ? 'Aucun bien ne correspond aux critères de recherche'
                    : 'Vous n\'avez pas encore ajouté de biens'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAdd}
                  sx={{ mt: 2 }}
                >
                  Ajouter un bien
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Property Form Dialog */}
        <Dialog
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditIndex(null); }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: 0,
              m: 0,
              height: { xs: '100%', sm: 'auto' },
              border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
              boxShadow: { xs: 'none', sm: theme.shadows[1] }
            }
          }}
        >
          <DialogTitle>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">
                {editIndex !== null ? 'Modifier le bien' : 'Ajouter un bien'}
              </Typography>
              <IconButton
                edge="end"
                onClick={() => { setModalOpen(false); setEditIndex(null); }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <OwnerPropertyForm
              onSave={save}
              initial={editIndex != null ? properties[editIndex] : {}}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => { setModalOpen(false); setEditIndex(null); }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              form="property-form"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => { if (!deleteLoading) { setDeleteDialogOpen(false); setDeleteTargetIndex(null); setDeleteError(null); } }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.</Typography>
            {deleteError && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="error">{deleteError}</Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDeleteDialogOpen(false); setDeleteTargetIndex(null); setDeleteError(null); }} disabled={deleteLoading}>Annuler</Button>
            <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteLoading} startIcon={deleteLoading ? <CircularProgress size={16} /> : null}>
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </OwnerLayout>
  );
}
