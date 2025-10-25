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
  FormControl,
  TextField,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Grow
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingButton } from '@mui/lab';
import styled from '@emotion/styled';
import {
  CreditCard as CreditCardIcon,
  Phone as PhoneIcon,
  Security as SecurityIcon,
  CheckCircleOutline as CheckIcon,
  NavigateNext as ArrowForwardIcon,
  NavigateBefore as ArrowBackIcon
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
  <StyledCard
    elevation={0}
    component={motion.div}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    sx={{ bgcolor: 'grey.50', mb: 3 }}
  >
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
  </StyledCard>
);

// Animation variants pour Framer Motion
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Styled components avec Framer Motion
const StyledCard = styled(motion.div)`
  ${({ theme }) => `
    background-color: ${theme.palette.background.paper};
    border-radius: ${theme.shape.borderRadius}px;
    padding: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
  `}
`;

export default function Payment() {
  const [searchParams] = useSearchParams();

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    mobileNumber: '',
  });
  const navigate = useNavigate();
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

        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du paiement');
      }

      const paymentData = await response.json();

      // Redirection vers FreshPay
      navigate(`${paymentData.paymentUrl}`, { replace: true });
      // creer une redirection avec navigate en y ajoutant les parametre
      // window.location.href = `/login#${paymentData.paymentUrl}`;


    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue lors du paiement';
      setError(errorMessage);
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

  const steps = ['Détails de la commande', 'Méthode de paiement', 'Confirmation'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
      >
        <Stepper
          activeStep={activeStep}
          sx={{ mb: 6 }}
          alternativeLabel={!isSmall}
          orientation={isSmall ? 'vertical' : 'horizontal'}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                mb: 4
              }}
            >
              {steps[activeStep]}
            </Typography>

            {error && (
              <Grow in={Boolean(error)}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {typeof error === 'string' ? error : error.message || 'Une erreur est survenue'}
                </Alert>
              </Grow>
            )}

            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <StyledCard
                  component={motion.div}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  sx={{ mb: 4 }}
                >
                  <CardContent>
                    <PaymentSummary
                      plan={plan.charAt(0).toUpperCase() + plan.slice(1)}
                      amount={getPlanAmount()}
                      currency="USD"
                    />

                    {accountDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                          Détails du compte
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Email
                              </Typography>
                              <Typography variant="body1">
                                {accountDetails.email}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Type de compte
                              </Typography>
                              <Typography variant="body1">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </motion.div>
                    )}
                  </CardContent>
                </StyledCard>
              )}

              {activeStep === 1 && (
                <StyledCard
                  component={motion.div}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  sx={{ mb: 4 }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Choisissez votre méthode de paiement
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
                </StyledCard>
              )}

              {activeStep === 2 && paymentMethod && (
                <StyledCard
                  component={motion.div}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  sx={{ mb: 4 }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {['visa', 'mastercard'].includes(paymentMethod)
                        ? 'Informations de la carte'
                        : 'Informations Mobile Money'}
                    </Typography>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Stack spacing={3}>
                        {['visa', 'mastercard'].includes(paymentMethod) ? (
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
                      </Stack>
                    </motion.div>
                  </CardContent>
                </StyledCard>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Stack direction={isSmall ? 'column' : 'row'} spacing={2}>
                {activeStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={loading}
                    fullWidth={isSmall}
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour
                  </Button>
                )}

                {activeStep === 0 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    fullWidth={isSmall}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Continuer
                  </Button>
                )}

                {activeStep === 1 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!paymentMethod}
                    fullWidth={isSmall}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Continuer au paiement
                  </Button>
                )}

                {activeStep === 2 && (
                  <LoadingButton
                    variant="contained"
                    onClick={handlePayment}
                    loading={loading}
                    disabled={!paymentMethod}
                    fullWidth={isSmall}
                    loadingPosition="end"
                    endIcon={<SecurityIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    {loading ? 'Traitement en cours...' : 'Confirmer le paiement'}
                  </LoadingButton>
                )}
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Récapitulatif
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Étape actuelle
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {steps[activeStep]}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Montant à payer
                        </Typography>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          {getPlanAmount()} USD
                        </Typography>
                      </Box>

                      {paymentMethod && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Méthode de paiement
                          </Typography>
                          <Typography variant="body1">
                            {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'primary.light',
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SecurityIcon color="primary" />
                      <Typography variant="body2" color="primary.dark">
                        Paiement sécurisé via FreshPay
                      </Typography>
                    </Stack>
                  </Paper>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}
