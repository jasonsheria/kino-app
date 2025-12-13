import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt, 
         FaHome, FaUserFriends, FaHandshake, FaComments, FaWhatsapp } from 'react-icons/fa';
import { useTheme } from '@mui/material/styles';
import { Box, Container, Grid, Stack, Typography, IconButton, Button, useMediaQuery, Link } from '@mui/material';


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
      text: "+243 81 234 5678",
      action: "Appelez maintenant",
      link: "tel:+24381234567"
    },
    { 
      icon: FaWhatsapp, 
      text: "Chat WhatsApp",
      action: "Discuter",
      link: "https://wa.me/24381234567"
    }
  ];

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        backgroundColor: isDark ? 'var(--ndaku-dark)' : '#07252a',
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
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Box>
                <Typography 
                  variant="h4"
                    sx={{ 
                    fontWeight: 800,
                    letterSpacing: 2,
                    mb: 1,
                   color: "#00a8a7"
                  }}
                >
                  NDAKU
                </Typography>
                <Typography 
                  variant="subtitle2"
                  sx={{
                    color: isDark ? 'var(--ndaku-primary)' : '#667eea',
                    letterSpacing: 3,
                    textTransform: 'uppercase'
                  }}
                >
                  IMMOBILIER
                </Typography>
              </Box>
              <Typography 
                variant="body2"
                sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  mb: 2
                }}
              >
                Votre partenaire de confiance dans la recherche de votre maison idéale à Kinshasa.
                Notre expertise immobilière vous guide vers des propriétés d'exception.
              </Typography>
              <Button 
                variant="contained"
                startIcon={<FaHome />}
                  sx={{
                  bgcolor: 'var(--ndaku-primary)',
                  color: 'white',
                  alignSelf: 'flex-start',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#667eea',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Découvrir nos propriétés
              </Button>
            </Stack>
          </Grid>

          {/* Liens rapides */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                mb: 3,
                color: isDark ? '#fff' : '#2d3436'
              }}
            >
              Navigation rapide
            </Typography>
            <Stack spacing={2}>
              {quickLinks.map((link, index) => (
                <Link 
                  key={index}
                  href={link.link}
                  underline="none"
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'text.secondary',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: 'var(--ndaku-primary)',
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

          {/* Contact */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                mb: 3,
                color: isDark ? '#fff' : '#2d3436'
              }}
            >
              Contactez-nous
            </Typography>
            <Stack spacing={3}>
              {contactInfo.map((info, index) => (
                <Stack 
                  key={index}
                  spacing={1}
                >
                  <Stack 
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isDark ? 'rgba(19,194,150,0.1)' : 'rgba(19,194,150,0.1)',
                      }}
                    >
                      <info.icon style={{ color: 'var(--ndaku-primary)', fontSize: '1.2rem' }} />
                    </Box>
                    <Typography 
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      {info.text}
                    </Typography>
                  </Stack>
                  <Link
                    href={info.link}
                    underline="none"
                    sx={{
                      color: 'var(--ndaku-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      ml: 7,
                      '&:hover': {
                        color: '#667eea',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {info.action} →
                  </Link>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Footer Bottom */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography 
              variant="body2" 
              sx={{ color: 'text.secondary' }}
            >
              © {new Date().getFullYear()} Ndaku Immobilier · Tous droits réservés
            </Typography>

            <Stack 
              direction="row" 
              spacing={1}
            >
              {[FaFacebook, FaTwitter, FaInstagram, FaWhatsapp].map((Icon, i) => (
                <IconButton 
                  key={i}
                  size={isMobile ? "small" : "medium"}
                      sx={{
                    color: 'text.secondary',
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
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
