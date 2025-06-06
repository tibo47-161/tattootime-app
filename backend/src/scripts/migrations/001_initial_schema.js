/**
 * Migration: 001_initial_schema.js
 * 
 * Erstellt das initiale Datenbankschema für TattooTime.
 */

const mongoose = require('mongoose');

module.exports = {
  up: async () => {
    // Diese Migration erstellt keine Tabellen, da Mongoose die Schemas automatisch erstellt,
    // wenn die Modelle zum ersten Mal verwendet werden.
    // Stattdessen können wir hier Indizes erstellen oder andere Optimierungen vornehmen.
    
    // Indizes für die User-Collection erstellen
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Indizes für die Appointments-Collection erstellen
    await mongoose.connection.collection('appointments').createIndex({ userId: 1 });
    await mongoose.connection.collection('appointments').createIndex({ start: 1, end: 1 });
    await mongoose.connection.collection('appointments').createIndex({ confirmationToken: 1 }, { sparse: true });
    await mongoose.connection.collection('appointments').createIndex({ cancellationToken: 1 }, { sparse: true });
    
    // Indizes für die AppointmentTypes-Collection erstellen
    await mongoose.connection.collection('appointmenttypes').createIndex({ userId: 1 });
    
    // Indizes für die Customers-Collection erstellen
    await mongoose.connection.collection('customers').createIndex({ userId: 1 });
    await mongoose.connection.collection('customers').createIndex({ email: 1 });
    
    // Indizes für die WorkingHours-Collection erstellen
    await mongoose.connection.collection('workinghours').createIndex({ userId: 1, day: 1 });
    
    // Indizes für die BlockedTimes-Collection erstellen
    await mongoose.connection.collection('blockedtimes').createIndex({ userId: 1 });
    await mongoose.connection.collection('blockedtimes').createIndex({ start: 1, end: 1 });
    
    console.log('Initial schema created successfully.');
  },
  
  down: async () => {
    // Indizes entfernen
    await mongoose.connection.collection('users').dropIndex({ email: 1 });
    
    await mongoose.connection.collection('appointments').dropIndex({ userId: 1 });
    await mongoose.connection.collection('appointments').dropIndex({ start: 1, end: 1 });
    await mongoose.connection.collection('appointments').dropIndex({ confirmationToken: 1 });
    await mongoose.connection.collection('appointments').dropIndex({ cancellationToken: 1 });
    
    await mongoose.connection.collection('appointmenttypes').dropIndex({ userId: 1 });
    
    await mongoose.connection.collection('customers').dropIndex({ userId: 1 });
    await mongoose.connection.collection('customers').dropIndex({ email: 1 });
    
    await mongoose.connection.collection('workinghours').dropIndex({ userId: 1, day: 1 });
    
    await mongoose.connection.collection('blockedtimes').dropIndex({ userId: 1 });
    await mongoose.connection.collection('blockedtimes').dropIndex({ start: 1, end: 1 });
    
    console.log('Initial schema rolled back successfully.');
  }
};

