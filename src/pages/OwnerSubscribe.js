import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Container, Grid, Card, CardContent, CardActions, Typography, 
  Button, Stack, Box, Chip, Avatar, useTheme, useMediaQuery, 
  CircularProgress, Divider, Alert, AlertTitle, Paper
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';

// --- COMPOSANT : PLAN CARD (DESIGN ULTRA-PRO) ---
function PlanCard({ plan, selected, onSelect, onAction, featured, submitting, isMobile }) {
  const isSelected = selected && selected.id === plan.id;

  return (
    <Card
      onClick={() => onSelect(plan)}
      sx={{
        cursor: 'pointer',
        borderRadius: isMobile ? 4 : 5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isSelected ? '2px solid #0ea5a4' : '1px solid #f1f5f9',
        backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
        transform: isSelected ? 'scale(1.01)' : 'none',
        '&:hover': { 
          transform: isMobile ? 'none' : 'translateY(-8px)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
        }
      }}
    >
      {featured && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12, bgcolor: '#0ea5a4', color: 'white',
          px: 1.5, py: 0.4, borderRadius: 10, fontSize: '0.65rem', fontWeight: 900, zIndex: 1
        }}>
          POPULAIRE
        </Box>
      )}

      <CardContent sx={{ p: isMobile ? 3 : 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
          {plan.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', my: isMobile ? 1 : 2 }}>
          <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 900 }}>
            {plan.price}$
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', ml: 0.5, fontSize: '0.8rem' }}>
            {plan.id === 'commission' ? '/vente' : '/mois'}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: '#475569', mb: 3, fontSize: isMobile ? '0.85rem' : '0.9rem', minHeight: isMobile ? 'auto' : '3em' }}>
          {plan.desc}
        </Typography>

        <Divider sx={{ mb: 3, opacity: 0.5 }} />

        <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
          {plan.bullets.map((text, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
              <CheckCircleIcon sx={{ fontSize: 18, color: '#0ea5a4', mt: 0.2 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                {text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
        <Button
          variant={isSelected ? 'contained' : 'outlined'}
          fullWidth
          disabled={submitting}
          onClick={(e) => { e.stopPropagation(); onAction(plan); }}
          sx={{ 
            borderRadius: 3, py: isMobile ? 1.2 : 1.5, fontWeight: 800, 
            textTransform: 'none', fontSize: isMobile ? '0.85rem' : '0.95rem' 
          }}
        >
          {isSelected ? 'Confirmer' : 'Choisir'}
        </Button>
      </CardActions>
    </Card>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function OwnerSubscribe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ id: '', name: '', type: 'owner', subType: '', endDate: null, isExpired: false });

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem('ndaku_auth_token');
        if (!token) return navigate('/login');

        const res = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/check-account`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const user = data.owner || data;
        const expireDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
        
        setProfile({
          id: searchParams.get('id') || user._id,
          name: user.name || user.username || 'Utilisateur',
          type: user.accountType || 'owner',
          subType: user.subscriptionType || 'Aucun',
          endDate: expireDate,
          isExpired: expireDate ? new Date() > expireDate : false
        });
      } catch (e) { setError("Erreur réseau"); }
      finally { setLoading(false); }
    };
    fetchAccount();
  }, [navigate, searchParams]);

  const plans = useMemo(() => {
    const list = {
      owner: [
        { id: 'freemium', title: 'Start', price: 0, desc: 'Lancez-vous gratuitement.', bullets: ['2 biens actifs', 'Support Standard'] },
        { id: 'monthly', title: 'Premium', price: 20, desc: 'Performance maximale.', bullets: ['Biens illimités', 'Badge Confiance', 'Support VIP'], featured: true },
        { id: 'commission', title: 'Flex', price: 0, desc: 'Payez selon vos ventes.', bullets: ['5% de commission', 'Visibilité Boostée', 'Illimité'] }
      ]
    };
    let available = list[profile.type] || list['owner'];
    if (profile.isExpired || (profile.subType && profile.subType !== 'Aucun' && profile.subType !== 'freemium')) {
      available = available.filter(p => p.id !== 'freemium');
    }
    return available;
  }, [profile]);

  const continueFlow = async (planToSubmit) => {
    const sel = planToSubmit || selected;
    if (!sel) return;

    if (sel.id === 'freemium' && profile.subType.toLowerCase() === 'freemium') {
      navigate(`/${profile.type}/dashboard`);
      return;
    }

    if (sel.id === 'monthly') {
      navigate(`/payment?plan=${sel.id}&type=${profile.type}&id=${profile.id}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('ndaku_auth_token');
      const endpoint = sel.id === 'freemium' ? 'activate-freemium' : 'activate-commission';
      await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/${profile.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      navigate(`/${profile.type}/dashboard?message=Félicitations !`);
    } catch (err) {
      setError("Erreur d'activation");
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: '#fbfcfd', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="lg">
        
        {/* PROFIL CARD */}
        <Paper elevation={0} sx={{ 
          p: isMobile ? 2 : 3, my: isMobile ? 3 : 4, borderRadius: 4, border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: 2, textAlign: isMobile ? 'center' : 'left'
        }}>
          <Avatar sx={{ width: 50, height: 50, bgcolor: '#0ea5a4' }}><PersonOutlineIcon /></Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" fontWeight={900}>{profile.name}</Typography>
            <Typography variant="caption" color="text.secondary">Propriétaire • {profile.id.slice(-6)}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
             <Typography variant="caption" fontWeight={800}>{profile.subType}</Typography>
             <Chip label={profile.isExpired ? "Expiré" : "Actif"} size="small" color={profile.isExpired ? "error" : "success"} sx={{ height: 20, fontSize: '0.6rem' }} />
          </Stack>
        </Paper>

        {profile.isExpired && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            <AlertTitle sx={{ fontWeight: 800 }}>Action requise</AlertTitle>
            Votre abonnement est fini. Veuillez choisir un plan payant pour continuer.
          </Alert>
        )}

        <Box textAlign="center" mb={isMobile ? 4 : 8}>
          <Typography variant={isMobile ? "h4" : "h2"} fontWeight={950} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            Boostez votre <span style={{ color: '#0ea5a4' }}>visibilité</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">Solutions adaptées à chaque étape de votre croissance.</Typography>
        </Box>

        {/* GRILLE RESPONSIVE : "stretch" aligne la hauteur, "spacing" crée l'espace mobile */}
        <Grid container spacing={isMobile ? 2 : 4} alignItems="stretch">
          {plans.map((p) => (
            <Grid item key={p.id} xs={12} sm={6} md={4}>
              <PlanCard 
                plan={p} 
                selected={selected} 
                onSelect={setSelected} 
                onAction={continueFlow} 
                featured={p.featured}
                submitting={submitting}
                isMobile={isMobile}
              />
            </Grid>
          ))}
        </Grid>

        {/* CTA FINAL FIXE OU CENTRE */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            disabled={!selected || submitting}
            onClick={() => continueFlow()}
            sx={{ 
              bgcolor: '#0f172a', width: isMobile ? '100%' : 'auto', px: 10, py: 2, borderRadius: 3, fontWeight: 800,
              fontSize: '1rem', '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirmer mon abonnement'}
          </Button>
          <Box mt={2}>
            <Button variant="text" size="small" onClick={() => navigate(-1)} color="inherit">Retourner en arrière</Button>
          </Box>
        </Box>

      </Container>
    </Box>
  );
}