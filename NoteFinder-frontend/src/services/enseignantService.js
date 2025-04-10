import httpService from './api';

// Fonction pour transformer la réponse de l'API en objet plus lisible
const transformEnseignant = (enseignantArray) => {
  if (!enseignantArray || !Array.isArray(enseignantArray)) return null;
  return {
    id: enseignantArray[0],
    nom: enseignantArray[1],
    prenom: enseignantArray[2],
    email: enseignantArray[3],
    telephone: enseignantArray[4],
    specialite: enseignantArray[5]
  };
};

export const fetchEnseignants = async (filters = {}) => {
  try {
    const response = await httpService.get('/api/enseignant', { params: filters });
    return response.data.map(transformEnseignant).filter(Boolean);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des enseignants');
  }
};

export const fetchEnseignantById = async (id) => {
  try {
    const response = await httpService.get(`/api/enseignant/${id}`);
    return transformEnseignant(response.data);
  } catch (error) {
    throw new Error(
      error.response?.status === 404 
        ? 'Enseignant non trouvé' 
        : error.response?.data?.message || 'Erreur lors de la récupération de l\'enseignant'
    );
  }
};

export const addEnseignant = async (enseignantData) => {
  try {
    const response = await httpService.post('/api/enseignant', {
      email: enseignantData.email,
      nom: enseignantData.nom,
      prenom: enseignantData.prenom,
      specialite: enseignantData.specialite,
      telephone: enseignantData.telephone
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Données invalides: ' + (error.response.data.message || 'Vérifiez les champs'));
    }
    throw new Error('Erreur lors de l\'ajout de l\'enseignant');
  }
};

export const updateEnseignant = async (id, enseignantData) => {
  try {
    const response = await httpService.put(`/api/enseignant/${id}`, [
      enseignantData.nom,
      enseignantData.prenom,
      enseignantData.email,
      enseignantData.telephone,
      enseignantData.specialite
    ]);
    return transformEnseignant(response.data);
  } catch (error) {
    throw new Error(
      error.response?.status === 404 
        ? 'Enseignant non trouvé'
        : error.response?.status === 400 
          ? 'Données invalides: ' + (error.response.data.message || 'Vérifiez les champs')
          : error.response?.data?.message || 'Erreur lors de la mise à jour de l\'enseignant'
    );
  }
};

export const deleteEnseignant = async (id) => {
  try {
    await httpService.delete(`/api/enseignant/${id}`);
    return id;
  } catch (error) {
    throw new Error(
      error.response?.status === 404 
        ? 'Enseignant non trouvé'
        : error.response?.data?.message || 'Erreur lors de la suppression de l\'enseignant'
    );
  }
};