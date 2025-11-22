import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import * as agenciesApi from '../api/agencies';
import Navbar from '../components/common/Navbar';
import {
  Container,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import HomeLayout from '../components/homeComponent/HomeLayout';

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ownerAccount, setOwnerAccount] = useState(null);
  const [agencySession, setAgencySession] = useState(null);
  const [agency, setAgency] = useState(null);
  const [agentProfiles, setAgentProfiles] = useState(null);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    favoriteCount: 0,
    messageCount: 0,
    propertyCount: 0,
  });

  useEffect(() => {
    const detectRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const authToken = token || localStorage.getItem('ndaku_auth_token');

        // 1) owner: call /api/owner/check-account (same check used elsewhere)
        try {
          if (authToken) {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/check-account`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              setOwnerAccount(data);
            }
          }
        } catch (e) {
          // non-fatal
          console.warn('owner check failed', e);
        }

        // 2) agency: try client-side session first then fetch agency details
        try {
          const session = agenciesApi.currentAgencySession && agenciesApi.currentAgencySession();
          setAgencySession(session);
          if (session && session.id) {
            const a = await agenciesApi.fetchAgency(session.id);
            setAgency(a);
          }
        } catch (e) {
          console.warn('agency detection failed', e);
        }

        // 3) agent: call /api/agents/me (requires auth)
        try {
          if (authToken) {
            const r = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/agents/me`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (r.ok) {
              const data = await r.json();
              // The API here returns an array of agents tied to the user (see controller)
              if (Array.isArray(data) && data.length) setAgentProfiles(data);
              else if (data && data.length) setAgentProfiles(data);
            }
          }
        } catch (e) {
          console.warn('agent check failed', e);
        }
      } catch (err) {
        console.error('Role detection error', err);
        setError('Impossible de déterminer le type de compte pour l\'instant.');
      } finally {
        setLoading(false);
      }
    };
    detectRoles();
  }, [token]);

  useEffect(() => {
    // Ajout: Charger les statistiques de l'utilisateur
    const loadStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/users/stats/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.warn('Failed to load user stats', e);
      }
    };
    
    if (user?.id || user?._id) {
      loadStats();
    }
    console.log("usr :", user);
  }, [user, token]);

  if (!user) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>Vous n'êtes pas connecté</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Connectez-vous pour voir votre profil et les options liées à votre compte.</Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={() => navigate('/login')}>Se connecter</Button>
                <Button component={RouterLink} to="/register" variant="outlined">Créer un compte</Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <HomeLayout />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={1}>
          {/* Colonne de gauche: Profile principal */}
          <Grid item xs={12} md={8} sx={{ width : '100%'}}>
            <Card sx={{ height: '100%'}}>
              <CardContent >
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Avatar
                    src={user?.profileUrl || '/default-avatar.png'}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      border: 3,
                      borderColor: 'primary.main'
                    }}
                  />
                  <IconButton 
                    sx={{ position: 'absolute', right: 0, top: 0 }}
                    component={RouterLink}
                    to="/profile/edit"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Typography variant="h5" align="center" sx={{ mt: 2 }}>
                  {user?.username || 'Utilisateur'}
                </Typography>
                <Typography color="text.secondary" align="center">
                  {user?.email}
                </Typography>

                <List>
                  {user?.telephone && (
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText primary={user.telephone} />
                    </ListItem>
                  )}
                  {user?.adresse && (
                    <ListItem>
                      <ListItemIcon><LocationIcon /></ListItemIcon>
                      <ListItemText primary={user.adresse} />
                    </ListItem>
                  )}
                </List>

                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2} sx={{ display : 'flex', justifyContent: 'center'}}>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="h6">{stats.favoriteCount}</Typography>
                        <Typography variant="body2">Favoris</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="h6">{stats.messageCount}</Typography>
                        <Typography variant="body2">Messages</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="h6">{stats.propertyCount}</Typography>
                        <Typography variant="body2">Biens</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Colonne de droite: Rôles et actions */}
          <Grid item xs={12} md={8}>
            {loading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2 }}>Chargement des informations...</Typography>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {/* Carte des rôles */}
                <Card sx={{width : '100%'}}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Rôles et Accès
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                      {ownerAccount?.hasAccount && (
                        <Chip 
                          icon={<HomeIcon />}
                          label="Propriétaire"
                          color="success"
                          variant="outlined"
                          onClick={() => navigate('/owner/dashboard')}
                        />
                      )}
                      {agencySession && (
                        <Chip
                          icon={<BusinessIcon />}
                          label="Agence"
                          color="primary"
                          variant="outlined"
                          onClick={() => navigate('/agency/dashboard')}
                        />
                      )}
                      {agentProfiles?.length > 0 && (
                        <Chip
                          icon={<PersonIcon />}
                          label={`Agent (${agentProfiles.length})`}
                          color="warning"
                          variant="outlined"
                          onClick={() => navigate('/agent/dashboard')}
                        />
                      )}
                      <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            component={RouterLink}
                            to="/reservations"
                          >
                            Voir les réservations
                          </Button>
                        </Grid>
                    </Stack>

                    {/* Actions rapides */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<MessageIcon />}
                          component={RouterLink}
                          to="/messages"
                        >
                          Messages
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<FavoriteIcon />}
                          component={RouterLink}
                          to="/favourites"
                        >
                          Favoris
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Section Propriétaire */}
                {ownerAccount?.hasAccount && (
                  <Card sx={{width : '100%'}}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Espace Propriétaire
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            component={RouterLink}
                            to="/owner/properties"
                          >
                            Gérer mes biens
                          </Button>
                        </Grid>
                        
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Section Agence */}
                {agencySession && (
                  <Card sx={{width : '100%'}}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Espace Agence
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            component={RouterLink}
                            to="/agency/properties"
                          >
                            Catalogue de biens
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            component={RouterLink}
                            to="/agency/agents"
                          >
                            Gérer les agents
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
