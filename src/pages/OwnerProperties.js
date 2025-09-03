import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OwnerLayout from '../components/owner/OwnerLayout';
import OwnerPropertyForm from '../components/owner/OwnerPropertyForm';
import PropertyCard from '../components/property/PropertyCard';
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

export default function OwnerProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState({ q: '', type: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ownerTypes = useMemo(() => [
    'APPARTEMENT',
    'MAISON',
    'VILLA',
    'TERRAIN',
    'BUREAU'
  ], []);

  const [stats, setStats] = useState({
    total: 0,
    byType: {}
  });

  const fetchProperties = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('ndaku_auth_token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/owner/${user.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      console.log('Biens récupérés:', response.data);
      const propertiesData = response.data?.data || [];
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
      setError(err.response?.data?.message || 'Erreur lors du chargement des propriétés');
    } finally {
      setLoading(false);
    }
  }, [user, ownerTypes]);

  // Charger les biens au montage et après chaque création/modification/suppression
  useEffect(() => {
    const loadProperties = async () => {
      try {
        // Log l'état de l'authentification
        console.log('État auth:', { user, isAuthenticated: !!user });
        
        if (!user?._id) {
          console.log('Pas d\'utilisateur ou pas d\'ID');
          return;
        }

        setLoading(true);
        const token = localStorage.getItem('ndaku_auth_token');
        
        if (!token) {
          console.log('Pas de token d\'authentification');
          return;
        }

        console.log('Appel API avec:', {
          url: `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/owner/${user._id}`,
          token: token ? 'présent' : 'absent'
        });

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/owner/${user._id}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Réponse du serveur:', response.data);
        
        // S'assurer d'avoir un tableau même si la réponse est vide
        const propertiesData = response.data?.data || [];
        console.log('Données traitées:', propertiesData);
        
        setProperties(propertiesData);
        
        // Mettre à jour les statistiques
        setStats({
          total: propertiesData.length,
          byType: ownerTypes.reduce((acc, type) => {
            acc[type] = propertiesData.filter(p => p.type === type).length;
            return acc;
          }, {})
        });
        
        setError(null);
      } catch (err) {
        console.error('Erreur détaillée:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.message || 'Erreur lors du chargement des propriétés');
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [user, ownerTypes]);

  const openAdd = () => { 
    setEditIndex(null); 
    setModalOpen(true); 
  };

  const openEdit = (i) => { 
    setEditIndex(i); 
    setModalOpen(true); 
  };

  const remove = async (i) => { 
    if (!window.confirm('Supprimer ce bien ?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('ndaku_auth_token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/mobilier/${properties[i]._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      await fetchProperties();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
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
        statut: p.status || 'vente',
        chambres: Number(p.chambres) || 0,
        douches: Number(p.douches) || 0,
        salon: Number(p.salon) || 1,
        cuisine: Number(p.cuisine) || 1,
        sdb: Number(p.sdb) || 0,
        superficie: Number(p.superficie) || 0,
        status: p.status || 'vente',
        proprietaireType: 'Owner',
        proprietaire: user?.id,
        geoloc: p.geoloc,
        features: p.features || []
      };

      // Créer FormData
      const formData = new FormData();

      // Convertir les images base64 en fichiers
      const imageFiles = await Promise.all(p.images.map(async (imageData, index) => {
        // Si c'est déjà un File, on le retourne tel quel
        if (imageData instanceof File) return imageData;
        
        // Si c'est une string base64, on la convertit en File
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          const response = await fetch(imageData);
          const blob = await response.blob();
          return new File([blob], `image-${index}.jpg`, { type: 'image/jpeg' });
        }
        return null;
      }));

      // Ajouter les données JSON
      formData.append('data', JSON.stringify(propertyData));

      // Ajouter les images
      imageFiles.forEach(file => {
        if (file) {
          formData.append('images', file);
        }
      });
      
      // Ajouter les détails spécifiques
      formData.append('chambres', p.chambres || '');
      formData.append('douches', p.douches || '');
      formData.append('salon', p.salon || '1');
      formData.append('cuisine', p.cuisine || '1');
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

      // Gérer les images
      if (p.images && p.images.length > 0) {
        p.images.forEach((file, index) => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
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
      
      // Recharger la liste des biens
      await fetchProperties();
      setModalOpen(false);
      setEditIndex(null);
      setError(null);
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const filtered = (properties || []).filter(p => {
    if (filter.type && filter.type !== 'all' && p.type !== filter.type) return false;
    if (filter.q && filter.q.trim().length) {
      const q = filter.q.toLowerCase();
      return (p.titre && p.titre.toLowerCase().includes(q)) ||
             (p.description && p.description.toLowerCase().includes(q)) ||
             (p.type && p.type.toLowerCase().includes(q)) ||
             (p.adresse && p.adresse.toLowerCase().includes(q));
    }
    return true;
  });

  const [requests, setRequests] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPropertyIcon = (type) => {
    switch(type) {
      case 'Appartement': return <ApartmentIcon />;
      case 'Voiture': return <CarIcon />;
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
                onChange={(e) => setFilter({ ...filter, q: e.target.value })}
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
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
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
              <IconButton 
                onClick={() => setFilter({ q: '', type: 'all' })}
                sx={{ 
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    bgcolor: theme.palette.action.hover 
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
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
        </Paper>

        {/* Cette section a été supprimée car la fonctionnalité de liaison d'agence n'est pas encore implémentée dans l'API */}

        {/* Properties grid */}
        <Grid container spacing={3}>
          {filtered.map((p, i) => (
            <Grid item xs={12} sm={6} md={4} key={p._id || i}>
              <Box sx={{ position: 'relative' }}>
                <PropertyCard property={{
                  id: p._id,
                  name: p.titre,
                  description: p.description,
                  type: p.type,
                  price: p.prix,
                  address: p.adresse,
                  images: p.images && p.images.length > 0 
                    ? p.images.map(img => `${process.env.REACT_APP_BACKEND_APP_URL}/${img}`) 
                    : [require('../img/property-1.jpg')],
                  agentId: p.agentId,
                  geoloc: p.geoloc || { lat: -4.3250, lng: 15.3220 },
                  status: p.statut,
                  chambres: p.chambres,
                  douches: p.douches,
                  salon: p.salon,
                  cuisine: p.cuisine,
                  sdb: p.sdb,
                  features: p.equipements || [],
                }} />
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => openEdit(properties.indexOf(p))}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        boxShadow: 1
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
                        boxShadow: 1
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
                  {filter.q || filter.type !== 'all' ? 
                    'Aucun bien ne correspond aux critères de recherche' :
                    'Vous n\'avez pas encore ajouté de biens'
                  }
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
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </OwnerLayout>
  );
}
