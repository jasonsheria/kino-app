import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/owner.css';
import { Container, Grid, Card, CardContent, CardActions, Typography, Button, Stack, Box, Chip, Avatar, useTheme, useMediaQuery } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

function PlanCard({ plan, selected, onSelect, onAction, featured, isSmall }){
  return (
    <Card
      onClick={() => onSelect(plan)}
      elevation={featured ? 8 : 2}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        position: 'relative',
        minWidth: 240,
        flex: '1 1 320px',
        maxWidth: featured ? 420 : 360,
        border: selected && selected.id === plan.id ? '2px solid rgba(14,165,164,0.12)' : '1px solid rgba(15,23,42,0.04)',
        '&:hover': { transform: 'translateY(-6px)', transition: 'transform .18s ease' }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography variant="overline" sx={{fontWeight:800, color:'primary.main'}}>{plan.title}</Typography>
            <Typography variant="h5" sx={{fontWeight:900}}>{plan.price ? `${plan.price}€` : (plan.id === 'revshare' ? 'RevShare' : 'Gratuit')}</Typography>
            <Typography variant="caption" display="block" color="text.secondary">{plan.desc}</Typography>
          </Box>
          {featured && <Avatar sx={{bgcolor:'primary.main'}}><StarIcon /></Avatar>}
        </Stack>

        <Box component="ul" sx={{pl:2, mt:2}}>
          {plan.bullets && plan.bullets.map((b,i)=> <li key={i} style={{marginBottom:6}}>{b}</li>)}
        </Box>
      </CardContent>
      <CardActions sx={{padding:2}}>
        <Button
          variant={featured ? 'contained' : 'outlined'}
          onClick={(e)=>{ e.stopPropagation(); onAction(plan); }}
          fullWidth={isSmall}
        >
          {featured ? 'Commencer Premium' : (plan.id === 'freemium' ? 'Commencer' : 'Contactez-nous')}
        </Button>
      </CardActions>
    </Card>
  );
}

export default function OwnerSubscribe(){
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('id');
  const accountType = searchParams.get('type');
  const [currentSub, setCurrentSub] = useState(null);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  // Vérifier si les paramètres requis sont présents
  useEffect(() => {
    if (!accountId || !accountType) {
      navigate('/');
      return;
    }
    if (!['owner', 'agency', 'independent'].includes(accountType)) {
      navigate('/');
      return;
    }
  }, [accountId, accountType, navigate]);

  useEffect(()=>{
    try{ const raw = localStorage.getItem('owner_subscription'); if(raw) setCurrentSub(JSON.parse(raw)); }catch(e){}
  }, []);

  // Plans en fonction du type de compte
  const getPlansByAccountType = () => {
    const basePlans = {
      owner: [
        { 
          id: 'freemium', 
          title: 'Freemium', 
          price: 0, 
          desc: 'Gratuit, fonctionnalités restreintes (max 2 biens).', 
          bullets: ['Maximum 2 biens', 'Visibilité limitée', 'Support basique'] 
        },
        { 
          id: 'monthly', 
          title: 'Premium', 
          price: 19.99, 
          desc: 'Accès complet à toutes les fonctionnalités.', 
          bullets: ['Biens illimités', 'Visibilité maximale', 'Support prioritaire'], 
          featured: true 
        },
        {
          id: 'commission',
          title: 'Commission',
          price: 0,
          desc: 'Paiement par commission sur chaque transaction réussie.',
          bullets: [
            'Biens illimités',
            'Commission de 5% sur les transactions',
            'Support prioritaire',
            'Visibilité premium',
            'Statistiques avancées'
          ]
        }
      ],
      agency: [
        { 
          id: 'freemium', 
          title: 'Freemium', 
          price: 0, 
          desc: 'Gratuit, fonctionnalités restreintes (max 5 biens).', 
          bullets: ['Maximum 5 biens', 'Visibilité standard', 'Support basique'] 
        },
        { 
          id: 'monthly', 
          title: 'Premium', 
          price: 49.99, 
          desc: 'Accès complet pour agences.', 
          bullets: ['Biens illimités', 'Visibilité premium', 'Support dédié'], 
          featured: true 
        },
        {
          id: 'commission',
          title: 'Commission',
          price: 0,
          desc: 'Paiement par commission sur chaque transaction réussie.',
          bullets: [
            'Biens illimités',
            'Commission de 3% sur les transactions',
            'Support VIP',
            'Visibilité premium+',
            'Dashboard agence avancé'
          ]
        }
      ],
      independent: [
        { 
          id: 'freemium', 
          title: 'Freemium', 
          price: 0, 
          desc: 'Gratuit, fonctionnalités de base.', 
          bullets: ['Maximum 1 bien', 'Visibilité basique', 'Support communauté'] 
        },
        { 
          id: 'monthly', 
          title: 'Premium', 
          price: 9.99, 
          desc: 'Accès premium pour indépendants.', 
          bullets: ['Maximum 3 biens', 'Visibilité améliorée', 'Support standard'], 
          featured: true 
        },
        {
          id: 'commission',
          title: 'Commission',
          price: 0,
          desc: 'Paiement par commission sur chaque transaction réussie.',
          bullets: [
            'Maximum 5 biens',
            'Commission de 7% sur les transactions',
            'Support standard',
            'Visibilité améliorée',
            'Statistiques de base'
          ]
        }
      ]
    };
    return basePlans[accountType] || [];
  };

  const plans = getPlansByAccountType();

  const choose = (p)=> setSelected(p);

  const continueFlow = async (planOverride) => {
    const sel = planOverride || selected;
    if(!sel) return alert('Veuillez choisir une formule');

    // Sauvegarder l'abonnement
    const entry = { 
      type: sel.id, 
      title: sel.title, 
      chosenAt: Date.now(),
      accountType,
      accountId,
      paid: sel.id === 'monthly',
      validUntil: sel.id === 'monthly' ? null : null 
    };
    try { 
      localStorage.setItem(`${accountType}_subscription`, JSON.stringify(entry));
    } catch(e) {
      console.error('Erreur lors de la sauvegarde de l\'abonnement:', e);
    }

    // Redirection en fonction du type de compte et du plan
    if(sel.id === 'freemium' || sel.id === 'commission') {
      try {
        // Activer le compte selon le type d'abonnement
        const token = localStorage.getItem('ndaku_auth_token');
        const endpoint = sel.id === 'freemium' ? 'activate-freemium' : 'activate-commission';
        const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/${accountId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de l\'activation du compte');
        }

        const successMessage = `Votre compte ${accountType} a été activé avec l'abonnement ${sel.title}`;
        
        switch(accountType) {
          case 'owner':
            navigate(`/owner/dashboard?message=${encodeURIComponent(successMessage)}`);
            break;
          case 'agency':
            navigate(`/agency/dashboard?message=${encodeURIComponent(successMessage)}`);
            break;
          case 'independent':
            navigate(`/?message=${encodeURIComponent(successMessage)}`);
            break;
          default:
            navigate('/');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur lors de l\'activation du compte. Veuillez réessayer.');
      }
    } else if(sel.id === 'monthly') {
      // Pour l'abonnement monthly, rediriger vers le paiement
      navigate(`/payment?plan=${sel.id}&type=${accountType}&id=${accountId}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{py:6}}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" sx={{fontWeight:900}}>Choisissez une formule</Typography>
        <Typography color="text.secondary">Sélectionnez le plan qui correspond le mieux à vos besoins. Vous pouvez le modifier à tout moment.</Typography>
        {error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', color: 'error.dark', borderRadius: 1 }}>
            <Typography>{error}</Typography>
          </Box>
        )}
      </Box>

      {currentSub && (
        <Box sx={{maxWidth:980, mx:'auto', mb:3}}>
          <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', p:2, bgcolor:'background.paper', borderRadius:2, boxShadow:1}}>
            <Box>
              <Typography variant="caption" color="text.secondary">Votre abonnement actuel</Typography>
              <Typography variant="h6" sx={{fontWeight:800}}>{currentSub.title || currentSub.type}</Typography>
              <Typography variant="body2" color="text.secondary">{currentSub.paid ? `Valide jusqu'au ${new Date(currentSub.validUntil).toLocaleDateString()}` : (currentSub.validUntil ? `Valide jusqu'au ${new Date(currentSub.validUntil).toLocaleDateString()}` : 'Aucune date de validité')}</Typography>
            </Box>
            <Chip label={currentSub.type} color="success" variant="outlined" />
          </Box>
        </Box>
      )}

      <Grid container spacing={2} justifyContent="center" sx={{alignItems:'stretch'}}>
        {plans.map((p)=> (
          <Grid item key={p.id} xs={12} sm={6} md={4} sx={{display:'flex'}}>
            <PlanCard plan={p} selected={selected} onSelect={choose} onAction={continueFlow} featured={p.featured} isSmall={isSmall} />
          </Grid>
        ))}
      </Grid>

      <Stack direction={isSmall ? 'column' : 'row'} spacing={2} justifyContent="space-between" sx={{maxWidth:980, mx:'auto', mt:4}}>
        <Button variant="outlined" onClick={() => navigate(-1)} fullWidth={isSmall}>Retour</Button>
        <Button variant="contained" color="primary" onClick={()=>continueFlow()} fullWidth={isSmall}>Confirmer</Button>
      </Stack>
    </Container>
  );
}
