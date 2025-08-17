import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const UserAuthForm = ({ isLogin, onSubmit }) => (
  <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 350, mx: 'auto', p: 3, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
    <Typography variant="h5" color="primary" mb={2} align="center">
      {isLogin ? 'Connexion' : 'Inscription'}
    </Typography>
    <TextField label="Email" name="email" fullWidth margin="normal" required />
    <TextField label="Mot de passe" name="password" type="password" fullWidth margin="normal" required />
    {!isLogin && <TextField label="Nom" name="name" fullWidth margin="normal" required />}
    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
      {isLogin ? 'Se connecter' : "S'inscrire"}
    </Button>
  </Box>
);

export default UserAuthForm;
