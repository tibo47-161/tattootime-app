import axios from 'axios';

// API-Basis-URL aus der Umgebungsvariable oder Standard-URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios-Instanz mit Basis-URL erstellen
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request-Interceptor für das Hinzufügen des Auth-Tokens
api.interceptors.request.use(
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

// Response-Interceptor für die Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Wenn der Fehler 401 (Unauthorized) ist und es noch kein Retry gab
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Versuche, das Token zu aktualisieren
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Kein Refresh-Token vorhanden, Benutzer ausloggen
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Token aktualisieren
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        // Neues Token speichern
        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);

        // Ursprüngliche Anfrage mit neuem Token wiederholen
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token-Aktualisierung fehlgeschlagen, Benutzer ausloggen
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

