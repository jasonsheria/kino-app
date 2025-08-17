import React from 'react';
import { Card, CardContent, Typography, Button, List, ListItem } from '@mui/material';

const SubscriptionCard = ({ plan, selected, onSelect }) => (
  <Card sx={{ minWidth: 220, m: 2, border: selected ? '2px solid #1976d2' : '1px solid #eee', borderRadius: 3, boxShadow: selected ? 4 : 1 }}>
    <CardContent>
      <Typography variant="h6" color="primary.main" fontWeight={700}>{plan.name}</Typography>
      <Typography variant="h5" color="secondary.main" fontWeight={600}>{plan.price === 0 ? 'Gratuit' : plan.price + ' €'}</Typography>
      <List dense>
        {plan.features.map((f, i) => <ListItem key={i}>{f}</ListItem>)}
      </List>
      <Button variant={selected ? 'contained' : 'outlined'} color="primary" fullWidth onClick={() => onSelect(plan.id)}>
        {selected ? 'Sélectionné' : 'Choisir'}
      </Button>
    </CardContent>
  </Card>
);

export default SubscriptionCard;
