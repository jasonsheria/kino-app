import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box sx={{ bgcolor: 'background.paper', py: 2, textAlign: 'center', mt: 4, borderTop: '1px solid #eee' }}>
    <Typography variant="body2" color="text.secondary">
      © {new Date().getFullYear()} Ndaku Immobilier. Tous droits réservés.
    </Typography>
  </Box>
);

export default Footer;
