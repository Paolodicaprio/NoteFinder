import React, { useState } from 'react';
import { Grid2, Button, TextField, Card, Typography, Container, Box } from '@mui/material';
import { loginEtudiant } from '../../services/etudiantService';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [matricule, setMatricule] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await loginEtudiant({ matricule, code });
      if (response.etudiant) {
        localStorage.setItem('etudiant', JSON.stringify(response.etudiant));
        navigate('/dash');
      }
    } catch (err) {
      setError(err.message || 'Matricule ou code incorrect');
    }
  };

  return (
    <Container maxWidth={false} sx={{ 
      height: '100vh', 
      padding: 0, 
      backgroundColor: '#f5f7fa',
      display: 'flex',
      alignItems: 'center'
    }}>
      

        {/* Colonne de droite : Formulaire de connexion */}
        <Grid2
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            marginLeft: '330px'
          }}
        >
          <Card sx={{
            padding: { xs: '20px', sm: '40px' },
            width: '100%',
            maxWidth: '450px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography 
              variant="h4" 
              align="center" 
              gutterBottom 
              sx={{ 
                color: '#1976d2',
                fontWeight: '600',
                marginBottom: '30px'
              }}
            >
              Connexion Étudiant
            </Typography>
            
            {error && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <TextField
              label="Matricule"
              fullWidth
              margin="normal"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              sx={{ 
                marginBottom: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <TextField
              label="Code d'accès"
              type="password"
              fullWidth
              margin="normal"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ 
                marginBottom: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'none',
                marginTop: '10px',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Se connecter
            </Button>
            
            <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
              <Typography variant="body2" color="textSecondary">
                Vous n'avez pas de compte? Contactez l'administration
              </Typography>
            </Box>
          </Card>
        </Grid2>
      
    </Container>
  );
}

export default LoginPage;