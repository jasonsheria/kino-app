import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const ContactAgentForm = ({ onSubmit }) => (
  <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 400, mx: 'auto', p: 3, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
    <Typography variant="h6" color="primary" mb={2} align="center">
      Contacter l'agent
    </Typography>
    <TextField label="Votre nom" name="name" fullWidth margin="normal" required />
    <TextField label="Votre email" name="email" fullWidth margin="normal" required />
    <TextField label="Message" name="message" fullWidth margin="normal" required multiline rows={4} />
    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
      Envoyer
    </Button>
  </Box>
);

export default ContactAgentForm;
