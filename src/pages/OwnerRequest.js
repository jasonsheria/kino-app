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
  Chip
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

  // on mount: restore draft if any
  useEffect(() => {
    try {
      const raw = localStorage.getItem('owner_request_draft');
      if (raw) {
        const draft = JSON.parse(raw || '{}');
        if (draft.types) setTypes(draft.types);
        if (draft.form) setForm(draft.form);
        if (draft.propTitleFiles) setPropTitleFiles(draft.propTitleFiles);
      }
    } catch (e) { console.error('restore draft failed', e); }

    // if we have a resume flag and a subscription, auto-continue
    // DO NOT clear the resume flag here; only remove it when we actually submit to avoid losing state
    try {
      const resume = localStorage.getItem('owner_resume_submission');
      const sub = JSON.parse(localStorage.getItem('owner_subscription') || 'null');
      if (resume && sub && sub.type) {
        // if form looks filled enough, open confirm directly to finalize
        // Note: we restored draft above, but state updates are async, so allow a short timeout
        setTimeout(() => {
          const looksReady = (typeof form.nom === 'string' && form.nom.trim().length > 0) || (typeof form.prenom === 'string' && form.prenom.trim().length > 0) || (typeof form.email === 'string' && form.email.trim().length > 0) || types.length;
          if (looksReady) {
            setConfirmOpen(true);
          }
        }, 300);
      }
    } catch (e) { console.error('resume check failed', e); }
  }, []);

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const submitApplication = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.nom || !form.prenom || !form.email) { setValidationError('Veuillez remplir les champs obligatoires'); return; }
    setValidationError('');
    // check subscription: if owner hasn't chosen subscription, save draft and redirect to subscription page
    try {
      const sub = JSON.parse(localStorage.getItem('owner_subscription') || 'null');
      if (!sub || !sub.type) {
        // save draft (files cannot be serialized fully) - keep meta and ids
        const draft = { types, form, propTitleFiles: propTitleFiles.map(f => f.name), savedAt: Date.now() };
        localStorage.setItem('owner_request_draft', JSON.stringify(draft));
        // navigate to subscription selection before final submit
        navigate('/owner/subscribe');
        return;
      }
    } catch (e) { console.error('subscription check failed', e); }

    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    // prevent double execution
    if (sessionStorage.getItem('owner_submission_lock') === '1') {
      // already submitting
      return;
    }
    sessionStorage.setItem('owner_submission_lock', '1');
    setConfirmOpen(false);
    const payload = new FormData();
    payload.append('meta', JSON.stringify({ types, form, propTitleFiles: propTitleFiles.map(file => file.name) }));
    if (idFile) payload.append('idFile', idFile);
    let saveStatus = 'pending';
    let serverMessage = 'Votre demande a été envoyée avec succès. Vous recevrez un code sous 48h.';
    try {
      const res = await fetch('/api/owner/apply', { method: 'POST', body: payload });
      if (!res.ok) { saveStatus = 'submitted_local'; serverMessage = 'Demande enregistrée localement (serveur indisponible).'; }
    } catch (e) { console.error(e); saveStatus = 'submitted_local'; serverMessage = 'Demande enregistrée localement (erreur réseau).'; }

    // persist a local application record so OwnerOnboard can display status/message
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      let subscription = null;
      try { subscription = JSON.parse(localStorage.getItem('owner_subscription') || 'null'); } catch (e) { }

      // Create FormData for files
      const formData = new FormData();
      formData.append('idFile', idFile);
      propTitleFiles.forEach((file, index) => {
        formData.append(`propertyTitle${index}`, file);
      });

      // dedupe: avoid creating duplicates if a very recent application with same email+name exists
      const existingRaw = localStorage.getItem('owner_application');
      let existing = existingRaw ? JSON.parse(existingRaw) : [];
      if (!Array.isArray(existing)) existing = [existing];
      const now = Date.now();
      const similar = existing.find(it => it && it.meta && it.meta.form && it.meta.form.email === form.email && it.meta.form.nom === form.nom && (now - it.submittedAt) < (15 * 1000));
      if (similar) {
        // cleanup lock but keep draft removal as it was already submitted
        try { localStorage.removeItem('owner_request_draft'); localStorage.removeItem('owner_resume_submission'); } catch (e) { }
        sessionStorage.removeItem('owner_submission_lock');
        // show modal informing user that submission already recorded (avoid duplicate code spam)
        setInfoTitle('Demande déjà envoyée');
        setInfoMessage('Une demande similaire a été enregistrée il y a quelques instants. Si vous pensez que c\'est une erreur, contactez le support.');
        setInfoOpen(true);
        return;
      }

      const app = { id: Date.now(), status: saveStatus, message: serverMessage, code, submittedAt: now, subscription, meta: { types, form, propTitleFiles: propTitleFiles.map(file => file.name) } };
      existing.unshift(app);
      localStorage.setItem('owner_application', JSON.stringify(existing));
      // cleanup draft and resume flag after successful save
      try { localStorage.removeItem('owner_request_draft'); localStorage.removeItem('owner_resume_submission'); } catch (e) { }
      // show info modal
      setInfoTitle('Demande envoyée');
      setInfoMessage(serverMessage + ` Votre code d'application: ${code}`);
      setInfoOpen(true);
      sessionStorage.removeItem('owner_submission_lock');
    } catch (e) { console.error('local save failed', e); setValidationError('Erreur lors de l\'enregistrement local'); sessionStorage.removeItem('owner_submission_lock'); }
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
                    <CheckCircleIcon sx={{ color: '#13c296', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body2">{benefit}</Typography>
                  </Box>
                ))}
              </Stack>
              <Button 
                fullWidth
                variant="contained"
                onClick={() => navigate('/owner/subscribe')}
                sx={{
                  bgcolor: '#13c296',
                  color: 'white',
                  py: 1.5,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#10a37f',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Choisir un abonnement
              </Button>
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
                  borderColor: '#13c296',
                  color: '#13c296',
                  '&:hover': {
                    borderColor: '#10a37f',
                    bgcolor: 'rgba(19, 194, 150, 0.04)',
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
                    background: 'linear-gradient(90deg, #13c296, #10a37f)'
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
                  {['Voiture', 'Terrain', 'Appartement', 'Salle de fête'].map(t => (
                    <Button 
                      key={t} 
                      variant={types.includes(t) ? "contained" : "outlined"}
                      onClick={() => toggleType(t)}
                      sx={{
                        mb: 1,
                        bgcolor: types.includes(t) ? '#13c296' : 'transparent',
                        color: types.includes(t) ? 'white' : 'text.primary',
                        '&:hover': {
                          bgcolor: types.includes(t) ? '#0ea67e' : 'rgba(19, 194, 150, 0.04)'
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
                      bgcolor: '#13c296',
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
                      label="Email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
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
                    sx={{
                      bgcolor: '#13c296',
                      color: 'white',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#10a37f',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                  >
                    Soumettre la demande
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
