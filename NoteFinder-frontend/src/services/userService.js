import httpService from './api';

export default {
    async getUsers(filterParams = {}) {
        try {
            const response = await httpService.get('/api/users', { params: filterParams });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw new Error('Impossible de récupérer les utilisateurs. Veuillez réessayer plus tard.');
        }
    },

    async getRoles() {
        try {
            const response = await httpService.get('/api/roles');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des rôles:', error);
            throw new Error('Impossible de récupérer les rôles. Veuillez réessayer plus tard.');
        }
    },

    async addUser(userData) {
        try {
            const response = await httpService.post('/api/users', userData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
            throw new Error('Impossible d\'ajouter l\'utilisateur. Veuillez réessayer plus tard.');
        }
    },

    async updateUser(id, userData) {
        try {
            const response = await httpService.put(`/api/users/${id}`, userData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            throw new Error('Impossible de mettre à jour l\'utilisateur. Veuillez réessayer plus tard.');
        }
    },

    async deleteUser(id) {
        try {
            await httpService.delete(`/api/users/${id}`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            throw new Error('Impossible de supprimer l\'utilisateur. Veuillez réessayer plus tard.');
        }
    },
};