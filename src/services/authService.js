import api from './api';

// Login-Funktion mit verbesserter Fehlerbehandlung
export const login = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });
    const { token, refreshToken, user } = response.data;
    
    // Token im localStorage speichern
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    
    return { user, token };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Login fehlgeschlagen');
  }
};

// Token-Aktualisierung mit verbesserter Fehlerbehandlung
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post('/refresh-token', { refreshToken });
    const { token } = response.data;
    
    // Neues Token speichern
    localStorage.setItem('token', token);
    
    return { token };
  } catch (error) {
    console.error('Token refresh error:', error);
    // Bei Fehler: Token entfernen und neu anmelden
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw new Error('Sitzung abgelaufen. Bitte erneut anmelden.');
  }
};

// Aktuellen Benutzer abrufen
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/profile');
    return response.data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Benutzerdaten');
  }
};

// Passwort vergessen
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(error.response?.data?.message || 'Fehler beim Anfordern des Passwort-Resets');
  }
};

// Passwort zurücksetzen
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(error.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts');
  }
};

// Benutzereinstellungen aktualisieren
export const updateSettings = async (settings) => {
  try {
    const response = await api.put('/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Update settings error:', error);
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren der Einstellungen');
  }
};

// Logout-Funktion
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

export default {
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateSettings,
  logout
};

