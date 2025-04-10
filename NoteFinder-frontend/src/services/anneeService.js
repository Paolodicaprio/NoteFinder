import httpService from './api';

const handleServiceError = (error, defaultMessage) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        throw new Error('Données de requête invalides');
      case 404:
        throw new Error('Ressource non trouvée');
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
// Années académiques
export const fetchAnneesAcademiques = async () => {
  try {
    const response = await httpService.get('/api/annees-academiques');
    
    // Vérifiez d'abord si la réponse est un tableau
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si la réponse est encapsulée dans un objet {data: [...]}
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    throw new Error('Format de données inattendu');
    
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch academic years');
  }
};

export const addAnneeAcademique = async (anneeData) => {
  try {
    if (!anneeData?.annee) {
      throw new Error('Le champ "annee" est requis');
    }

    const { data } = await httpService.post('/api/annees-academiques', anneeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de l\'ajout de l\'année académique');
  }
};

export const deleteAnneeAcademique = async (id) => {
  try {
    if (!id) {
      throw new Error('ID est requis');
    }

    const { data } = await httpService.delete(`/api/annees-academiques/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la suppression de l\'année académique');
  }
};

export const getAnneeAcademiqueById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID est requis');
    }

    const { data } = await httpService.get(`/api/annees-academiques/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la récupération de l\'année académique');
  }
};

export const updateAnneeAcademique = async (id, anneeData) => {
  try {
    if (!id || !anneeData?.annee) {
      throw new Error('ID et champ "annee" sont requis');
    }

    const { data } = await httpService.put(`/api/annees-academiques/${id}`, anneeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la mise à jour de l\'année académique');
  }
};

// Années d'étude
export const fetchAnneesEtude = async () => {
  try {
    const { data } = await httpService.get('/api/annees-etude');
    return data || [];
  } catch (error) {
    handleServiceError(error, 'Échec du chargement des années d\'étude');
  }
};

export const addAnneeEtude = async (anneeEtudeData) => {
  try {
    if (!anneeEtudeData) {
      throw new Error('Données requises');
    }

    const { data } = await httpService.post('/api/annees-etude', anneeEtudeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de l\'ajout de l\'année d\'étude');
  }
};

export const deleteAnneeEtude = async (id) => {
  try {
    if (!id) {
      throw new Error('ID est requis');
    }

    const { data } = await httpService.delete(`/api/annees-etude/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la suppression de l\'année d\'étude');
  }
};

export const getAnneeEtudeById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID est requis');
    }

    const { data } = await httpService.get(`/api/annees-etude/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la récupération de l\'année d\'étude');
  }
};

export const updateAnneeEtude = async (id, anneeEtudeData) => {
  try {
    if (!id || !anneeEtudeData) {
      throw new Error('ID et données sont requis');
    }

    const { data } = await httpService.put(`/api/annees-etude/${id}`, anneeEtudeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la mise à jour de l\'année d\'étude');
  }
};

export const fetchAnneesEtudeByFiliereId = async (filiereId) => {
  try {
    if (!filiereId) {
      throw new Error('ID de filière est requis');
    }

    const { data } = await httpService.get(`/api/annees-etude/filiere/${filiereId}`);
    return data || [];
  } catch (error) {
    handleServiceError(error, 'Échec du chargement des années d\'étude par filière');
  }
};