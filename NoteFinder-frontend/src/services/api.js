import axios from 'axios';

const httpService = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT aux requêtes
httpService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales
httpService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Rediriger vers la page de login
          window.location.href = '/login';
          break;
        case 500:
          // Rediriger vers une page d'erreur serveur
          window.location.href = '/server-error';
          break;
        default:
          // Gestion des autres erreurs
          console.error('Erreur inattendue :', error.response.status);
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default httpService;