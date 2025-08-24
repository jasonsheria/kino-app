import React, { useState, useMemo, useEffect } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import OwnerPropertyForm from '../components/owner/OwnerPropertyForm';
import PropertyCard from '../components/property/PropertyCard';
import '../styles/owner.css';
import { agents } from '../data/fakedata';
import { getListingRequests, acceptListingRequest, rejectListingRequest } from '../api/ownerActions';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  DialogTitle,
  DialogActions,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  DirectionsCar as CarIcon,
  Landscape as TerrainIcon
} from '@mui/icons-material';

export default function OwnerProperties() {
  const [properties, setProperties] = useState(JSON.parse(localStorage.getItem('owner_props') || '[]'));
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState({ q: '', type: 'all' });

  // determine owner types: try owner_request_draft, then owner_application, then derive from props
  const ownerTypes = useMemo(() => {
    try {
      const draftRaw = localStorage.getItem('owner_request_draft');
      if (draftRaw) { const d = JSON.parse(draftRaw); if (d.types && d.types.length) return d.types; }
    } catch (e) { }
    try {
      const apps = JSON.parse(localStorage.getItem('owner_application') || 'null');
      if (apps) { const head = Array.isArray(apps) ? apps[0] : apps; if (head && head.meta && head.meta.types && head.meta.types.length) return head.meta.types; }
    } catch (e) { }
    const typesFromProps = Array.from(new Set((properties || []).map(p => p.type).filter(Boolean)));
    return typesFromProps.length ? typesFromProps : ['Appartement', 'Voiture', 'Terrain'];
  }, [properties]);

  const stats = useMemo(() => {
    const total = properties.length;
    const byType = {};
    ownerTypes.forEach(t => byType[t] = properties.filter(p => p.type === t).length);
    return { total, byType };
  }, [properties, ownerTypes]);

  const openAdd = () => { setEditIndex(null); setModalOpen(true); };
  const openEdit = (i) => { setEditIndex(i); setModalOpen(true); };
  const [editing, setEditing] = useState(null);

  const remove = (i) => { if (!window.confirm('Supprimer ce bien ?')) return; const next = [...properties]; next.splice(i, 1); setProperties(next); localStorage.setItem('owner_props', JSON.stringify(next)); };
  const save = (p) => {
    const next = [...properties];
    if (editIndex != null) {
      next[editIndex] = { ...next[editIndex], ...p };
    } else {
      const assign = { ...p, id: Date.now(), agentId: p.agentId || (agents[0] && agents[0].id) };
      next.push(assign);
    }
    setProperties(next);
    localStorage.setItem('owner_props', JSON.stringify(next));
    setModalOpen(false);
    setEditIndex(null);
  };

  const filtered = properties.filter(p => {
    if (filter.type && filter.type !== 'all' && p.type !== filter.type) return false;
    if (filter.q && filter.q.trim().length) { const q = filter.q.toLowerCase(); return (p.title && p.title.toLowerCase().includes(q)) || (p.type && p.type.toLowerCase().includes(q)); }
    return true;
  });

  const [requests, setRequests] = useState([]);
  useEffect(()=>{ setRequests(getListingRequests()); }, []);

  const handleAccept = async (id)=>{
    if(!window.confirm('Accepter cette demande et lier le bien à l\'agence ?')) return;
    try{
      await acceptListingRequest(id);
      setRequests(getListingRequests());
      setProperties(JSON.parse(localStorage.getItem('owner_props') || '[]'));
    }catch(e){ alert('Impossible d\'accepter la demande : '+ String(e)); }
  };

  const handleReject = (id)=>{
    if(!window.confirm('Rejeter cette demande ?')) return;
    rejectListingRequest(id);
    setRequests(getListingRequests());
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPropertyIcon = (type) => {
    switch(type) {
      case 'Appartement': return <ApartmentIcon />;
      case 'Voiture': return <CarIcon />;
      case 'Terrain': return <TerrainIcon />;
      default: return <HomeIcon />;
    }
  };

  return (
    <OwnerLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Stats row */}
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            mb: 3,
            '& > .MuiGrid-item': {
              display: 'flex',
            }
          }}
        >
          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                width: '100%',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderRadius: 0,
                border: `1px solid ${theme.palette.primary.dark}`,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Stack spacing={1} width="100%">
                <Typography variant="h6" fontWeight={600}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Total de biens
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          {ownerTypes.map((t, idx) => (
            <Grid item xs={6} md={3} key={t}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: '100%',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ 
                  p: 1.5,
                  borderRadius: 0,
                  bgcolor: theme.palette.grey[50],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  {getPropertyIcon(t)}
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight={600}>
                    {stats.byType[t] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filter bar */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3,
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <TextField
                placeholder="Rechercher un bien"
                variant="outlined"
                size="small"
                value={filter.q}
                onChange={(e) => setFilter({ ...filter, q: e.target.value })}
                sx={{ 
                  minWidth: { sm: 250 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.grey[50],
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                select
                size="small"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                sx={{ 
                  minWidth: { sm: 200 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.grey[50],
                  }
                }}
              >
                <MenuItem value="all">Tous les types</MenuItem>
                {ownerTypes.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
              <IconButton 
                onClick={() => setFilter({ q: '', type: 'all' })}
                sx={{ 
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    bgcolor: theme.palette.action.hover 
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAdd}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: 0,
                px: 3,
                '&:hover': { 
                  bgcolor: theme.palette.primary.dark,
                }
              }}
            >
              Ajouter un bien
            </Button>
          </Stack>
        </Paper>

        {/* Pending listing requests */}
        {requests.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Demandes de liaisons d'agences
            </Typography>
            <Stack spacing={2}>
              {requests.map((r) => (
                <Paper 
                  key={r.id} 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        Agence: {r.agencyId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Propriété: {r.propertyId} — {new Date(r.date).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAccept(r.id)}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => handleReject(r.id)}
                      >
                        Rejeter
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Properties grid */}
        <Grid container spacing={3}>
          {filtered.map((p, i) => (
            <Grid item xs={12} sm={6} md={4} key={p.id || i}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiCardContent-root': {
                    p: 2,
                  }
                }}
                elevation={0}
              >
                <Box sx={{ position: 'relative' }}>
                  <PropertyCard property={p} />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      borderRadius: 0,
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Chip 
                      size="small"
                      label={p.type} 
                      icon={getPropertyIcon(p.type)}
                      sx={{ 
                        m: 0.5,
                        borderRadius: 0,
                        bgcolor: theme.palette.background.paper,
                      }}
                    />
                  </Box>
                </Box>
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                  >
                    <IconButton
                      size="small"
                      onClick={() => openEdit(properties.indexOf(p))}
                      sx={{ 
                        bgcolor: theme.palette.grey[50],
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { 
                          bgcolor: theme.palette.grey[100] 
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => remove(properties.indexOf(p))}
                      sx={{ 
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        color: theme.palette.error.main,
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.error.light}`,
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Aucun bien trouvé
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Property Form Dialog */}
        <Dialog
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditIndex(null); }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: 0,
              m: 0,
              height: { xs: '100%', sm: 'auto' },
              border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
              boxShadow: { xs: 'none', sm: theme.shadows[1] }
            }
          }}
        >
          <DialogTitle>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">
                {editIndex !== null ? 'Modifier le bien' : 'Ajouter un bien'}
              </Typography>
              <IconButton
                edge="end"
                onClick={() => { setModalOpen(false); setEditIndex(null); }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <OwnerPropertyForm
              onSave={save}
              initial={editIndex != null ? properties[editIndex] : {}}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => { setModalOpen(false); setEditIndex(null); }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              form="property-form"
              type="submit"
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </OwnerLayout>
  );
}
