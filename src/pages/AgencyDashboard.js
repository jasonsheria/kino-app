import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { currentAgencySession, fetchAgency } from '../api/agencies';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { alpha } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AgencyDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [stats, setStats] = React.useState({ products: 0, ads: 0, txs: 0, balance: 0, agents: 0 });
  const [tasks, setTasks] = React.useState([]);
  const [recent, setRecent] = React.useState([]);
  const session = currentAgencySession();

  const load = async () => {
    if (!session) return;
    const a = await fetchAgency(session.id);
    setStats({ products: (a.products || []).length, ads: (a.ads || []).length, txs: (a.transactions || []).length, balance: a.wallet || 0, agents: (a.agents || []).length });
    setTasks(a.tasks || [
      { id: 't1', title: 'Valider nouvelle annonce', due: 'Aujourd\u2019hui', done: false },
      { id: 't2', title: 'Répondre aux messages clients', due: 'Demain', done: false },
    ]);
    setRecent(a.recentActivity || [
      { id: 'r1', text: 'Campagne publicitaire créée', time: '2h' },
      { id: 'r2', text: 'Nouveau produit publié', time: '1j' }
    ]);
  };

  React.useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('ndaku-agency-change', h);
    return () => window.removeEventListener('ndaku-agency-change', h);
  }, []);

  const chartData = React.useMemo(() => {
    // derive timeseries for the last 6 months from agency transactions
    const now = new Date();
    const months = [];
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
      labels.push(d.toLocaleString(undefined, { month: 'short' }));
    }
    // aggregate transactions by month
    const prodCounts = months.map(m => 0);
    const adCounts = months.map(m => 0);
    try {
      const a = JSON.parse(localStorage.getItem('ndaku_agencies') || '{}');
      const ag = a[session.id] || {};
      (ag.products || []).forEach(p => {
        const created = p.created || p.createdAt || p.ts || null;
        if (!created) return;
        const d = new Date(created);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = months.indexOf(key);
        if (idx !== -1) prodCounts[idx] += 1;
      });
      (ag.ads || []).forEach(ad => {
        const created = ad.created || ad.createdAt || ad.ts || null;
        if (!created) return;
        const d = new Date(created);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = months.indexOf(key);
        if (idx !== -1) adCounts[idx] += 1;
      });
    } catch (e) { }

    return {
      labels,
      datasets: [
        {
          label: 'Produits',
          data: prodCounts,
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.18),
          tension: 0.3
        },
        {
          label: 'Publicités',
          data: adCounts,
          borderColor: theme.palette.warning.main,
          backgroundColor: alpha(theme.palette.warning.main, 0.18),
          tension: 0.3
        }
      ]
    };
  }, [stats]);


  return (
    <AgencyLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                Tableau de bord
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vue d'ensemble — performances, publicités, ventes et activités récentes.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component={Link}
                to="/agency/ads"
                variant="outlined"
                color="success"
                sx={{ whiteSpace: 'nowrap' }}
              >
                Nouvelle campagne
              </Button>
              <Button
                component={Link}
                to="/agency/products"
                variant="contained"
                color="success"
                sx={{ whiteSpace: 'nowrap' }}
              >
                Ajouter un produit
              </Button>
            </Stack>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <StorefrontIcon
                    sx={{
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      p: 0.5,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Produits
                  </Typography>
                </Stack>
                <Typography variant="h4" sx={{ mb: 1, color: theme.palette.primary.main }}>
                  {stats.products}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gérer vos produits publiés
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CampaignIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Publicités
                  </Typography>
                </Stack>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.ads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Campagnes actives
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <AccountBalanceWalletIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Solde
                  </Typography>
                </Stack>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.balance} €
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transactions: {stats.txs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <GroupIcon color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Agents
                  </Typography>
                </Stack>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.agents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gérer l'équipe
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Activité récente
                </Typography>
                <Box sx={{ width: '100%', height: { xs: 200, sm: 300, md: 350 } }}>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: isMobile ? 'bottom' : 'top',
                          align: 'start',
                          labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: theme.palette.divider,
                            borderDash: [5, 5]
                          },
                          ticks: {
                            display: !isMobile
                          }
                        },
                        y: {
                          grid: {
                            color: theme.palette.divider,
                            borderDash: [5, 5]
                          },
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Tâches
                  </Typography>
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }} disablePadding>
                    {tasks.map(t => (
                      <ListItem
                        key={t.id}
                        divider
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                        secondaryAction={
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            sx={{
                              minWidth: { xs: '100%', sm: 'auto' },
                              mt: { xs: 1, sm: 0 }
                            }}
                          >
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              sx={{
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.success.main, 0.08)
                                }
                              }}
                            >
                              Marquer fait
                            </Button>
                            <IconButton
                              size="small"
                              color="primary"
                              sx={{
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                                }
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={t.title}
                          secondary={`Échéance: ${t.due}`}
                          primaryTypographyProps={{
                            fontWeight: 500,
                            color: theme.palette.text.primary
                          }}
                          secondaryTypographyProps={{
                            color: theme.palette.text.secondary
                          }}
                          sx={{
                            my: { xs: 1, sm: 0.5 }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Récemment
                  </Typography>
                  <List disablePadding>
                    {recent.map(r => (
                      <ListItem key={r.id} divider>
                        <ListItemText
                          primary={r.text}
                          secondary={r.time}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Raccourcis
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      component={Link}
                      to="/agency/products"
                      variant="outlined"
                      color="primary"
                      startIcon={<StorefrontIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateX(4px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      Gérer produits
                    </Button>
                    <Button
                      component={Link}
                      to="/agency/ads"
                      variant="outlined"
                      color="warning"
                      startIcon={<CampaignIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.04),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.warning.main, 0.08),
                          transform: 'translateX(4px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      Gérer publicités
                    </Button>
                    <Button
                      component={Link}
                      to="/agency/agents"
                      variant="outlined"
                      color="success"
                      startIcon={<GroupIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          transform: 'translateX(4px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      Gérer agents
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </AgencyLayout>
  );
}
