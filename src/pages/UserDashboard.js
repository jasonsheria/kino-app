import React from 'react';
import ChatWidget from '../components/common/ChatWidget';

const UserDashboard = () => {
  return (
    <div className="container py-4">
      <h2 className="mb-3">Tableau de bord utilisateur</h2>
      <p>Bienvenue sur votre espace. Utilisez le chat pour contacter le support.</p>
      <div style={{ maxWidth: 420 }}>
        <ChatWidget inline={true} />
      </div>
    </div>
  );
};

export default UserDashboard;
