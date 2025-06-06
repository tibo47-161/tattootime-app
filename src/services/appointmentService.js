import api from './api';

// Alle Termine abrufen
export const getAppointments = async (params) => {
  try {
    const response = await api.get('/appointments', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Termine');
  }
};

// Termine für den Kalender abrufen
export const getCalendarAppointments = async (start, end) => {
  try {
    const response = await api.get('/appointments/calendar', {
      params: { start, end }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Kalendertermine');
  }
};

// Einen bestimmten Termin abrufen
export const getAppointment = async (id) => {
  try {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen des Termins');
  }
};

// Neuen Termin erstellen
export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen des Termins');
  }
};

// Termin aktualisieren
export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren des Termins');
  }
};

// Termin löschen
export const deleteAppointment = async (id) => {
  try {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Löschen des Termins');
  }
};

export default {
  getAppointments,
  getCalendarAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
};

