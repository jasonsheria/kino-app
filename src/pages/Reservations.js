import React, { useState, useEffect } from 'react';
import {
  DialogContent, Container, Grid, Card, CardContent, Typography, Chip,
  Button, TextField, MenuItem, Box, CircularProgress,
  Alert, Tabs, Tab, Divider, Avatar, IconButton, Dialog, DialogTitle, DialogActions
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  HomeWork as PropertyIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import HomeLayout from '../components/homeComponent/HomeLayout';
import { format, addHours } from 'date-fns';
const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info'
};

export default function Reservations() {
  const { user, token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'date',
    dateRange: 'all'
  });
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [deleteError, setDeleteError] = useState(null);
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
  const fetchReservations = async () => {
      setLoading(true);
      try {
        // Correction de l'URL et ajout de l'ID de l'utilisateur dans le chemin
        const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/reservations?site=${process.env.REACT_APP_SITE_ID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des réservations');
        }

        const res = await response.json();
        const data =res.data;
        console.log("Réservations chargées:", data);
        
        // Normalisation des données reçues
        const normalizedReservations = Array.isArray(data) ? data.map(res => ({
          _id: res._id || res.id,
          status: res.status || 'pending',
          startDate: res.date || res.dateDebut,
          endDate: res.date  || res.dateFin,
          time : res.time,
          totalPrice: res.property?.prix  || 0,
          property: {
            _id: res.property?._id || res.propertyId,
            title: res.property?.titre || res.propertyTitle || 'Sans titre',
            location: res.property?.adresse || res.adresse || 'Adresse non spécifiée',
            images: res.property?.images || [res.property?.image] || []
          }
        })) : [];

        setReservations(normalizedReservations);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les réservations');
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => { 
    if (user?._id || user?.id) {
      fetchReservations();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const filteredReservations = reservations.filter(res => {
    if (filters.status !== 'all' && res.status !== filters.status) return false;
    if (filters.search && !res.property?.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    // Filtre par onglet
    switch(tab) {
      case 1: // En cours
        return res.status === 'confirmed' && new Date(res.startDate) <= new Date() && new Date(res.endDate) >= new Date();
      case 2: // À venir
        return res.status === 'confirmed' && new Date(res.startDate) > new Date();
      case 3: // Terminées
        return res.status === 'completed' || new Date(res.endDate) < new Date();
      default: // Toutes
        return true;
    }
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const remove = async (i) => { 
    // Open confirmation dialog instead of using window.confirm
    setDeleteTargetIndex(i);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };
 const handledeleteReservation = async () => {
  if (deleteTargetIndex == null) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/reservations/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reservationId: deleteTargetIndex })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la réservation');
      }
      setDeleteDialogOpen(false);
      setDeleteTargetIndex(null);
      setDeleteError(null);
      // Mettre à jour la liste des réservations après la suppression
      await fetchReservations();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      const msg = formatError(err.response?.data?.message) || formatError(err.response?.data) || formatError(err.message) || 'Erreur lors de la suppression';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }

  };

  return (
    <>
      <HomeLayout />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Mes Réservations
          </Typography>
          <Tabs 
            value={tab} 
            onChange={(e, newValue) => setTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Toutes" />
            <Tab label="En cours" />
            <Tab label="À venir" />
            <Tab label="Terminées" />
          </Tabs>
        </Box>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  label="Statut"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="confirmed">Confirmée</MenuItem>
                  <MenuItem value="cancelled">Annulée</MenuItem>
                  <MenuItem value="completed">Terminée</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  label="Trier par"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="price">Prix</MenuItem>
                  <MenuItem value="status">Statut</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Liste des réservations */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : filteredReservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Aucune réservation trouvée
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              href="/properties"
            >
              Explorer les biens
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredReservations.map((reservation) => (
              <Grid item xs={12} key={reservation._id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ position: 'relative' }}>
                          <img 
                            src={reservation.property.images[0] || '/default-property.jpg'} 
                            alt={reservation.property.title}
                            style={{ 
                              width: '100%', 
                              maxHeight: '345px', 
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                          <Chip
                            label={reservation.status==='padding'? 'En attente' : reservation.status==='confirmed' ? 'Confirmée' : reservation.status==='cancelled' ? 'Annulée' : 'Terminée'}
                            color={statusColors[reservation.status]}
                            sx={{ 
                              position: 'absolute',
                              top: 8,
                              right: 8
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' , fontSize : '1.7rem', textTransform : 'capitalize', borderBottom : '1px solid'}}>
                          {reservation.property.title}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} style={{marginBottom : '1px solid gray'}}>
                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography>Adresse : {reservation.property.location}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              
                              <Typography style={{marginTop : 10, marginBottom : 10, gap : 10}}>
                                <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} /> Date reservation : {formatDate(reservation.startDate)} à {reservation.time}
                                <br />
                                <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} /> Fin reservation : {formatDate(addHours(reservation.endDate, 24))} à {reservation.time}
                              </Typography>
                              
                            </Box>
                             <Typography>
                                <strong>Notice :</strong>  Depassé ce delai vous n'aurez plus gain de cause de réclamer un remboursement en cas de payement
                               </Typography>
                           
                          </Grid>
                          <Grid item xs={12} sm={6} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'space-betwen' }}> 
                            <Typography variant="h6" color="primary" gutterBottom>
                              <strong>Prix : </strong>{reservation.totalPrice} $
                            </Typography>
                            <Button 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                              href={`login#/properties/${reservation.property?._id}`}
                            >
                              Détails
                            </Button>
                            {reservation.status === 'pending' && (
                              <Button 
                                variant="contained" 
                                color="error"
                                onClick={() => {remove(reservation._id)}}
                              >
                                Annuler
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
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
                  <Button color="error" variant="contained" onClick={handledeleteReservation} disabled={deleteLoading} startIcon={deleteLoading ? <CircularProgress size={16} /> : null}>
                    {deleteLoading ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </DialogActions>
              </Dialog>
    </>
  );
}
