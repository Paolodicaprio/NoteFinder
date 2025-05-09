import httpService from './api';

const noteService = {
  async fetchNotes() {
    try {
      const response = await httpService.get('/api/note', {
        params: {
          _: Date.now() // Cache buster
        },
        timeout: 10000 // 10 secondes timeout
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Format de données invalide');
      }
      
      return response.data;
      
    } catch (error) {
      let errorMessage = 'Erreur lors de la récupération des notes';
      
      if (error.response) {
        // Erreurs HTTP
        if (error.response.status === 500) {
          errorMessage = 'Erreur serveur (500) - Veuillez réessayer plus tard';
        } else if (error.response.status === 404) {
          errorMessage = 'Endpoint non trouvé (404)';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout - Le serveur a mis trop de temps à répondre';
      }
      
      console.error('Erreur fetchNotes:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.url
      });
      
      throw new Error(errorMessage);
    }
  },

  async addNote(noteData) {
    try {
      const response = await httpService.post('/api/note', noteData);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données de demande invalides');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la création de la note');
        }
      }
      throw new Error('Erreur lors de l\'ajout de la note');
    }
  },

  async deleteNote(id) {
    try {
      const response = await httpService.delete(`/api/note/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Note non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la suppression de la note');
        }
      }
      throw new Error('Erreur lors de la suppression de la note');
    }
  },

  async fetchNoteById(id) {
    try {
      const response = await httpService.get(`/api/note/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Note non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération de la note');
        }
      }
      throw new Error('Erreur lors de la récupération de la note');
    }
  },

  async updateNote(id, noteData) {
    try {
      const response = await httpService.put(`/api/note/${id}`, noteData);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Note non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la mise à jour de la note');
        }
      }
      throw new Error('Erreur lors de la mise à jour de la note');
    }
  },

  async saveScannedNotes(notesData) {
    try {
      const response = await httpService.post('/api/scanned_notes', notesData);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Données invalides');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la sauvegarde des notes');
        }
      }
      throw new Error('Erreur lors de la sauvegarde des notes');
    }
  },

  async fetchScannedNotes() {
    try {
      const response = await httpService.get('/api/scanned_notes');
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la récupération des notes scannées');
        }
      }
      throw new Error('Erreur lors de la récupération des notes scannées');
    }
  },

  async deleteScannedNote(id) {
    try {
      const response = await httpService.delete(`/api/scanned_notes/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Note scannée non trouvée');
        } else if (error.response.status === 500) {
          throw new Error('Erreur serveur lors de la suppression de la note');
        }
      }
      throw new Error('Erreur lors de la suppression de la note');
    }
  },


async getEcuesByUe(ueId) {
  try {
    const response = await httpService.get(`/api/ecues/by-ue/${ueId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Aucun ECUE trouvé pour cette UE');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de la récupération des ECUEs');
      }
    }
    throw new Error('Erreur lors de la récupération des ECUEs');
  }
},
};

export default noteService;