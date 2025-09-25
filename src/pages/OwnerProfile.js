import React, { useEffect, useRef, useState } from 'react';
import { fetchUserProfile, fetchOwnerProfile, updateProfile } from '../api/profile';
import { fetchReviews, addReview } from '../api/reviews';
import OwnerLayout from '../components/owner/OwnerLayout';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
  HourglassEmpty as PendingIcon,
  Error as UnverifiedIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  House as HouseIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Star as StarIcon,
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OwnerProfile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  
  const [owner, setOwner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileRef = useRef(null);

  // Statistiques
  const [stats, setStats] = useState({
    properties: 0,
    views: 0,
    inquiries: 0,
    rating: 0
  });

  useEffect(() => {
    let mounted = true;
    
    const loadProfile = async () => {
      try {
        setLoading(true);
        // Charger à la fois le profil utilisateur et le profil propriétaire
        const [userProfile, ownerProfile] = await Promise.all([
          fetchUserProfile(),
          fetchOwnerProfile()
        ]);
        
        if (mounted) {
          // Fusionner les deux profils
          setOwner({
            ...userProfile,
            ...ownerProfile,
            // Garder les champs spécifiques du propriétaire
            certification: ownerProfile.certification,
            businessDetails: ownerProfile.businessDetails,
            subscription: ownerProfile.subscription
          });

          // Mettre à jour les stats
          setStats({
            properties: ownerProfile.propertyCount || 0,
            views: ownerProfile.totalViews || 0,
            inquiries: ownerProfile.inquiryCount || 0,
            rating: ownerProfile.rating || 0
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Erreur lors du chargement du profil");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => mounted = false;
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadReviews = async () => {
      try {
        if (owner?._id) {
          const fetchedReviews = await fetchReviews(owner._id);
          if (mounted) {
            setReviews(fetchedReviews);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des avis:', err);
      }
    };
    loadReviews();
    return () => mounted = false;
  }, [owner?._id]);

  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    // Validate file size
    if (f.size > 5 * 1024 * 1024) { // 5MB limit
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validation
      if (!owner.name?.trim()) {
        setError("Le nom est requis");
        return;
      }
      if (!owner.email?.trim()) {
        setError("L'email est requis");
        return;
      }
      if (!owner.phone?.trim()) {
        setError("Le numéro de téléphone est requis");
        return;
      }

      const updateData = {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        bio: owner.bio,
        businessDetails: owner.businessDetails || {},
      };

      // Ajouter les fichiers si nécessaire
      const files = {};
      if (preview && preview.startsWith('data:')) {
        // Convertir le base64 en File
        const response = await fetch(preview);
        const blob = await response.blob();
        files.avatar = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      }
      
      await updateProfile(updateData, files);
      
      // Recharger les données
      const [userProfile, ownerProfile] = await Promise.all([
        fetchUserProfile(),
        fetchOwnerProfile()
      ]);
      
      setOwner({
        ...userProfile,
        ...ownerProfile,
        certification: ownerProfile.certification,
        businessDetails: ownerProfile.businessDetails,
        subscription: ownerProfile.subscription
      });

      setPreview('');
      setSuccess("Profil mis à jour avec succès");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Container>
      </OwnerLayout>
    );
  }

  if (!owner) {
    return (
      <OwnerLayout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error">
            Impossible de charger le profil. Veuillez réessayer plus tard.
          </Alert>
        </Container>
      </OwnerLayout>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <OwnerLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {(error || success) && (
          <Box mb={3}>
            <Alert severity={error ? "error" : "success"}>
              {error || success}
            </Alert>
          </Box>
        )}

        {/* En-tête du profil - Hero/banner style */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }} elevation={2}>
          {/* Banner with background image */}
          <Box
            sx={{
              height: { xs: 160, md: 240 },
              backgroundImage: `url(${preview || owner.avatar || '/logo192.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}
          >
            {/* Dark overlay for readability */}
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)' }} />

            {/* Name + quick actions on banner */}
            <Box sx={{ position: 'absolute', left: { xs: 16, md: 32 }, bottom: { xs: 12, md: 20 }, color: '#fff' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {owner.name || 'Non renseigné'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                {owner.certification?.status === 'verified' ? (
                  <Chip
                    icon={<VerifiedIcon sx={{ color: 'white' }} />}
                    label="Vérifié"
                    color="success"
                    variant="filled"
                    sx={{ bgcolor: 'success.dark' }}
                  />
                ) : owner.certification?.pending ? (
                  <Chip label="En attente" color="warning" variant="filled" sx={{ bgcolor: 'warning.dark' }} />
                ) : (
                  <Chip label="Non vérifié" color="default" variant="filled" />
                )}
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Membre depuis {new Date(owner.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>

            {/* Small camera action at top-right of banner */}
            <IconButton
              aria-label="Changer la bannière"
              component="label"
              sx={{ position: 'absolute', right: 12, top: 12, bgcolor: 'background.paper' }}
              onClick={() => fileRef.current && fileRef.current.click()}
              size="small"
            >
              <PhotoCameraIcon fontSize="small" />
              <input ref={fileRef} type="file" accept="image/*" onChange={onPick} hidden />
            </IconButton>
          </Box>

          {/* Info row below banner with overlapping avatar */}
          <Grid container spacing={3} alignItems="center" sx={{ p: { xs: 2, md: 3 } }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center' }}>
                <Avatar
                  src={preview || owner.avatar || ''}
                  alt={owner.name || 'Propriétaire'}
                  sx={{
                    width: { xs: 96, md: 120 },
                    height: { xs: 96, md: 120 },
                    transform: { xs: 'none', md: 'translateY(-36px)' },
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: 3,
                    bgcolor: preview || owner.avatar ? 'transparent' : theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    fontSize: { xs: 24, md: 32 }
                  }}
                >
                  {!preview && !owner.avatar && (
                    (owner.name || 'U')
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  )}
                </Avatar>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6">{owner.email}</Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <PhoneIcon color="action" />
                <Typography>{owner.phone || 'Non renseigné'}</Typography>
              </Box>
              {owner.businessDetails?.address && (
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <LocationIcon color="action" />
                  <Typography>{owner.businessDetails.address}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack spacing={1} alignItems={{ xs: 'center', md: 'flex-end' }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
                    size="small"
                  >
                    Éditer
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MessageIcon />}
                    size="small"
                  >
                    Contacter
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1} alignItems="center">
                  <HouseIcon fontSize="large" color="primary" />
                  <Typography variant="h4">{stats.properties}</Typography>
                  <Typography color="text.secondary">Biens publiés</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1} alignItems="center">
                  <ViewIcon fontSize="large" color="primary" />
                  <Typography variant="h4">{stats.views}</Typography>
                  <Typography color="text.secondary">Vues totales</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1} alignItems="center">
                  <MessageIcon fontSize="large" color="primary" />
                  <Typography variant="h4">{stats.inquiries}</Typography>
                  <Typography color="text.secondary">Demandes reçues</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1} alignItems="center">
                  <StarIcon fontSize="large" color="primary" />
                  <Typography variant="h4">{stats.rating.toFixed(1)}</Typography>
                  <Box>
                    <Rating value={stats.rating} precision={0.1} readOnly />
                    <Typography color="text.secondary" align="center">
                      {reviews.length} avis
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Onglets */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Informations" />
            <Tab label="Entreprise" />
            <Tab label="Avis" />
            <Tab label="Documents" />
          </Tabs>

          {/* Contenu des onglets */}
          <Box sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom complet"
                    value={owner.name || ''}
                    onChange={e => setOwner({ ...owner, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={owner.email || ''}
                    onChange={e => setOwner({ ...owner, email: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={owner.phone || ''}
                    onChange={e => setOwner({ ...owner, phone: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Biographie"
                    value={owner.bio || ''}
                    onChange={e => setOwner({ ...owner, bio: e.target.value })}
                    helperText="Présentez-vous aux visiteurs"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom de l'entreprise"
                    value={owner.businessDetails?.name || ''}
                    onChange={e => setOwner({
                      ...owner,
                      businessDetails: {
                        ...owner.businessDetails,
                        name: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="RCCM"
                    value={owner.businessDetails?.rccm || ''}
                    onChange={e => setOwner({
                      ...owner,
                      businessDetails: {
                        ...owner.businessDetails,
                        rccm: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={owner.businessDetails?.address || ''}
                    onChange={e => setOwner({
                      ...owner,
                      businessDetails: {
                        ...owner.businessDetails,
                        address: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description de l'entreprise"
                    value={owner.businessDetails?.description || ''}
                    onChange={e => setOwner({
                      ...owner,
                      businessDetails: {
                        ...owner.businessDetails,
                        description: e.target.value
                      }
                    })}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Stack spacing={2}>
                {reviews.length === 0 ? (
                  <Typography color="text.secondary" align="center">
                    Aucun avis pour le moment
                  </Typography>
                ) : (
                  reviews.map(review => (
                    <Paper key={review.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Rating value={review.rating} readOnly />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(review.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography>{review.text}</Typography>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Documents légaux
                </Typography>
                <List>
                  {owner.businessDetails?.documents?.map((doc, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar>
                          <DescriptionIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={doc.name}
                        secondary={`Ajouté le ${new Date(doc.uploadDate).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<DescriptionIcon />}
                >
                  Ajouter un document
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      // TODO: Gérer l'upload de document
                    }}
                  />
                </Button>
              </Stack>
            </TabPanel>
          </Box>
        </Paper>

        {/* Boutons d'action */}
        <Paper
          sx={{
            position: 'sticky',
            bottom: 16,
            left: 0,
            right: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            zIndex: 1,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={async () => {
              const [userProfile, ownerProfile] = await Promise.all([
                fetchUserProfile(),
                fetchOwnerProfile()
              ]);
              setOwner({
                ...userProfile,
                ...ownerProfile,
                certification: ownerProfile.certification,
                businessDetails: ownerProfile.businessDetails,
                subscription: ownerProfile.subscription
              });
              setPreview('');
              setError(null);
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Paper>
      </Container>
    </OwnerLayout>
  );
}