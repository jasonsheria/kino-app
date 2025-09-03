import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../hooks/useProperty';
import PropertyCard from '../components/property/PropertyCard';
import {
  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';

export default function MyProperties() {
  const { user } = useAuth();
  const { loading, error, properties, fetchProperties } = useProperty();
  const [displayError, setDisplayError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchProperties({ ownerId: user.id })
        .catch(err => {
          setDisplayError(err.message || 'Erreur lors du chargement des propriétés');
        });
    }
  }, [user, fetchProperties]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Veuillez vous connecter pour voir vos propriétés
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Mes Propriétés
        </Typography>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {displayError}
        </Alert>
      )}

      {!loading && !error && (
        <Grid container spacing={3}>
          {properties.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                Vous n'avez pas encore de propriétés. Commencez par en ajouter une !
              </Alert>
            </Grid>
          ) : (
            properties.map((property) => (
              <Grid item xs={12} sm={6} md={4} key={property._id}>
                <PropertyCard property={property} />
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Container>
  );
}
