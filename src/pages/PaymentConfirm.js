import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function PaymentConfirm() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');

    if (paymentStatus === 'success') {
      // Vérifier le statut du paiement avec notre backend
      verifyPayment(paymentId);
    } else {
      setStatus('error');
      setError('Le paiement a échoué. Veuillez réessayer.');
    }
  }, [location]);

  const verifyPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('ndaku_auth_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/payment/verify/${paymentId}`, {
        headers: {
          'Authorization': `Bearer \${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du paiement');
      }

      const data = await response.json();
      if (data.status === 'completed') {
        setStatus('success');
      } else {
        setStatus('error');
        setError('Le paiement n\'a pas pu être confirmé. Veuillez contacter le support.');
      }
    } catch (error) {
      setStatus('error');
      setError(error.message);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Stack spacing={3} alignItems="center">
            <CircularProgress />
            <Typography>
              Vérification du paiement en cours...
            </Typography>
          </Stack>
        );

      case 'success':
        return (
          <Stack spacing={3} alignItems="center">
            <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h5" gutterBottom>
              Paiement réussi !
            </Typography>
            <Typography color="text.secondary" textAlign="center">
              Votre compte a été activé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités premium.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/owner/dashboard')}
            >
              Aller au tableau de bord
            </Button>
          </Stack>
        );

      case 'error':
        return (
          <Stack spacing={3} alignItems="center">
            <ErrorIcon color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h5" gutterBottom>
              Une erreur est survenue
            </Typography>
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/owner/subscribe')}
            >
              Réessayer
            </Button>
          </Stack>
        );

      default:
        return null;
    }
  };

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
        {renderContent()}
      </Paper>
    </Container>
  );
}
