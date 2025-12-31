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
    FaBell,
    FaWallet
} from 'react-icons/fa';
import '../styles/owner.css';
import { useOwnerProfile } from '../hooks/useOwnerProfile';
import OwnerCalendar from '../components/owner/OwnerCalendar';
import { getDashboardMetrics } from '../data/fakeMetrics';
import OwnerLayout from '../components/owner/OwnerLayout';

// Enregistrement des composants ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

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

export default function OwnerDashboard() {
    const { ownerProfile, loading, error } = useOwnerProfile();
    const [metrics, setMetrics] = React.useState({ visits: 0, bookings: 0, revenue: 0 });
    const navigate = useNavigate();

    // Utilitaires de sécurité pour éviter les crashs de rendu
    const safeStr = (val, fallback = "") => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        return fallback;
    };

    const safeNum = (val) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };

    React.useEffect(() => {
        const m = getDashboardMetrics('owner-123');
        if (m) setMetrics(m);
    }, []);

    // Configuration des données du graphique
    const revenueData = React.useMemo(() => {
        const base = safeNum(metrics.revenue);
        const weekly = (metrics.weeklyRevenue && Array.isArray(metrics.weeklyRevenue))
            ? metrics.weeklyRevenue
            : Array.from({ length: 7 }, () => Math.floor(Math.random() * base));

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

    const revenueOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    if (loading) {
        return (
            <OwnerLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </OwnerLayout>
        );
    }

    if (error) {
        return (
            <OwnerLayout>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {typeof error === 'string' ? error : "Une erreur est survenue lors du chargement du profil"}
                </Alert>
            </OwnerLayout>
        );
    }

    // Extraction sécurisée du prénom
    const displayUsername = safeStr(ownerProfile?.username, "Propriétaire");
    const firstName = displayUsername.split(' ')[0];

    return (
        <OwnerLayout>
            <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 4 }, mt: 4, mb: 4, width: '100%' }}>
                <Grid container spacing={3}>
                    {/* Dashboard Header */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ 
                            width: '100%', 
                            minHeight: 180, 
                            borderRadius: 2, 
                            background: 'linear-gradient(90deg,#0ea5a4 0%, #3b82f6 100%)', 
                            color: '#fff', 
                            boxShadow: 2 
                        }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                                            Bonjour {firstName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                                            Voici le résumé de votre activité immobilière
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
                                        <Chip 
                                            icon={<FaBell style={{color: 'white'}}/>} 
                                            label="Notifications" 
                                            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} 
                                        />
                                        <Chip 
                                            icon={<FaWallet style={{color: 'white'}}/>} 
                                            label={`Solde $${safeNum(metrics.revenue).toLocaleString()}`} 
                                            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} 
                                        />
                                    </Box>
                                </Box>

                                <Grid container spacing={2} sx={{ mt: 3 }}>
                                    {[
                                        { label: 'Visites', value: safeNum(metrics.visits) },
                                        { label: 'Réservations', value: safeNum(metrics.bookings) },
                                        { label: 'Revenu', value: `$${safeNum(metrics.revenue).toLocaleString()}` },
                                        { label: 'Note', value: '4.5' }
                                    ].map((stat, index) => (
                                        <Grid item xs={6} sm={3} key={index}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Box sx={{ mt: 3, height: 80 }}>
                                    <Line data={revenueData} options={revenueOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Quick Actions Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Actions Rapides</Typography>
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Box 
                                        sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' }, border: '1px solid #e2e8f0' }}
                                        onClick={() => navigate('/owner/properties')}
                                    >
                                        <Typography variant="body2" fontWeight="600">Gérer mes biens</Typography>
                                        <Typography variant="caption" color="text.secondary">Voir et éditer vos annonces</Typography>
                                    </Box>
                                    <Box 
                                        sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' }, border: '1px solid #e2e8f0' }}
                                        onClick={() => navigate('/owner/messages')}
                                    >
                                        <Typography variant="body2" fontWeight="600">Messages</Typography>
                                        <Typography variant="caption" color="text.secondary">Répondre aux clients</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Calendar Section */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Calendrier & Rendez-vous</Typography>
                                {/* Utilisation sécurisée de l'ID */}
                                <OwnerCalendar ownerId={safeStr(ownerProfile?._id || ownerProfile?.id)} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Activity Section */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Notifications système</Typography>
                                <Stack spacing={2}>
                                    {ownerProfile?.certRequested && (
                                        <Alert severity="info">
                                            Demande de certification en cours. 
                                            {ownerProfile.certificationNote && (
                                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                    Note de l'admin : {safeStr(ownerProfile.certificationNote)}
                                                </Typography>
                                            )}
                                        </Alert>
                                    )}
                                    <Alert severity="success">
                                        Votre compte est actif en tant que <strong>{ownerProfile?.isAdmin ? "Administrateur" : "Propriétaire"}</strong>.
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