import axios from 'axios';

// API-Basis-URL für Firebase Functions
const API_URL = '/api';

// Axios-Instanz mit Basis-URL erstellen
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 Sekunden Timeout
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
    console.error('Request error:', error);
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Versuche, das Token zu aktualisieren
        const response = await api.post('/auth/refresh-token', { refreshToken });
        const { token } = response.data;
        
        // Neues Token speichern
        localStorage.setItem('token', token);

        // Ursprüngliche Anfrage mit neuem Token wiederholen
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Token-Aktualisierung fehlgeschlagen, Benutzer ausloggen
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Andere Fehler behandeln
    if (error.response) {
      // Server hat mit einem Fehlerstatus geantwortet
      console.error('API error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Anfrage wurde gesendet, aber keine Antwort erhalten
      console.error('Network error:', error.request);
      return Promise.reject(new Error('Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'));
    } else {
      // Fehler beim Erstellen der Anfrage
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;

