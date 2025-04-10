import httpService from './api';

const offreService = {
  // Unités d'enseignement (UE)
  async getUes() {
    try {
      const response = await httpService.get('/api/ue');
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération des UE');
        }
      }
      throw new Error('Impossible de récupérer les UE. Veuillez réessayer plus tard.');
    }
  },

  async getUeById(id) {
    try {
      const response = await httpService.get(`/api/ue/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('UE non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération de l\'UE');
        }
      }
      throw new Error('Impossible de récupérer cette UE. Veuillez réessayer plus tard.');
    }
  },

  async addUe(ueData) {
    try {
      const response = await httpService.post('/api/ue', ueData);
      if (response.status === 201) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données de requête invalides');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la création de l\'UE');
        }
      }
      throw new Error('Impossible de créer l\'UE. Veuillez réessayer plus tard.');
    }
  },

  async deleteUe(id) {
    try {
      const response = await httpService.delete(`/api/ue/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('UE non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la suppression de l\'UE');
        }
      }
      throw new Error('Impossible de supprimer cette UE. Veuillez réessayer plus tard.');
    }
  },

  async updateUe(id, ueData) {
    try {
      const response = await httpService.put(`/api/ue/${id}`, ueData);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('UE non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la mise à jour de l\'UE');
        }
      }
      throw new Error('Impossible de mettre à jour cette UE. Veuillez réessayer plus tard.');
    }
  },

  // ECUEs
  async getEcues() {
    try {
      const response = await httpService.get('/api/ecues');
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération des ECUEs');
        }
      }
      throw new Error('Impossible de récupérer les ECUEs. Veuillez réessayer plus tard.');
    }
  },

  async getEcueById(id) {
    try {
      const response = await httpService.get(`/api/ecues/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('ECUE non trouvé');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération de l\'ECUE');
        }
      }
      throw new Error('Impossible de récupérer cet ECUE. Veuillez réessayer plus tard.');
    }
  },

  async addEcue(ecueData) {
    try {
      const response = await httpService.post('/api/ecues', ecueData);
      if (response.status === 201) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données de demande invalides');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la création de l\'ECUE');
        }
      }
      throw new Error('Impossible de créer cet ECUE. Veuillez réessayer plus tard.');
    }
  },

  async deleteEcue(id) {
    try {
      const response = await httpService.delete(`/api/ecues/${id}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('ECUE non trouvé');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la suppression de l\'ECUE');
        }
      }
      throw new Error('Impossible de supprimer cet ECUE. Veuillez réessayer plus tard.');
    }
  },

  async updateEcue(id, ecueData) {
    try {
      const response = await httpService.put(`/api/ecues/${id}`, ecueData);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('ECUE ou entité référencée non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la mise à jour de l\'ECUE');
        }
      }
      throw new Error('Impossible de mettre à jour cet ECUE. Veuillez réessayer plus tard.');
    }
  },
};

export default offreService;