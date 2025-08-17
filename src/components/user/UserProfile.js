import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const UserProfile = ({ user }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
    <Avatar sx={{ width: 56, height: 56 }}>{user.name[0]}</Avatar>
    <Box>
      <Typography variant="h6">{user.name}</Typography>
      <Typography variant="body2" color="text.secondary">{user.email}</Typography>
      <Typography variant="body2" color="secondary.main">Abonnement: {user.subscription}</Typography>
    </Box>
  </Box>
);

export default UserProfile;
