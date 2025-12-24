import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt, 
         FaHome, FaUserFriends, FaHandshake, FaComments, FaWhatsapp, FaApple, FaGoogle, FaDownload } from 'react-icons/fa';
import img6 from '../../assets/images/quelle-agence-immobiliere-choisir-pour-vendre-1.jpg'
import { useTheme } from '@mui/material/styles';
import { Box, Container, Grid, Stack, Typography, IconButton, Button, useMediaQuery, Link, TextField } from '@mui/material';
import { articles } from '../../data/fakedata';
import { color } from 'framer-motion';
import { ReactComponent as Logo } from '../../assets/images/logo.svg';


const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const quickLinks = [
    { icon: FaHome, text: "Propriétés à vendre", link: "/properties?type=sale" },
    { icon: FaHandshake, text: "Location", link: "/properties?type=rent" },
    { icon: FaUserFriends, text: "Nos Agents", link: "/agents" },
    { icon: FaComments, text: "Contactez-nous", link: "/contact" }
  ];

  const contactInfo = [
    { 
      icon: FaMapMarkerAlt, 
      text: "Avenue de la Paix, Gombe, Kinshasa",
      action: "Voir sur la carte",
      link: "https://maps.google.com"
    },
    { 
      icon: FaPhone, 
      text: "+243 97 91 37 151",
      action: "Appelez maintenant",
      link: "+24397 91 37 151"
    },
    { 
      icon: FaWhatsapp, 
      text: "Chat WhatsApp",
      action: "Discuter",
      link: "https://wa.me/979137151"
    }
  ];

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: "1px solid #8080804a",
        background: "#ffe4c459",
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
     
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Grid container spacing={4}>
          {/* Logo et description */}
          <Grid item xs={12} md={3}>
            <Stack spacing={3} style={{ borderBottom:'1px solid gray', paddingBottom:10 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20 }}>
                  <Logo alt="Ndaku Logo" style={{ width: 40, height: 75 }}/>
                </Box>
                <Box>
                  <Typography 
                    variant="h4"
                      sx={{ 
                      fontWeight: 900,
                      letterSpacing: 2,
                      fontFamily : 'ui-monospace, fantasy, sans-serif',
                     color: "#2d3436"
                    }}
                  >
                    NDAKU
                  </Typography>
                  <Typography 
                    variant="subtitle2"
                    sx={{
                      color: isDark ? 'var(--ndaku-primary)' : 'black',
                      letterSpacing: 3,
                      textTransform: 'uppercase'
                    }}
                  >
                    IMMOBILIER
                  </Typography>
                </Box>
              </Box>
              <Typography 
                variant="body2"
                sx={{ 
                  color: 'black',
                  lineHeight: 1.8,
                  mb: 2
                }}
              >
                Votre partenaire de confiance dans la recherche de votre maison idéale à Kinshasa.
                Notre expertise immobilière vous guide vers des propriétés d'exception.
              </Typography>
              <Button 
                variant="contained"
                startIcon={<FaHome color='white'/>}
                  sx={{
                  bgcolor: 'var(--ndaku-primary)',
                  color: 'white',
                  alignSelf: 'flex-start',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#0daebe',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Découvrir nos propriétés
              </Button>
            </Stack>
          </Grid>
{/* Téléchargement et contact */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: isDark ? 'black' : 'black'
              }}
            >
              Téléchargez l'application
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'black' }}>Obtenez l'app pour rechercher et réserver plus rapidement.</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button variant="outlined" startIcon={<FaGoogle color='white'/>} href="https://play.google.com" target="_blank" sx={{ textTransform: 'none', borderRadius: 0, backgroundColor: 'black', padding: '12px 20px'  }}>
                  Google Play
                </Button>
                <Button variant="outlined" startIcon={<FaApple color='white'/>} href="https://www.apple.com/app-store/" target="_blank" sx={{ textTransform: 'none', borderRadius: 0, backgroundColor: 'black', padding: '12px 20px'  }}>
                  App Store
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Newsletter</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }} component="form" onSubmit={(e) => { e.preventDefault(); /* TODO: wire up subscription */ }}>
                  <TextField size="small" placeholder="Votre e-mail" sx={{ bgcolor: 'white', borderRadius: 1 }} />
                  <Button type="submit" variant="contained" startIcon={<FaDownload color='white'/>} sx={{ textTransform: 'none', padding: '13px 16px' }}>S'abonner</Button>
                </Stack>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Contact</Typography>
                {contactInfo.map((info, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                    <Box sx={{ width: 34, height: 34, display:'flex',alignItems:'center',justifyContent:'center', bgcolor: 'rgba(0,0,0,0.03)', borderRadius:1 }}>
                      <info.icon style={{ color: '#000000ab' }} />
                    </Box>
                    <Link href={info.link} underline="none" sx={{ color: 'black' }}>{info.text}</Link>
                  </Box>
                ))}
              </Box>

            </Stack>
          </Grid>
          {/* Liens rapides */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: isDark ? 'black' : 'black'
              }}
            >
              Navigation
            </Typography>
            <Stack spacing={1.1}>
              {quickLinks.map((link, index) => (
                <Link 
                  key={index}
                  href={link.link}
                  underline="none"
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'black',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: '#000000ab',
                      transform: 'translateX(8px)'
                    }
                  }}
                >
                  <link.icon style={{ marginRight: '12px', fontSize: '1.1rem' }} />
                  {link.text}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Articles récents */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: isDark ? 'black' : 'black'
              }}
            >  
              Articles récents
            </Typography>
            <Stack spacing={2}>
              {(articles && articles.length ? articles.slice(0,3) : [{}, {}, {}]).map((a, i) => (
                <Link key={a.id || i} href={a.slug ? `/posts/${a.slug}` : `/posts/sample-${i+1}`} underline="none" sx={{ display: 'flex', gap: '35px', alignItems: 'center' }}>
                  <Box component="img" src={a.image || img6} sx={{ width: '90px',height: 52, objectFit: 'cover',  boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
                  <Box> 
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.title || `Titre d'article ${i+1}`}</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--ndaku-text)' }}>{a.excerpt || 'Extrait rapide de l\'article pour attirer l\'attention.'}</Typography>
                  </Box>
                </Link>
              ))}
            </Stack>
          </Grid>

          
        </Grid>

        {/* Footer Bottom */}
        <Box
          sx={{
            mt: 6,
            pt: 4,
            pb: 2,
            borderTop: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ color: 'black' }}
              >
                © {new Date().getFullYear()} Ndaku Immobilier · Tous droits réservés
              </Typography>
              <Link href="/terms" underline="none" sx={{ color: 'var(--ndaku-text)', ml: 2 }}>Conditions</Link>
              <Link href="/privacy" underline="none" sx={{ color: 'var(--ndaku-text)', ml: 2 }}>Confidentialité</Link>
            </Box>

            <Stack 
              direction="row" 
              spacing={1}
              alignItems="center"
            >
              {[FaFacebook, FaTwitter, FaInstagram, FaWhatsapp].map((Icon, i) => (
                <IconButton 
                  key={i}
                  size={isMobile ? "small" : "medium"}
                      sx={{
                    color: 'black',
                    transition: 'all 0.3s',
                    '&:hover': {
                      color: 'var(--ndaku-primary)',
                      transform: 'translateY(-3px)',
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(19,194,150,0.1)'
                    }
                  }}
                >
                  <Icon />
                </IconButton>
              ))}
              <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                <img src={img6} alt="app-sample" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                <Typography variant="caption" sx={{ color: 'var(--ndaku-text)' }}>Télécharger l'app</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
