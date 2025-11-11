import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Button,
  Stack,
  CardMedia,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  LocalOffer as TagIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import './PromotionDetails.css';

// Minimal mock loader - replace with real API call when available
const mockPromotions = {
  '1': {
    id: '1',
    title: 'Remise exceptionnelle sur appartement 3 pièces',
    description: 'Bel appartement lumineux proche de toutes commodités. Offre limitée avec remise de lancement.',
    images: [
      '/img/promo-1-1.jpg',
      '/img/promo-1-2.jpg',
      '/img/promo-1-3.jpg'
    ],
    type: 'Appartement',
    location: 'Douala, Akwa',
    priceBefore: 45000000,
    priceNow: 37500000,
    endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    comments: [
      { id: 'c1', author: 'Marie', text: "Très belle offre, je recommande la visite.", time: Date.now() - 3600 * 1000 },
      { id: 'c2', author: 'Paul', text: 'Le prix est attractif pour le quartier.', time: Date.now() - 2 * 3600 * 1000 }
    ]
  }
};

const mockAgent = {
  id: 'a1',
  name: 'Jean Dupont',
  title: 'Agent Immobilier Senior',
  photo: '/img/agent-profile.jpg',
  rating: 4.8,
  reviewCount: 124,
  description: 'Spécialiste en immobilier résidentiel avec plus de 10 ans d\'expérience.',
  phone: '+237 123456789',
  email: 'jean.dupont@example.com',
  certifications: ['Agent Certifié', 'Expert en Évaluation'],
  specialties: ['Résidentiel', 'Luxe', 'Investissement'],
  languages: ['Français', 'Anglais'],
  transactions: 150,
};

const mockSimilarPromotions = [
  {
    id: 'sp1',
    title: 'Villa moderne à Bonapriso',
    image: '/img/promo-similar-1.jpg',
    price: 55000000,
    discount: 15,
    location: 'Bonapriso, Douala',
  },
  // ...add more similar promotions
];

function formatCurrency(v) {
  try { return v.toLocaleString('fr-FR'); } catch (e) { return v; }
}

const PromotionDetails = () => {
  const { id } = useParams();
  const [promo, setPromo] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    // Replace with API call: fetch(`/api/promotions/${id}`)...
    const p = mockPromotions[id] || Object.values(mockPromotions)[0];
    setPromo(p);
  }, [id]);

  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min((promo?.images?.length||1)-1, i+1));
      if (e.key === 'ArrowLeft') setActiveIndex(i => Math.max(0, i-1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, promo]);

  if (!promo) return <div className="promo-container">Offre introuvable.</div>;

  const openLightbox = (index) => { setActiveIndex(index); setLightboxOpen(true); };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Grid container spacing={3}>
        {/* Colonne de gauche: Profil Agent */}
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                  src={mockAgent.photo}
                  alt={mockAgent.name}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {mockAgent.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {mockAgent.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                  <Rating value={mockAgent.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({mockAgent.reviewCount} avis)
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText primary={mockAgent.phone} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText primary={mockAgent.email} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Certifications
              </Typography>
              <Box sx={{ mb: 2 }}>
                {mockAgent.certifications.map((cert, i) => (
                  <Chip
                    key={i}
                    icon={<VerifiedIcon />}
                    label={cert}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Spécialités
              </Typography>
              <Box sx={{ mb: 2 }}>
                {mockAgent.specialties.map((spec, i) => (
                  <Chip
                    key={i}
                    icon={<StarIcon />}
                    label={spec}
                    variant="outlined"
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Box sx={{ my: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {mockAgent.transactions}+
                </Typography>
                <Typography variant="body2">
                  Transactions réussies
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {/* Handle contact */}}
                sx={{ mt: 2 }}
              >
                Contacter l'agent
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Colonne centrale: Détails de la promotion */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              {/* Existing gallery code */}
              <div className="promo-gallery">
                <div className="promo-main-image" onClick={() => openLightbox(activeIndex)}>
                  <img src={promo.images[activeIndex]} alt={`Image ${activeIndex+1}`} />
                </div>
                <div className="promo-thumbs">
                  {promo.images.map((img, i) => (
                    <button key={i} className={`thumb-btn ${i===activeIndex?'active':''}`} onClick={() => setActiveIndex(i)}>
                      <img src={img} alt={`Vignette ${i+1}`} />
                    </button>
                  ))}
                </div>
              </div>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h4" gutterBottom>
                  {promo.title}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon color="primary" sx={{ mr: 1 }} />
                      <Typography>{promo.location}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HomeIcon color="primary" sx={{ mr: 1 }} />
                      <Typography>{promo.type}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ 
                  bgcolor: 'primary.light', 
                  p: 2, 
                  borderRadius: 1,
                  color: 'primary.contrastText',
                  mb: 3 
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Prix avant</Typography>
                      <Typography variant="h6" sx={{ textDecoration: 'line-through' }}>
                        {formatCurrency(promo.priceBefore)} XAF
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Prix promotionnel</Typography>
                      <Typography variant="h5">
                        {formatCurrency(promo.priceNow)} XAF
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Typography variant="body1" paragraph>
                  {promo.description}
                </Typography>

                {/* Additional property details */}
                <Grid container spacing={2} sx={{ my: 3 }}>
                  {/* Add more property details like surface, rooms, etc. */}
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Comments section with improved styling */}
          <Card elevation={2} sx={{ mt: 3 }}>
            <CardContent>
              <section className="promo-comments">
                <h3>Commentaires</h3>
                {promo.comments.length===0 && <div className="no-comments">Aucun commentaire pour le moment.</div>}
                <ul>
                  {promo.comments.map(c => (
                    <li key={c.id} className="comment-item">
                      <div className="comment-author">{c.author}</div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-time">{new Date(c.time).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>
          </Card>
        </Grid>

        {/* Colonne de droite: Promotions similaires */}
        <Grid item xs={12} md={3}>
          <Typography variant="h6" gutterBottom>
            Promotions similaires
          </Typography>
          <Stack spacing={2}>
            {mockSimilarPromotions.map(promo => (
              <Card key={promo.id} sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={promo.image}
                  alt={promo.title}
                />
                <CardContent>
                  <Typography variant="subtitle1" noWrap>
                    {promo.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {promo.location}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(promo.price)} XAF
                    </Typography>
                    <Chip
                      label={`-${promo.discount}%`}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lb-close" onClick={() => setLightboxOpen(false)}>×</button>
            <button className="lb-prev" onClick={() => setActiveIndex(i => Math.max(0, i-1))} aria-label="Précédent">‹</button>
            <img src={promo.images[activeIndex]} alt={`Grande vue ${activeIndex+1}`} className="lb-image" />
            <button className="lb-next" onClick={() => setActiveIndex(i => Math.min((promo.images.length||1)-1, i+1))} aria-label="Suivant">›</button>
          </div>
        </div>
      )}
    </Box>
  );
};

export default PromotionDetails;
