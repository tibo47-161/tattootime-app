import api from './api';

// Alle Arbeitszeiten abrufen
export const getWorkingHours = async () => {
  try {
    const response = await api.get('/working-hours');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Arbeitszeiten');
  }
};

// Arbeitszeiten für einen bestimmten Wochentag abrufen
export const getWorkingHoursByDay = async (day) => {
  try {
    const response = await api.get(`/working-hours/day/${day}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Arbeitszeiten');
  }
};

// Neue Arbeitszeit erstellen
export const createWorkingHours = async (workingHoursData) => {
  try {
    const response = await api.post('/working-hours', workingHoursData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen der Arbeitszeit');
  }
};

// Arbeitszeit aktualisieren
export const updateWorkingHours = async (id, workingHoursData) => {
  try {
    const response = await api.put(`/working-hours/${id}`, workingHoursData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren der Arbeitszeit');
  }
};

// Arbeitszeit löschen
export const deleteWorkingHours = async (id) => {
  try {
    const response = await api.delete(`/working-hours/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Löschen der Arbeitszeit');
  }
};

export default {
  getWorkingHours,
  getWorkingHoursByDay,
  createWorkingHours,
  updateWorkingHours,
  deleteWorkingHours
};

