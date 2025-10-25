import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { motion } from 'framer-motion';

const PaymentSimulation = () => {
  const { paymentId, accountId, plan } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simuler le processus de paiement
    const simulatePayment = async () => {
      try {
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simuler une réponse de paiement (succès 80% du temps)
        const isSuccess = Math.random() > 0.2;
        
        if (isSuccess) {
          setStatus('success');
          // Appeler le webhook de simulation
          const token = localStorage.getItem('ndaku_auth_token');
          await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/payment/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              payment_id: paymentId,
              status: 'completed',
              metadata: {
                // Ces données devraient venir des query params
                accountId: accountId? accountId: searchParams.get('accountId'),
                plan: plan? plan: searchParams.get('plan'),
              }
            })
          });
        } else {
          setStatus('error');
          setError('Transaction simulée échouée');
        }
      } catch (error) {
        setStatus('error');
        setError(error.message || 'Erreur lors de la simulation du paiement');
      }
    };

    simulatePayment();
  }, [paymentId]);

  const handleReturn = () => {
    if (status === 'success') {
      // Pass a welcome message to the landing page via navigation state
      navigate('/owner/dashboard', { state: { message: 'Bienvenue sur Ndaku — bienvenue en tant que propriétaire !' } });
    } else {
      navigate('/payment');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Stack spacing={3} alignItems="center">
            {status === 'processing' && (
              <>
                <CircularProgress size={60} />
                <Typography variant="h6">
                  Traitement du paiement en cours...
                </Typography>
                <Typography color="text.secondary">
                  Veuillez patienter pendant que nous traitons votre paiement
                </Typography>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircleIcon
                  sx={{ fontSize: 60, color: 'success.main' }}
                  component={motion.svg}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                />
                <Typography variant="h6">
                  Paiement réussi !
                </Typography>
                <Alert severity="success">
                  <AlertTitle>Transaction complétée</AlertTitle>
                  Votre paiement a été traité avec succès. Vous pouvez maintenant accéder à votre compte.
                </Alert>
              </>
            )}

            {status === 'error' && (
              <>
                <ErrorIcon
                  sx={{ fontSize: 60, color: 'error.main' }}
                  component={motion.svg}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                />
                <Typography variant="h6" color="error">
                  Échec du paiement
                </Typography>
                <Alert severity="error">
                  <AlertTitle>Erreur</AlertTitle>
                  {error || 'Une erreur est survenue lors du traitement du paiement'}
                </Alert>
              </>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleReturn}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {status === 'success' ? 'Aller au tableau de bord' : 'Retour au paiement'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default PaymentSimulation;
