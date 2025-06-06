import api from './api';

// Alle Kunden abrufen
export const getCustomers = async () => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Kunden');
  }
};

// Einen bestimmten Kunden abrufen
export const getCustomer = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen des Kunden');
  }
};

// Termine eines Kunden abrufen
export const getCustomerAppointments = async (id) => {
  try {
    const response = await api.get(`/customers/${id}/appointments`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Kundentermine');
  }
};

// Neuen Kunden erstellen
export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Erstellen des Kunden');
  }
};

// Kunden aktualisieren
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Aktualisieren des Kunden');
  }
};

// Kunden löschen
export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Fehler beim Löschen des Kunden');
  }
};

export default {
  getCustomers,
  getCustomer,
  getCustomerAppointments,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

