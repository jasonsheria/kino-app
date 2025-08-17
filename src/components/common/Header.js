import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Header = ({ mode, toggleMode }) => (
  <AppBar position="static" color="primary" elevation={2}>
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Ndaku Immobilier
      </Typography>
      <Box>
        <IconButton color="inherit" onClick={toggleMode}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header;
