import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Chip,
  Button, TextField, MenuItem, Box, CircularProgress,
  Alert, Tabs, Tab, Divider, Avatar, IconButton
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

  useEffect(() => {
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
                              height: '200px', 
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                          <Chip
                            label={reservation.status}
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
                        <Typography variant="h6" gutterBottom>
                          {reservation.property.title}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography>
                                Du {formatDate(reservation.startDate)} à {reservation.time}
                                <br />
                                Au {formatDate(reservation.endDate)} à {reservation.time}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography>{reservation.property.location}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="h6" color="primary" gutterBottom>
                              {reservation.totalPrice} €
                            </Typography>
                            <Button 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                              href={`/properties/${reservation.property?._id}`}
                            >
                              Détails
                            </Button>
                            {reservation.status === 'pending' && (
                              <Button 
                                variant="contained" 
                                color="error"
                                onClick={() => {/* Handle cancellation */}}
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
    </>
  );
}
