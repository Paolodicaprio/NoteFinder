import React, { useState } from 'react';
import { Button, TextField, Card, Typography, Container } from '@mui/material';

function ProfilePage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');

  const handleSave = () => {
    console.log('Name:', name, 'Email:', email);
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Card style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <Typography variant="h4" align="center" gutterBottom style={{ color: '#1976d2' }}>
          Profil
        </Typography>
        <TextField
          label="Nom"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSave}
          style={{ backgroundColor: '#1976d2', color: '#fff', marginTop: '20px' }}
        >
          Sauvegarder
        </Button>
      </Card>
    </Container>
  );
}

export default ProfilePage;