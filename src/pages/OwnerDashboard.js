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
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
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

    // small 7-day revenue dataset for the mini chart
    const revenueData = React.useMemo(() => {
        // if metrics.weeklyRevenue exists use it, otherwise fabricate sample data around metrics.revenue
        const base = metrics.revenue || 120;
        const weekly = (metrics.weeklyRevenue && metrics.weeklyRevenue.length === 7)
            ? metrics.weeklyRevenue
            : Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(base * (0.6 + Math.random() * 0.8))));

        return {
            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
            datasets: [
                {
                    label: 'Revenu',
                    data: weekly,
                    fill: true,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.9)',
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                }
            ]
        };
    }, [metrics]);

    const revenueOptions = React.useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        elements: { point: { radius: 0 } }
    }), []);

    // register chart components once
    React.useEffect(() => {
        ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
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
            <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 4 }, mt: 4, mb: 4, width: '100%' }}>
                <Grid container>
                    {/* Dashboard Header (mobile/financial) */}
                    <Grid item xs={12} md={6} sx={{ width: "100%" }}>
                        <Card sx={{ mb: 2, width: '100%', minHeight: 180, borderRadius: 0, background: 'linear-gradient(90deg,#0ea5a4 0%, #3b82f6 100%)', color: '#fff', boxShadow: 2 }}>
                            <CardContent sx={{ width: '100%' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} sx={{ width: '100%' }}>
                                    <Box>
                                        <Typography variant="h6">Bonjour, {ownerProfile?.prenom?.split(' ')[0] || 'Propriétaire'}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Voici le tableau de bord de votre activité</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
                                        <Chip icon={<FaBell />} label="Notifications" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                                        <Chip icon={<FaWallet />} label={`Solde $${metrics.revenue}`} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                                    </Box>
                                </Box>
                                <Grid container spacing={1} sx={{ mt: 2 }}>
                                    <Grid item xs={6} sm={3}><Box sx={{ textAlign: 'center' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>{metrics.visits}</Typography><Typography variant="caption">Visites</Typography></Box></Grid>
                                    <Grid item xs={6} sm={3}><Box sx={{ textAlign: 'center' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>{metrics.bookings}</Typography><Typography variant="caption">Réservations</Typography></Box></Grid>
                                    <Grid item xs={6} sm={3}><Box sx={{ textAlign: 'center' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>${metrics.revenue}</Typography><Typography variant="caption">Revenu</Typography></Box></Grid>
                                    <Grid item xs={6} sm={3}><Box sx={{ textAlign: 'center' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>4.5</Typography><Typography variant="caption">Note</Typography></Box></Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Box sx={{ flex: 1, width: '100%' }}>
                                        <Typography variant="subtitle2" color="inherit">Revenu - dernière semaine</Typography>
                                        <Box sx={{ height: 88, mt: 1 }}>
                                            <Box sx={{ height: '100%', px: 0.5 }}>
                                                <Line data={revenueData} options={revenueOptions} />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, width: '100%', marginBottom: '10px' }}>
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1, borderRadius: 0, textAlign: 'center', width: '100%' }} onClick={() => navigate('/owner/properties')}><Typography variant="caption">Mes biens</Typography></Box>
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1, borderRadius: 0, textAlign: 'center', width: '100%' }} onClick={() => navigate('/owner/messages')}><Typography variant="caption">Messages</Typography></Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ width: "100%" }}>
                        <Card sx={{ mb: 2, width: '100%', minHeight: 180, borderRadius: 0, background: 'linear-gradient(90deg,#34D399 0%, #60A5FA 100%)', color: '#fff', boxShadow: 2 }}>
                            <CardContent sx={{ width: '100%' }}>
                                <Box display="flex" flexDirection="column" alignItems="flex-start" sx={{ width: '100%' }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Financier</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>${metrics.revenue}</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Solde actuel et historique des revenus</Typography>
                                </Box>
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    <Line data={revenueData} options={revenueOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Calendar Section */}
                    <Grid item xs={12} md={12} style={{ width: '100%' }}>
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
                    <Grid item xs={12} md={4} style={{ width: '100%', marginTop : '24px' }}>
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
