import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOwnerProfile } from '../../hooks/useOwnerProfile';
import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaWhatsapp,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt
} from 'react-icons/fa';

export default function ProfileCard({ onClose }) {
  const theme = useTheme();
  const { ownerProfile, loading, error } = useOwnerProfile();

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  if (error || !ownerProfile) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Erreur de chargement du profil</Typography>
      </Box>
    );
  }

  const { user } = ownerProfile;

  const socialIcons = [
    { icon: FaLinkedin, link: user.social.linkedin, label: 'LinkedIn' },
    { icon: FaGithub, link: user.social.github, label: 'GitHub' },
    { icon: FaFacebook, link: user.social.facebook, label: 'Facebook' },
    { icon: FaWhatsapp, link: user.social.whatsapp, label: 'WhatsApp' },
    { icon: FaInstagram, link: user.social.instagram, label: 'Instagram' },
  ].filter(social => social.link);

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {/* En-tête du profil */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user.profileUrl}
            sx={{
              width: 64,
              height: 64,
              border: `2px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[2]
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {ownerProfile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.username}
            </Typography>
            {ownerProfile.certified && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5 
                }}
              >
                ✓ Certifié
              </Typography>
            )}
          </Box>
        </Box>

        {/* Note et abonnement */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">
            Note: {ownerProfile.rating}/5
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              textTransform: 'capitalize',
              color: theme.palette.primary.main 
            }}
          >
            {ownerProfile.subscription}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Informations de contact */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          Contact
        </Typography>
        <Stack spacing={1}>
          {ownerProfile.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaPhoneAlt size={14} />
              <Typography variant="body2">{ownerProfile.phone}</Typography>
            </Box>
          )}
          {ownerProfile.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaEnvelope size={14} />
              <Typography variant="body2">{ownerProfile.email}</Typography>
            </Box>
          )}
          {ownerProfile.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaMapMarkerAlt size={14} />
              <Typography variant="body2">{ownerProfile.address}</Typography>
            </Box>
          )}
          {user.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaGlobe size={14} />
              <Typography variant="body2">{user.website}</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Réseaux sociaux */}
      {socialIcons.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Réseaux sociaux
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialIcons.map(({ icon: Icon, link, label }) => (
                <Tooltip key={label} title={label}>
                  <IconButton
                    size="small"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <Icon size={16} />
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </>
      )}

     

      {/* Informations de l'entreprise */}
      {user.company.name && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Entreprise
            </Typography>
            <Typography variant="body2" gutterBottom>
              {user.company.name}
            </Typography>
           
          </Box>
        </>
      )}
    </Box>
  );
}
