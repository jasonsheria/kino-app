import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import * as agenciesApi from '../api/agencies';
import Navbar from '../components/common/Navbar';
import {
  Container,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ownerAccount, setOwnerAccount] = useState(null);
  const [agencySession, setAgencySession] = useState(null);
  const [agency, setAgency] = useState(null);
  const [agentProfiles, setAgentProfiles] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const detectRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const authToken = token || localStorage.getItem('ndaku_auth_token');

        // 1) owner: call /api/owner/check-account (same check used elsewhere)
        try {
          if (authToken) {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/owner/check-account`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              setOwnerAccount(data);
            }
          }
        } catch (e) {
          // non-fatal
          console.warn('owner check failed', e);
        }

        // 2) agency: try client-side session first then fetch agency details
        try {
          const session = agenciesApi.currentAgencySession && agenciesApi.currentAgencySession();
          setAgencySession(session);
          if (session && session.id) {
            const a = await agenciesApi.fetchAgency(session.id);
            setAgency(a);
          }
        } catch (e) {
          console.warn('agency detection failed', e);
        }

        // 3) agent: call /api/agents/me (requires auth)
        try {
          if (authToken) {
            const r = await fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/agents/me`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (r.ok) {
              const data = await r.json();
              // The API here returns an array of agents tied to the user (see controller)
              if (Array.isArray(data) && data.length) setAgentProfiles(data);
              else if (data && data.length) setAgentProfiles(data);
            }
          }
        } catch (e) {
          console.warn('agent check failed', e);
        }
      } catch (err) {
        console.error('Role detection error', err);
        setError('Impossible de déterminer le type de compte pour l\'instant.');
      } finally {
        setLoading(false);
      }
    };
    detectRoles();
  }, [token]);

  if (!user) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>Vous n'êtes pas connecté</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Connectez-vous pour voir votre profil et les options liées à votre compte.</Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={() => navigate('/login')}>Se connecter</Button>
                <Button component={RouterLink} to="/register" variant="outlined">Créer un compte</Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ mx: 'auto' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Avatar
                  src={user.profileImage || user.avatar || '/logo192.png'}
                  alt={user.name || user.username || 'Utilisateur'}
                  sx={{ width: 96, height: 96, mx: { xs: 'auto', sm: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={9}>
                <Typography variant="h6">{user.name || user.fullName || user.username || 'Utilisateur'}</Typography>
                <Typography color="text.secondary" variant="body2">{user.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Button size="small" component={RouterLink} to="/profile/edit" variant="outlined">Modifier le profil</Button>
                  <Button size="small" component={RouterLink} to="/settings" variant="outlined">Paramètres</Button>
                </Stack>
              </Grid>
            </Grid>

            <Stack sx={{ mt: 3 }} spacing={2}>
              {loading ? (
                <Stack alignItems="center">
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Chargement des informations du compte...</Typography>
                </Stack>
              ) : (
                <>
                  {error && <Alert severity="error">{error}</Alert>}

                  <div>
                    <Typography variant="subtitle1">Rôles détectés :</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      {ownerAccount?.hasAccount ? <Chip label="Propriétaire" color="success" /> : null}
                      {agencySession ? <Chip label="Agence" color="primary" /> : null}
                      {agentProfiles && agentProfiles.length ? <Chip label={`Agent (${agentProfiles.length})`} color="warning" /> : null}
                      {!ownerAccount?.hasAccount && !agencySession && !(agentProfiles && agentProfiles.length) ? <Chip label="Utilisateur" /> : null}
                    </Stack>
                  </div>

                  {ownerAccount?.hasAccount && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6">Espace propriétaire</Typography>
                      <Typography variant="body2" color="text.secondary">Vous avez un compte propriétaire enregistré sur la plateforme.</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                        <Button component={RouterLink} to="/owner/dashboard" variant="contained">Accéder à mon espace propriétaire</Button>
                        <Button component={RouterLink} to="/owner/properties" variant="outlined">Mes biens</Button>
                      </Stack>
                    </Paper>
                  )}

                  {agencySession && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6">Agence</Typography>
                      <Typography variant="body2" color="text.secondary">Session agence active : {agencySession.email || agencySession.id}</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                        <Button component={RouterLink} to="/agency/dashboard" variant="contained">Espace agence</Button>
                        <Button component={RouterLink} to="/agency/agents" variant="outlined">Gérer les agents</Button>
                        <Button component={RouterLink} to="/agency/profile" variant="outlined">Profil agence</Button>
                      </Stack>
                    </Paper>
                  )}

                  {agentProfiles && agentProfiles.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6">Compte agent</Typography>
                      <Typography variant="body2" color="text.secondary">Vous êtes lié à {agentProfiles.length} profil(s) agent.</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {agentProfiles.map((a, idx) => (
                          <Card key={a._id || a.id || idx} sx={{ p: 1, minWidth: 200 }}>
                            <Typography sx={{ fontWeight: 600 }}>{a.name || a.displayName || 'Agent'}</Typography>
                            <Typography variant="caption" color="text.secondary">{a.phone || a.email || ''}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Button size="small" component={RouterLink} to={`/agents/${a._id || a.id}`}>Voir</Button>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  )}

                  {!ownerAccount?.hasAccount && !agencySession && !(agentProfiles && agentProfiles.length) && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6">Compte utilisateur</Typography>
                      <Typography variant="body2" color="text.secondary">Utilisez les boutons ci-dessous pour gérer votre compte.</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button component={RouterLink} to="/favourites" variant="outlined">Favoris</Button>
                        <Button component={RouterLink} to="/messages" variant="outlined">Messages</Button>
                      </Stack>
                    </Paper>
                  )}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
