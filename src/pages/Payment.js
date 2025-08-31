import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Phone as PhoneIcon,
  Security as SecurityIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';

// MUI Icons for payment methods
import PaymentsIcon from '@mui/icons-material/Payments';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

const PaymentMethodCard = ({ method, selected, onSelect, type, disabled }) => {
  const theme = useTheme();
  
  const getIcon = () => {
    switch (type) {
      case 'card':
        return <CreditCardIcon sx={{ fontSize: 40, color: selected ? theme.palette.primary.main : 'text.secondary' }} />;
      case 'mobile':
        return <PhoneAndroidIcon sx={{ fontSize: 40, color: selected ? theme.palette.primary.main : 'text.secondary' }} />;
      default:
        return <PaymentsIcon sx={{ fontSize: 40, color: selected ? theme.palette.primary.main : 'text.secondary' }} />;
    }
  };
  
  return (
    <Paper
      elevation={selected ? 3 : 1}
      sx={{
        p: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
        opacity: disabled ? 0.5 : 1,
        bgcolor: selected ? 'primary.50' : 'background.paper',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-2px)',
          boxShadow: disabled ? 1 : 3,
          bgcolor: 'primary.50'
        }
      }}
      onClick={() => !disabled && onSelect(method)}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Radio checked={selected} disabled={disabled} />
        {getIcon()}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {method}
          </Typography>
          {type === 'mobile' && (
            <Typography variant="caption" color="text.secondary">
              Paiement mobile instantané
            </Typography>
          )}
          {type === 'card' && (
            <Typography variant="caption" color="text.secondary">
              Paiement sécurisé par carte
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

const PaymentSummary = ({ plan, amount, currency }) => (
  <Card elevation={0} sx={{ bgcolor: 'grey.50', mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Résumé de la commande
      </Typography>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between">
          <Typography>Plan</Typography>
          <Typography fontWeight="bold">{plan}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography>Montant</Typography>
          <Typography fontWeight="bold">{amount} {currency}</Typography>
        </Box>
        <Divider />
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Total à payer</Typography>
          <Typography fontWeight="bold" color="primary">
            {amount} {currency}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    mobileNumber: '',
  });

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const plan = searchParams.get('plan');
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const token = localStorage.getItem('ndaku_auth_token');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Erreur lors de la récupération des détails du compte');
        
        const data = await response.json();
        setAccountDetails(data);
      } catch (error) {
        setError('Impossible de charger les détails du compte');
        console.error('Error:', error);
      }
    };

    if (id) fetchAccountDetails();
  }, [id]);

  const getPlanAmount = () => {
    switch (type) {
      case 'owner':
        return plan === 'monthly' ? 19.99 : 0;
      case 'agency':
        return plan === 'monthly' ? 49.99 : 0;
      case 'independent':
        return plan === 'monthly' ? 9.99 : 0;
      default:
        return 0;
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement');
      return;
    }

    // Validation du formulaire
    if (['visa', 'mastercard'].includes(paymentMethod)) {
      if (!formData.cardHolderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        setError('Veuillez remplir tous les champs de la carte');
        return;
      }
      if (formData.cardNumber.length !== 16) {
        setError('Le numéro de carte doit contenir 16 chiffres');
        return;
      }
      if (formData.cvv.length !== 3) {
        setError('Le code CVV doit contenir 3 chiffres');
        return;
      }
      const [month, year] = formData.expiryDate.split('/');
      if (!month || !year || month > 12 || month < 1) {
        setError('Date d\'expiration invalide');
        return;
      }
    } else {
      if (!formData.mobileNumber || formData.mobileNumber.length !== 9) {
        setError('Veuillez entrer un numéro de téléphone valide');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('ndaku_auth_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: id,
          accountType: type,
          plan,
          amount: getPlanAmount(),
          currency: 'USD',
          paymentMethod,
          paymentDetails: {
            ...(paymentMethod === 'visa' || paymentMethod === 'mastercard' 
              ? {
                  cardHolderName: formData.cardHolderName,
                  cardNumber: formData.cardNumber,
                  expiryDate: formData.expiryDate,
                  cvv: formData.cvv,
                }
              : {
                  mobileNumber: '+243' + formData.mobileNumber,
                }
            )
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du paiement');
      }

      const paymentData = await response.json();
      
      // Redirection vers FreshPay
      window.location.href = paymentData.paymentUrl;

    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors du paiement');
      console.error('Payment Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!plan || !type || !id) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          Informations de paiement manquantes. Veuillez réessayer.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Paiement
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Méthodes de paiement
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Stack spacing={2}>
                    <PaymentMethodCard
                      method="Mobile Money - Airtel"
                      type="mobile"
                      selected={paymentMethod === 'airtel'}
                      onSelect={() => setPaymentMethod('airtel')}
                    />
                    <PaymentMethodCard
                      method="Mobile Money - Orange"
                      type="mobile"
                      selected={paymentMethod === 'orange'}
                      onSelect={() => setPaymentMethod('orange')}
                    />
                    <PaymentMethodCard
                      method="Mobile Money - Vodacom"
                      type="mobile"
                      selected={paymentMethod === 'vodacom'}
                      onSelect={() => setPaymentMethod('vodacom')}
                    />
                    <PaymentMethodCard
                      method="Carte Visa"
                      type="card"
                      selected={paymentMethod === 'visa'}
                      onSelect={() => setPaymentMethod('visa')}
                    />
                    <PaymentMethodCard
                      method="Carte Mastercard"
                      type="card"
                      selected={paymentMethod === 'mastercard'}
                      onSelect={() => setPaymentMethod('mastercard')}
                    />
                  </Stack>
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          {paymentMethod && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {['visa', 'mastercard'].includes(paymentMethod) 
                    ? 'Informations de la carte'
                    : 'Informations Mobile Money'}
                </Typography>

                <Stack spacing={3}>
                  {['visa', 'mastercard'].includes(paymentMethod) ? (
                    // Formulaire de carte bancaire
                    <>
                      <TextField
                        label="Nom sur la carte"
                        fullWidth
                        value={formData.cardHolderName || ''}
                        onChange={(e) => handleFormChange('cardHolderName', e.target.value)}
                      />
                      <TextField
                        label="Numéro de carte"
                        fullWidth
                        inputProps={{ maxLength: 16 }}
                        value={formData.cardNumber || ''}
                        onChange={(e) => handleFormChange('cardNumber', e.target.value.replace(/\D/g, ''))}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Date d'expiration (MM/YY)"
                            fullWidth
                            inputProps={{ maxLength: 5 }}
                            value={formData.expiryDate || ''}
                            onChange={(e) => {
                              const input = e.target.value;
                              let formatted = input.replace(/\D/g, '');
                              if (formatted.length >= 2) {
                                formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                              }
                              handleFormChange('expiryDate', formatted);
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="CVV"
                            fullWidth
                            type="password"
                            inputProps={{ maxLength: 3 }}
                            value={formData.cvv || ''}
                            onChange={(e) => handleFormChange('cvv', e.target.value.replace(/\D/g, ''))}
                          />
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    // Formulaire Mobile Money
                    <>
                      <TextField
                        label="Numéro de téléphone"
                        fullWidth
                        value={formData.mobileNumber || ''}
                        onChange={(e) => handleFormChange('mobileNumber', e.target.value.replace(/\D/g, ''))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">+243</InputAdornment>,
                        }}
                      />
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Instructions</AlertTitle>
                        1. Vérifiez que votre numéro est correct<br />
                        2. Vous recevrez une notification sur votre téléphone<br />
                        3. Suivez les instructions pour confirmer le paiement<br />
                        4. Entrez votre code PIN quand demandé
                      </Alert>
                    </>
                  )}

                  {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Stack direction={isSmall ? 'column' : 'row'} spacing={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
              fullWidth={isSmall}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={handlePayment}
              disabled={!paymentMethod || loading}
              fullWidth={isSmall}
              startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
            >
              {loading ? 'Traitement...' : 'Payer maintenant'}
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Détails de l'abonnement
              </Typography>
              
              {accountDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Compte
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {accountDetails.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type de compte
                  </Typography>
                  <Typography variant="body1">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                </Box>
              )}

              <PaymentSummary
                plan={plan.charAt(0).toUpperCase() + plan.slice(1)}
                amount={getPlanAmount()}
                currency="USD"
              />

              <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, mt: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SecurityIcon color="primary" />
                  <Typography variant="body2" color="primary.dark">
                    Paiement sécurisé via FreshPay
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
