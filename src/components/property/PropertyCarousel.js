import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const PropertyCarousel = ({ images }) => {
  // TODO: Implémenter le carrousel d'images
  return (
    <Box>
      {/* Carrousel d'images ici */}
      <img src={images[0]} alt="property" style={{ width: '100%', borderRadius: 12 }} />
    </Box>
  );
};

export default PropertyCarousel;
