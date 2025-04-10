// src/services/parcourService.js
import httpService from './api';

const parcourService = {
  async getParcours() {
    try {
      const response = await httpService.get('/api/parcours_etudiant');
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération des parcours étudiants');
        }
      }
      throw new Error('Impossible de récupérer les parcours. Veuillez réessayer plus tard.');
    }
  },

  async getParcoursById(id) {
    try {
      const response = await httpService.get(`/api/parcours_etudiant/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Parcours étudiant non trouvé');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération du parcours étudiant');
        }
      }
      throw new Error('Impossible de récupérer ce parcours. Veuillez réessayer plus tard.');
    }
  },

  async addParcoursEtudiant(parcoursData) {
    try {
      const response = await httpService.post('/api/parcours_etudiant', parcoursData);
      if (response.status === 201) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données de requête invalides');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la création du parcours étudiant');
        }
      }
      throw new Error('Impossible de créer le parcours étudiant. Veuillez réessayer plus tard.');
    }
  },

  async deleteParcours(id) {
    try {
      const response = await httpService.delete(`/api/parcours_etudiant/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Parcours étudiant non trouvé');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la suppression du parcours étudiant');
        }
      }
      throw new Error('Impossible de supprimer ce parcours. Veuillez réessayer plus tard.');
    }
  },

  async updateParcoursEtudiant(id, parcoursData) {
    try {
      const response = await httpService.put(`/api/parcours_etudiant/${id}`, parcoursData);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Parcours étudiant non trouvé');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la mise à jour du parcours étudiant');
        }
      }
      throw new Error('Impossible de mettre à jour ce parcours. Veuillez réessayer plus tard.');
    }
  },
};

export default parcourService;