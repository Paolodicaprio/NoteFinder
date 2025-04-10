import React, { useState } from 'react';
import { Grid2, Card, Typography, Button, LinearProgress, Container, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logout } from '@mui/icons-material';
import authService from '../../services/authService';

function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ 
      marginTop: '20px', 
      padding: '20px',
      position: 'relative'
    }}>
      {/* Bouton de déconnexion en haut à droite */}
      <IconButton
        onClick={handleLogout}
        sx={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          color: '#1976d2',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
      >
        <Logout />
      </IconButton>

      <Typography variant="h4" align="center" gutterBottom sx={{
        color: '#1976d2',
        fontWeight: '600',
        marginBottom: '40px',
        marginTop: '10px'
      }}>
        Tableau de Bord Étudiant
      </Typography>

      {/* Section unique pour les notes */}
      <Grid2 container justifyContent="center">
        <Grid2 item xs={12} md={8}>
          <Card sx={{
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(to bottom right, #f9f9f9, #ffffff)',
            border: '1px solid rgba(25, 118, 210, 0.1)'
          }}>
            <Typography variant="h5" gutterBottom sx={{
              color: '#1976d2',
              fontWeight: '500',
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center'
            }}>
              Mes Notes
            </Typography>

            <Box sx={{
              backgroundColor: '#f5f9ff',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px',
              borderLeft: '4px solid #1976d2'
            }}>
              <Typography variant="body1" sx={{ color: '#555' }}>
                Consultez vos notes et résultats académiques.
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/grades')}
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                textTransform: 'none',
                marginTop: '10px',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              Accéder à mes notes
            </Button>

            <Box sx={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #e2e8f0'
            }}>
              <Typography variant="body2" sx={{ 
                color: '#64748b',
                textAlign: 'center'
              }}>
                Pour toute question concernant vos notes, veuillez contacter le service administratif.
              </Typography>
            </Box>
          </Card>
        </Grid2>
      </Grid2>
    </Container>
  );
}

export default DashboardPage;