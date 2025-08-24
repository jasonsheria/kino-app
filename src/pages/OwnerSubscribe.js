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
  const from = searchParams.get('from') || null;
  const [currentSub, setCurrentSub] = useState(null);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(()=>{
    try{ const raw = localStorage.getItem('owner_subscription'); if(raw) setCurrentSub(JSON.parse(raw)); }catch(e){}
  }, []);

  const plans = [
    { id: 'freemium', title: 'Freemium', price: 0, desc: 'Gratuit, fonctionnalités restreintes (max 2 biens).', bullets: ['Jusqu\'à 10 participants','Événements illimités','Organisateurs illimités'] },
    { id: 'monthly', title: 'Premium', price: 9.99, desc: 'Accès complet à toutes les fonctionnalités.', bullets: ['Tout dans Gratuit','Jusqu\'à 200 participants','Export des données'] , featured:true},
    { id: 'revshare', title: 'Rétro-commission', price: 0, desc: 'Paiement par commission sur ventes, achat via agent.', bullets: ['SSO (SAML 2.0)','Support personnalisé'] }
  ];

  const choose = (p)=> setSelected(p);

  const continueFlow = (planOverride) =>{
    const sel = planOverride || selected;
    if(!sel) return alert('Veuillez choisir une formule');

    if(from === 'dashboard'){
      if(sel.id === 'monthly'){
        navigate('/owner/pay?plan=monthly&from=dashboard');
        return;
      }
      const entry = { type: sel.id, title: sel.title, chosenAt: Date.now(), paid: false, validUntil: null };
      try{ localStorage.setItem('owner_subscription', JSON.stringify(entry)); }catch(e){}
      navigate('/owner/dashboard');
      return;
    }

    const entry = { type: sel.id, title: sel.title, chosenAt: Date.now(), validUntil: sel.id === 'monthly' ? null : null };
    localStorage.setItem('owner_subscription', JSON.stringify(entry));
    if(sel.id === 'monthly'){
      navigate('/owner/pay?plan=monthly');
    }else{
      try{ localStorage.setItem('owner_resume_submission', 'true'); }catch(e){}
      navigate('/owner/request');
    }
  };

  return (
    <Container maxWidth="lg" sx={{py:6}}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" sx={{fontWeight:900}}>Choisissez une formule</Typography>
        <Typography color="text.secondary">Sélectionnez le plan qui correspond le mieux à vos besoins. Vous pouvez le modifier à tout moment.</Typography>
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
