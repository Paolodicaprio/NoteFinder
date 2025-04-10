import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorBoundary = ({ children }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Erreur non capturée :', error);
      navigate('/server-error'); // Redirige vers la page d'erreur
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [navigate]);

  return children;
};

export default ErrorBoundary;