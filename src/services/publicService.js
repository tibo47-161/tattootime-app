import api from './api';

/**
 * Holt das öffentliche Profil eines Benutzers
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Object>} - Benutzerprofil
 */
export const getUserPublicProfile = async (userId) => {
  try {
    const response = await api.get(`/api/public/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Laden des Benutzerprofils');
  }
};

/**
 * Holt verfügbare Zeitfenster für einen Benutzer
 * @param {string} userId - ID des Benutzers
 * @param {Object} params - Parameter für die Anfrage
 * @param {string} params.start - Startdatum (ISO-String)
 * @param {string} params.end - Enddatum (ISO-String)
 * @returns {Promise<Array>} - Liste der verfügbaren Zeitfenster
 */
export const getAvailableSlots = async (userId, params) => {
  try {
    const response = await api.get(`/api/public/users/${userId}/available-slots`, { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Laden der verfügbaren Zeitfenster');
  }
};

/**
 * Erstellt eine neue Buchung
 * @param {Object} bookingData - Daten für die Buchung
 * @returns {Promise<Object>} - Erstellte Buchung
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/api/public/bookings', bookingData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen der Buchung');
  }
};

/**
 * Bestätigt eine Buchung mit einem Token
 * @param {string} token - Bestätigungstoken
 * @returns {Promise<Object>} - Bestätigte Buchung
 */
export const confirmBooking = async (token) => {
  try {
    const response = await api.post(`/api/public/bookings/confirm/${token}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler bei der Bestätigung der Buchung');
  }
};

/**
 * Storniert eine Buchung mit einem Token
 * @param {string} token - Stornierungstoken
 * @returns {Promise<Object>} - Stornierte Buchung
 */
export const cancelBooking = async (token) => {
  try {
    const response = await api.post(`/api/public/bookings/cancel/${token}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler bei der Stornierung der Buchung');
  }
};

/**
 * Holt Informationen zu einer Buchung mit einem Token
 * @param {string} token - Buchungstoken
 * @returns {Promise<Object>} - Buchungsinformationen
 */
export const getBookingByToken = async (token) => {
  try {
    const response = await api.get(`/api/public/bookings/${token}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Laden der Buchungsinformationen');
  }
};

