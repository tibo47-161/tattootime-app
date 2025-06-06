import api from './api';

// Alle Sperrzeiten abrufen
export const getBlockedTimes = async (params) => {
  try {
    const response = await api.get('/blocked-times', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Sperrzeiten');
  }
};

// Eine bestimmte Sperrzeit abrufen
export const getBlockedTime = async (id) => {
  try {
    const response = await api.get(`/blocked-times/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Sperrzeit');
  }
};

// Neue Sperrzeit erstellen
export const createBlockedTime = async (blockedTimeData) => {
  try {
    const response = await api.post('/blocked-times', blockedTimeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen der Sperrzeit');
  }
};

// Sperrzeit aktualisieren
export const updateBlockedTime = async (id, blockedTimeData) => {
  try {
    const response = await api.put(`/blocked-times/${id}`, blockedTimeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren der Sperrzeit');
  }
};

// Sperrzeit löschen
export const deleteBlockedTime = async (id) => {
  try {
    const response = await api.delete(`/blocked-times/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Löschen der Sperrzeit');
  }
};

export default {
  getBlockedTimes,
  getBlockedTime,
  createBlockedTime,
  updateBlockedTime,
  deleteBlockedTime
};

