/**
 * Datenbank-Initialisierungsskript für TattooTime
 * Dieses Skript erstellt die notwendigen Indizes und Standarddaten
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Modelle importieren
const User = require('../models/User');
const AppointmentType = require('../models/AppointmentType');
const WorkingHours = require('../models/WorkingHours');

// Umgebungsvariablen laden
dotenv.config();

async function initializeDatabase() {
  try {
    console.log('🔄 Verbinde mit MongoDB...');
    
    // Verbindung zur Datenbank
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Verbindung zur MongoDB hergestellt');

    // Indizes erstellen
    console.log('🔄 Erstelle Datenbank-Indizes...');
    
    // User-Indizes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    // Appointment-Indizes
    await mongoose.connection.db.collection('appointments').createIndex({ 
      userId: 1, 
      startTime: 1 
    });
    await mongoose.connection.db.collection('appointments').createIndex({ 
      userId: 1, 
      endTime: 1 
    });
    
    // Customer-Indizes
    await mongoose.connection.db.collection('customers').createIndex({ 
      userId: 1, 
      email: 1 
    });
    
    console.log('✅ Indizes erstellt');

    // Standard-Termintypen erstellen
    console.log('🔄 Erstelle Standard-Termintypen...');
    
    const defaultAppointmentTypes = [
      {
        name: 'Beratung',
        color: '#3B82F6', // Blau
        duration: 60,
        isBookableOnline: true,
        description: 'Beratungsgespräch für neues Tattoo'
      },
      {
        name: 'Tattoo Klein',
        color: '#10B981', // Grün
        duration: 120,
        isBookableOnline: true,
        description: 'Kleines Tattoo (bis 5cm)'
      },
      {
        name: 'Tattoo Groß',
        color: '#F59E0B', // Orange
        duration: 240,
        isBookableOnline: false,
        description: 'Großes Tattoo (über 5cm)'
      },
      {
        name: 'Nachstechen',
        color: '#8B5CF6', // Lila
        duration: 90,
        isBookableOnline: false,
        description: 'Nachbearbeitung bestehender Tattoos'
      },
      {
        name: 'Privat',
        color: '#EF4444', // Rot
        duration: 60,
        isBookableOnline: false,
        description: 'Privater Termin'
      },
      {
        name: 'Arbeit (Jugendhilfe)',
        color: '#6B7280', // Grau
        duration: 480,
        isBookableOnline: false,
        description: 'Arbeit in der Jugendhilfe'
      }
    ];

    // Prüfen, ob bereits Termintypen existieren
    const existingTypes = await AppointmentType.countDocuments();
    if (existingTypes === 0) {
      await AppointmentType.insertMany(defaultAppointmentTypes);
      console.log('✅ Standard-Termintypen erstellt');
    } else {
      console.log('ℹ️  Termintypen bereits vorhanden');
    }

    // Standard-Arbeitszeiten erstellen
    console.log('🔄 Erstelle Standard-Arbeitszeiten...');
    
    const defaultWorkingHours = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorkingDay: true }, // Montag
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isWorkingDay: true }, // Dienstag
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isWorkingDay: true }, // Mittwoch
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isWorkingDay: true }, // Donnerstag
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00', isWorkingDay: true }, // Freitag
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', isWorkingDay: false }, // Samstag
      { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false }  // Sonntag
    ];

    // Prüfen, ob bereits Arbeitszeiten existieren
    const existingHours = await WorkingHours.countDocuments();
    if (existingHours === 0) {
      await WorkingHours.insertMany(defaultWorkingHours);
      console.log('✅ Standard-Arbeitszeiten erstellt');
    } else {
      console.log('ℹ️  Arbeitszeiten bereits vorhanden');
    }

    console.log('🎉 Datenbank-Initialisierung abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Fehler bei der Datenbank-Initialisierung:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Datenbankverbindung geschlossen');
  }
}

// Skript ausführen, wenn direkt aufgerufen
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;

