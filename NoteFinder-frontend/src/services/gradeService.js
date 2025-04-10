// src/services/gradeService.js
import httpService from './api';

// Fonction utilitaire pour gérer les erreurs
const handleServiceError = (error, defaultMessage) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        throw new Error(error.response.data?.message || 'Données invalides');
      case 404:
        throw new Error('Grade non trouvé');
      case 500:
        throw new Error('Erreur serveur');
      default:
        throw new Error(defaultMessage);
    }
  }
  throw new Error(error.message || defaultMessage);
};

export const fetchGrades = async () => {
  try {
    const response = await httpService.get('/api/grades');
    
    // Le backend retourne [[1, "Licence"], [2, "Master"]]
    // On transforme en [{id: 1, nom: "Licence"}, {id: 2, nom: "Master"}]
    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item[0],
        nom: item[1]
      }));
    }
    
    throw new Error('Format de données inattendu');
  } catch (error) {
    console.error('Erreur fetchGrades:', {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

export const addGrade = async (gradeData) => {
  try {
    if (!gradeData?.nom) {
      throw new Error('Le nom du grade est requis');
    }

    const { data } = await httpService.post('/api/grades', gradeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de l\'ajout du grade');
  }
};

export const deleteGrade = async (id) => {
  try {
    if (!id) {
      throw new Error('ID du grade requis');
    }

    const { data } = await httpService.delete(`/api/grades/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la suppression du grade');
  }
};

export const getGradeById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID du grade requis');
    }

    const { data } = await httpService.get(`/api/grades/${id}`);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la récupération du grade');
  }
};

export const updateGrade = async (id, gradeData) => {
  try {
    if (!id || !gradeData?.nom) {
      throw new Error('ID et nom du grade requis');
    }

    const { data } = await httpService.put(`/api/grades/${id}`, gradeData);
    return data;
  } catch (error) {
    handleServiceError(error, 'Échec de la mise à jour du grade');
  }
};