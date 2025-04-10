import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1 style={{ fontSize: '48px', color: '#e53e3e' }}>500 - Erreur Serveur</h1>
      <p style={{ fontSize: '18px', color: '#4a5568' }}>
        Une erreur s'est produite du côté serveur. Veuillez réessayer plus tard.
      </p>
      <Link to="/" style={{ color: '#4c51bf', textDecoration: 'none', fontSize: '16px' }}>
        Retour au Dashboard
      </Link>
    </div>
  );
};

export default ServerError;