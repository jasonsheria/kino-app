import React from 'react';
import { Grid } from '@mui/material';
import PropertyCard from './PropertyCard';

const PropertyList = ({ properties, onView }) => (
  <Grid container spacing={2}>
    {properties.map((property) => (
      <Grid item xs={12} sm={6} md={4} key={property.id}>
        <PropertyCard property={property} onView={onView} />
      </Grid>
    ))}
  </Grid>
);

export default PropertyList;
