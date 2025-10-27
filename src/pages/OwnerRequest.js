import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/owner.css';
import FileUploadPreview from '../components/common/FileUploadPreview';
import ConfirmModal from '../components/common/ConfirmModal';
import InfoModal from '../components/common/InfoModal';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  IconButton,
  Button,
  useMediaQuery,
  Link,
  Paper,
  TextField,
  Chip,
  CircularProgress,
} from '@mui/material';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const FilePreview = ({ file, onDelete }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        mt: 1,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#f8f9fa'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InsertDriveFileIcon color="primary" />
        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </Typography>
        <Chip
          label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
          size="small"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Box>
      <IconButton size="small" onClick={onDelete} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default function OwnerRequest() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ nom: '', postnom: '', prenom: '', email: '', phone: '', address: '' });
  const [idFile, setIdFile] = useState(null);
  const [propTitleFiles, setPropTitleFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [completion, setCompletion] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fields = ['nom', 'prenom', 'email', 'phone', 'address'];
    let filled = 0;
    fields.forEach(k => { if (form[k] && String(form[k]).trim().length > 0) filled++; });
    if (types.length) filled += 1;
    if (idFile) filled += 1;
    if (propTitleFiles.length) filled += 1;
    const total = fields.length + 3;
    const pct = Math.round((filled / total) * 100);
    setCompletion(pct);
    try { localStorage.setItem('owner_profile_completion', JSON.stringify({ pct, updated: Date.now() })); } catch (e) { }
  }, [form, types, idFile, propTitleFiles]);

  useEffect(() => {
    // Réinitialiser le formulaire au chargement
    setTypes([]);
    setForm({ nom: '', postnom: '', prenom: '', phone: '', address: '' });
    setIdFile(null);
    setPropTitleFiles([]);
    setValidationError('');
  }, []);

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const submitApplication = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Validation de base
   

   
    // Validation téléphone
    if (!form.phone || form.phone.length < 8) {
      setValidationError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    // Validation types de biens
    if (types.length === 0) {
      setValidationError('Veuillez sélectionner au moins un type de bien');
      return;
    }

    // Validation documents
    if (!idFile) {
      setValidationError('Veuillez fournir une pièce d\'identité');
      return;
    }

    

    setValidationError('');
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    // Éviter la double soumission
    if (sessionStorage.getItem('owner_submission_lock') === '1') {
      return;
    }
    sessionStorage.setItem('owner_submission_lock', '1');
    setConfirmOpen(false);
  setIsSubmitting(true);

    try {
     
      // Créer le FormData avec tous les fichiers et données
      const formData = new FormData();

      // Ajouter les métadonnées
      const metaData = {
        types,
        form,
        propTitleFiles: propTitleFiles?.map(file => file.name),
        subscriptionEndDate : new Date(Date.now() + 7*24*60*60*1000) //7 jours d'essai gratuit
      };
      formData.append('meta', JSON.stringify(metaData));

      // Ajouter la pièce d'identité
      formData.append('idFile', idFile);

      // Ajouter les titres de propriété
      propTitleFiles.forEach(file => {
        formData.append('propertyTitle', file);
      });
      //ajouter le token du user au form pour la protection des données
      const token = localStorage.getItem('ndaku_auth_token');
      if (token) {
        formData.append('userToken', token);
      }

      
      // Envoyer la requête à l'API avec le token dans les headers
      const response = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText);
      }

      // Convertir le texte en JSON si c'est un JSON valide
      const result = responseText ? JSON.parse(responseText) : {};

      // Afficher le succès
      setInfoTitle('Demande envoyée avec succès');
      setInfoMessage(`Votre demande a été enregistrée. Vous serez redirigé vers la page de choix d'abonnement.`);
      setInfoOpen(true);

      // Redirection après 2 secondes
     
        // navigate('login#/owner/subscribe'+`?ownerId=${result.ownerId || ''}`+`type=owner`);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setValidationError('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
    } finally {
      sessionStorage.removeItem('owner_submission_lock');
      setIsSubmitting(false);
    }
  };

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{
          fontSize: { xs: '1.5rem', md: '2rem' },
          fontWeight: 600
        }}>
          Demande de partenariat propriétaire
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{
          maxWidth: '600px',
          mx: 'auto',
          px: { xs: 2, md: 0 }
        }}>
          Complétez les informations et choisissez un abonnement pour finaliser votre inscription.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
        {/* Left info cards column */}
        <Grid item xs={12} md={4} lg={3} order={{ xs: 2, md: 1 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            {/* Benefits card */}
            <Paper elevation={0} sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pourquoi devenir partenaire
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Avantages
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {[
                  'Publication illimitée après activation',
                  'Gestion des demandes et réservations',
                  'Support prioritaire',
                  'Tableau de bord détaillé',
                  'Statistiques avancées'
                ].map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body2">{benefit}</Typography>
                  </Box>
                ))}
              </Stack>
             
            </Paper>
            {/* Status card */}
            <Paper elevation={0} sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                État de la demande
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Suivi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Après soumission, vous recevrez un code pour accéder à votre tableau de bord.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/owner/onboard"
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: '#10a37f',
                    bgcolor: 'primary.100',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Voir l'état
              </Button>
            </Paper>
          </Stack>
        </Grid>

        {/* Center - main form card */}
        <Grid item xs={12} md={8} lg={9} order={{ xs: 1, md: 2 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            {/* Progress bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Taux de complétion du profil
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {completion}%
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: '#eef9f6', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${completion}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--ndaku-primary), #10a37f)'
                  }}
                />
              </Box>
              {completion < 70 && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: 'warning.light',
                    color: 'warning.dark',
                    borderRadius: 1
                  }}
                >
                  Votre profil est à {completion}%. Veuillez compléter vos informations.
                </Typography>
              )}
            </Box>

            {/* Contact Information Form */}
            <Typography variant="h6" gutterBottom>
              Information de contact
            </Typography>

            {/* Step 1: Property Types */}
            {step === 1 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Quel(s) type(s) de bien possédez-vous ?
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {['Voiture', 'Terrain', 'Appartement', 'Salle de fête','Magazin', 'Studio'].map(t => (
                    <Button
                      key={t}
                      variant={types.includes(t) ? "contained" : "outlined"}
                      onClick={() => toggleType(t)}
                      sx={{
                        mb: 1,
                        margin : '10px',
                        bgcolor: types.includes(t) ? 'var(--ndaku-primary)' : 'transparent',
                        color: types.includes(t) ? 'white' : 'text.primary',
                        '&:hover': {
                          bgcolor: types.includes(t) ? 'var(--ndaku-primary-dark)' : 'var(--ndaku-primary-11)'
                        }
                      }}
                    >
                      {t}
                    </Button>
                  ))}
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={() => types.length ? setStep(2) : setValidationError('Sélectionnez au moins un type de bien')}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#10a37f',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                  >
                    Suivant
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => { setTypes([]); setValidationError(''); }}
                    sx={{
                      borderColor: 'grey.300',
                      color: 'text.primary',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: 'grey.400',
                        bgcolor: 'grey.50'
                      }
                    }}
                  >
                    Réinitialiser
                  </Button>
                </Stack>
                {validationError && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: 'error.light',
                      color: 'error.dark',
                      borderRadius: 1
                    }}
                  >
                    {validationError}
                  </Typography>
                )}
              </Box>
            )}

            {/* Step 2: Personal Information Form */}
            {step === 2 && (
              <Box component="form" onSubmit={submitApplication}>
                <Typography variant="subtitle1" sx={{ mb: 3 }}>
                  Vos informations
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Nom"
                      required
                      value={form.nom}
                      onChange={e => setForm({ ...form, nom: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Post-nom"
                      value={form.postnom}
                      onChange={e => setForm({ ...form, postnom: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      required
                      value={form.prenom}
                      onChange={e => setForm({ ...form, prenom: e.target.value })}
                    />
                  </Grid>
                 
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Adresse complète"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {/* ID Document Upload */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Pièce d'identité (passeport, carte, permis)
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      width: '100%',
                      py: 2,
                      border: '2px dashed',
                      borderColor: idFile ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    {idFile ? 'Changer le fichier' : 'Télécharger votre pièce d\'identité'}
                    <VisuallyHiddenInput
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          setIdFile(file);
                        } else {
                          alert('Le fichier doit faire moins de 5MB');
                        }
                      }}
                    />
                  </Button>
                  {idFile && (
                    <FilePreview
                      file={idFile}
                      onDelete={() => setIdFile(null)}
                    />
                  )}
                </Box>

                {/* Property Title Documents Upload */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Titre(s) de propriété
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      width: '100%',
                      py: 2,
                      border: '2px dashed',
                      borderColor: propTitleFiles.length ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    Ajouter des titres de propriété
                    <VisuallyHiddenInput
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
                        if (validFiles.length !== files.length) {
                          alert('Certains fichiers dépassent la limite de 5MB et n\'ont pas été ajoutés');
                        }
                        setPropTitleFiles(prev => [...prev, ...validFiles]);
                      }}
                    />
                  </Button>
                  {propTitleFiles.map((file, index) => (
                    <FilePreview
                      key={index}
                      file={file}
                      onDelete={() => setPropTitleFiles(files => files.filter((_, i) => i !== index))}
                    />
                  ))}
                </Box>

                {validationError && (
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      p: 1,
                      bgcolor: 'error.light',
                      color: 'error.dark',
                      borderRadius: 1
                    }}
                  >
                    {validationError}
                  </Typography>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => setStep(1)}
                    sx={{
                      borderColor: 'grey.300',
                      color: 'text.primary',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: 'grey.400',
                        bgcolor: 'grey.50'
                      }
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitApplication}
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: 'var(--ndaku-primary)',
                      color: 'white',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#10a37f',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <CircularProgress size={18} color="inherit" /> Envoi...
                      </span>
                    ) : (
                      'Soumettre la demande'
                    )}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Modals */}
        <ConfirmModal
          open={confirmOpen}
          title="Confirmer l'envoi"
          message="Confirmez-vous l'envoi de votre demande ?"
          onConfirm={doSubmit}
          onCancel={() => setConfirmOpen(false)}
        />
        <InfoModal
          open={infoOpen}
          title={infoTitle}
          message={infoMessage}
          onClose={() => { setInfoOpen(false); navigate('/owner/onboard'); }}
        />
      </Grid>
    </Container>
  );
}
