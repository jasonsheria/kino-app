import React from 'react';
import { Grid } from '@mui/material';
import AgentCard from './AgentCard';

const AgentList = ({ agents, onView }) => (
  <Grid container spacing={2}>
    {agents.map((agent) => (
      <Grid item xs={12} sm={6} md={4} key={agent.id}>
        <AgentCard agent={agent} onView={onView} />
      </Grid>
    ))}
  </Grid>
);

export default AgentList;
