import api from './api';

// Login-Funktion
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login fehlgeschlagen');
  }
};

// Token aktualisieren
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Token-Aktualisierung fehlgeschlagen');
  }
};

// Passwort zurücksetzen anfordern
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Passwort-Zurücksetzung fehlgeschlagen');
  }
};

// Passwort zurücksetzen
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Passwort-Zurücksetzung fehlgeschlagen');
  }
};

// Aktuellen Benutzer abrufen
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Benutzerinformationen konnten nicht abgerufen werden');
  }
};

// Benutzereinstellungen aktualisieren
export const updateSettings = async (settings) => {
  try {
    const response = await api.put('/auth/settings', { settings });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Einstellungen konnten nicht aktualisiert werden');
  }
};

export default {
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateSettings
};

