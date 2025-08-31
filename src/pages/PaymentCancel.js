import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <CancelIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h5" gutterBottom>
            Paiement annulé
          </Typography>
          <Typography color="text.secondary">
            Vous avez annulé le processus de paiement. Vous pouvez réessayer ou choisir un autre plan.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/owner/subscribe')}
            >
              Choisir un autre plan
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
