import api from './api';

// Alle Termintypen abrufen
export const getAppointmentTypes = async () => {
  try {
    const response = await api.get('/appointment-types');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Termintypen');
  }
};

// Einen bestimmten Termintyp abrufen
export const getAppointmentType = async (id) => {
  try {
    const response = await api.get(`/appointment-types/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen des Termintyps');
  }
};

// Neuen Termintyp erstellen
export const createAppointmentType = async (typeData) => {
  try {
    const response = await api.post('/appointment-types', typeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen des Termintyps');
  }
};

// Termintyp aktualisieren
export const updateAppointmentType = async (id, typeData) => {
  try {
    const response = await api.put(`/appointment-types/${id}`, typeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren des Termintyps');
  }
};

// Termintyp löschen
export const deleteAppointmentType = async (id) => {
  try {
    const response = await api.delete(`/appointment-types/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Löschen des Termintyps');
  }
};

export default {
  getAppointmentTypes,
  getAppointmentType,
  createAppointmentType,
  updateAppointmentType,
  deleteAppointmentType
};

