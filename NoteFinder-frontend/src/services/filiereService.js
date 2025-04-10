// src/services/filiereService.js
import httpService from './api';

export const fetchFilieres = async (filters = {}) => {
  try {
    const response = await httpService.get('/api/filieres', { params: filters });
    // Transformer le tableau de tableaux en tableau d'objets
    const transformedData = response.data.map(item => ({
      id: item[0],
      code: item[1],
      nom: item[2],
      mention: item[3],
      domaine: item[4]
    }));
    return transformedData;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la récupération des filières');
      }
    }
    throw new Error('Erreur lors de la récupération des filières');
  }
};

export const addFiliere = async (filiereData) => {
  try {
    const response = await httpService.post('/api/filieres', filiereData);
    if (response.status === 201) {
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error('Données de requête invalides');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la création de la filière');
      }
    }
    throw new Error('Erreur lors de l\'ajout de la filière');
  }
};

export const deleteFiliere = async (id) => {
  try {
    const response = await httpService.delete(`/api/filieres/${id}`);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Filière non trouvée');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la suppression de la filière');
      }
    }
    throw new Error('Erreur lors de la suppression de la filière');
  }
};

export const getFiliereById = async (id) => {
  try {
    const response = await httpService.get(`/api/filieres/${id}`);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Filière non trouvée');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la récupération de la filière');
      }
    }
    throw new Error('Erreur lors de la récupération de la filière');
  }
};

export const updateFiliere = async (id, filiereData) => {
  try {
    const response = await httpService.put(`/api/filieres/${id}`, filiereData);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Filière non trouvée');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la mise à jour de la filière');
      }
    }
    throw new Error('Erreur lors de la mise à jour de la filière');
  }
};