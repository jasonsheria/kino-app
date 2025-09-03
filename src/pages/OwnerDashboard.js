import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Box,
    Chip,
    LinearProgress,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    FaEye,
    FaCalendarCheck,
    FaClock,
    FaWallet,
    FaUser,
    FaBell,
    FaEnvelope,
    FaSignOutAlt,
    FaStar,
    FaCheck,
    FaCertificate
} from 'react-icons/fa';
import '../styles/owner.css';
import { useOwnerProfile } from '../hooks/useOwnerProfile';
import OwnerCalendar from '../components/owner/OwnerCalendar';
import { getDashboardMetrics } from '../data/fakeMetrics';
import OwnerLayout from '../components/owner/OwnerLayout';

const ProfileCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    position: 'relative',
    overflow: 'visible'
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 100,
    height: 100,
    border: `4px solid ${theme.palette.background.paper}`,
    marginTop: -50,
    backgroundColor: theme.palette.primary.main
}));

const StatCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[4]
    }
}));

export default function OwnerDashboard() {
    const { ownerProfile, loading, error } = useOwnerProfile();
    const [metrics, setMetrics] = React.useState({ visits: 0, bookings: 0, revenue: 0 });
    const [animateBars, setAnimateBars] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const m = getDashboardMetrics('owner-123');
        setMetrics(m);
        setTimeout(() => setAnimateBars(true), 120);
    }, []);

    if (loading) {
        return (
            <OwnerLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            </OwnerLayout>
        );
    }

    if (error) {
        return (
            <OwnerLayout>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </OwnerLayout>
        );
    }

    return (
        <OwnerLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Profile Card */}
                    <Grid item xs={12}>
                        <ProfileCard>
                            <Box sx={{ height: 100, bgcolor: 'primary.main' }} />
                            <CardContent sx={{ pt: 0 }}>
                                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                                    <StyledAvatar src={ownerProfile?.avatar} alt={ownerProfile?.name} />
                                    <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                                        {ownerProfile?.name}
                                    </Typography>
                                    <Box display="flex" gap={1} mb={1}>
                                        <Chip
                                            icon={<FaStar />}
                                            label={`${ownerProfile?.rating || 0} étoiles`}
                                            color="primary"
                                        />
                                        <Chip
                                            icon={ownerProfile?.certified ? <FaCheck /> : <FaCertificate />}
                                            label={ownerProfile?.certified ? 'Certifié' : 'Non certifié'}
                                            color={ownerProfile?.certified ? 'success' : 'default'}
                                        />
                                        <Chip
                                            label={ownerProfile?.subscription || 'Basic'}
                                            color="secondary"
                                        />
                                    </Box>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            <FaEnvelope style={{ marginRight: 8 }} />
                                            {ownerProfile?.email}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <FaUser style={{ marginRight: 8 }} />
                                            {ownerProfile?.phone}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </CardContent>
                        </ProfileCard>
                    </Grid>

                    {/* Stat Cards */}
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard>
                            <FaEye size={24} color="#60A5FA" />
                            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                                {metrics.visits}
                            </Typography>
                            <Typography color="text.secondary">Visites</Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard>
                            <FaCalendarCheck size={24} color="#34D399" />
                            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                                {metrics.bookings}
                            </Typography>
                            <Typography color="text.secondary">Rendez-vous</Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard>
                            <FaClock size={24} color="#FBBF24" />
                            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                                12
                            </Typography>
                            <Typography color="text.secondary">En attente</Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard>
                            <FaWallet size={24} color="#F472B6" />
                            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                                ${metrics.revenue}
                            </Typography>
                            <Typography color="text.secondary">Revenus</Typography>
                        </StatCard>
                    </Grid>
                    {/* Calendar Section */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Calendrier & Rendez-vous
                                </Typography>
                                <OwnerCalendar ownerId={ownerProfile?.id} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Activity Section */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Activités récentes
                                </Typography>
                                <Stack spacing={2}>
                                    {ownerProfile?.certRequested && (
                                        <Alert severity="info">
                                            Demande de certification en cours
                                            {ownerProfile?.certificationNote && (
                                                <Typography variant="caption" display="block">
                                                    Note: {ownerProfile.certificationNote}
                                                </Typography>
                                            )}
                                        </Alert>
                                    )}
                                    <Alert severity="success">
                                        Profil mis à jour avec succès
                                    </Alert>
                                    <Alert severity="warning">
                                        3 nouveaux messages non lus
                                    </Alert>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </OwnerLayout>
    );
}
