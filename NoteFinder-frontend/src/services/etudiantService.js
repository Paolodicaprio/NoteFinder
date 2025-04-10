import httpService from './api';


const handleServiceError = (error, defaultMessage) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        throw new Error(error.response.data?.message || 'Données invalides');
      case 404:
        throw new Error('Étudiant non trouvé');
      case 500:
        throw new Error('Erreur serveur');
      default:
        throw new Error(error.response.data?.message || defaultMessage);
    }
  } else if (error.request) {
    throw new Error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
  } else {
    throw new Error(defaultMessage);
  }
};

export const fetchEtudiants = async () => {
  try {
    const response = await httpService.get('/api/etudiants');
    return response.data; 
  } catch (error) {
    throw new Error('Erreur lors de la récupération des étudiants');
  }
};

export const loginEtudiant = async (credentials) => {
  try {
    const response = await httpService.post('/api/etudiants/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Matricule ou code incorrect');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la connexion');
      }
    }
    throw new Error('Erreur lors de la connexion');
  }
};

export const addEtudiant = async (etudiantData) => {
  try {
    const response = await httpService.post('/api/etudiants', etudiantData);
    if (response.status === 201) {
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error('Données de demande invalides');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de l\'ajout de l\'étudiant');
      }
    }
    throw new Error('Erreur lors de l\'ajout de l\'étudiant');
  }
};

export const deleteEtudiant = async (matricule) => {
  try {
    if (!matricule) {
      throw new Error('Le matricule est requis');
    }

    const { data } = await httpService.delete(`/api/etudiants/${matricule}`);
    
    if (!data) {
      throw new Error('Réponse vide du serveur');
    }

    return data;
  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });

    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error('Données de requête invalides');
        case 404:
          throw new Error('Étudiant non trouvé');
        case 500:
          throw new Error(`Erreur serveur: ${error.response.data?.message || 'Veuillez réessayer plus tard'}`);
        default:
          throw new Error(`Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur lors de la suppression'}`);
      }
    } else if (error.request) {
      throw new Error('Pas de réponse du serveur - vérifiez votre connexion');
    } else {
      throw new Error('Erreur de configuration de la requête');
    }
  }
};

export const getEtudiantByMatricule = async (matricule) => {
  try {
    const { data } = await httpService.get(`/api/etudiants/${matricule}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la récupération de l\'étudiant');
  }
};

export const updateEtudiant = async (matricule, etudiantData) => {
  try {
    const { data } = await httpService.put(`/api/etudiants/${matricule}`, etudiantData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la mise à jour de l\'étudiant');
  }
};