import httpService from './api';

const authService = {
  // Login standard
  async login(email, password) {
    try {
      const response = await httpService.post('/api/login', { email, password }, { withCredentials: true });
      
      if (response.data && response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data?.message || 'Identifiants incorrects' };
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Email et mot de passe requis');
        } else if (error.response.status === 401) {
          throw new Error('Identifiants incorrects');
        }
      }
      throw new Error('Échec de la connexion. Vérifiez vos identifiants.');
    }
  },

  // Login étudiant spécifique
  async loginEtudiant(matricule, code) {
    try {
      const response = await httpService.post('/api/etudiants/login', { matricule, code });
      
      if (response.data && response.data.etudiant) {
        localStorage.setItem('etudiant', JSON.stringify(response.data.etudiant));
        return { success: true, etudiant: response.data.etudiant };
      } else {
        return { success: false, message: response.data?.message || 'Matricule ou code incorrect' };
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Matricule ou code incorrect');
        }
      }
      throw new Error('Échec de la connexion étudiant.');
    }
  },

  // Register admin/enseignant/secrétaire
  async register(userData) {
    try {
      const response = await httpService.post('/api/register', userData);
      if (response.status === 201) {
        return { success: true, user: response.data };
      }
      throw new Error('Erreur lors de la création du compte');
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Tous les champs sont requis ou email déjà existant');
        }
      }
      throw new Error('Impossible de créer le compte. Veuillez réessayer plus tard.');
    }
  },

  // Register étudiant spécifique
  async registerEtudiant(etudiantData) {
    try {
      const response = await httpService.post('/api/etudiants', etudiantData);
      if (response.status === 201) {
        return { success: true, message: response.data?.message || 'Étudiant créé avec succès' };
      }
      throw new Error('Erreur lors de la création de l\'étudiant');
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données de l\'étudiant invalides');
        }
      }
      throw new Error('Impossible de créer l\'étudiant. Veuillez réessayer plus tard.');
    }
  },

  async logout() {
    try {
      const response = await httpService.post('/api/logout', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Nettoyage du local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('etudiant');
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    } finally {
      // Redirection après le traitement, même en cas d'erreur
      window.location.href = '/login';
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getCurrentEtudiant() {
    const etudiant = localStorage.getItem('etudiant');
    return etudiant ? JSON.parse(etudiant) : null;
  }
};

export default authService;