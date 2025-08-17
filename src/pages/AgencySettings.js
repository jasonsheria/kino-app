import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';

export default function AgencySettings(){
  return (
    <AgencyLayout>
      <div>
        <h4>Paramètres agence</h4>
        <div className="small text-muted">Informations, préférences et team.</div>
      </div>
    </AgencyLayout>
  );
}
