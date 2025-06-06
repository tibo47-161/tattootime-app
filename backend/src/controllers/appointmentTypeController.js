const { validationResult } = require('express-validator');
const AppointmentType = require('../models/AppointmentType');

// Alle Terminarten eines Benutzers abrufen
exports.getAppointmentTypes = async (req, res) => {
  try {
    const appointmentTypes = await AppointmentType.find({ user: req.user._id }).sort({ name: 1 });
    res.json(appointmentTypes);
  } catch (error) {
    console.error('Fehler beim Abrufen der Terminarten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Terminarten' });
  }
};

// Eine bestimmte Terminart abrufen
exports.getAppointmentType = async (req, res) => {
  try {
    const appointmentType = await AppointmentType.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'Terminart nicht gefunden' });
    }

    res.json(appointmentType);
  } catch (error) {
    console.error('Fehler beim Abrufen der Terminart:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Terminart' });
  }
};

// Neue Terminart erstellen
exports.createAppointmentType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, color, isPublic, duration } = req.body;

    // Neue Terminart erstellen
    const newAppointmentType = new AppointmentType({
      name,
      color,
      isPublic,
      duration,
      user: req.user._id
    });

    const savedAppointmentType = await newAppointmentType.save();
    res.status(201).json(savedAppointmentType);
  } catch (error) {
    console.error('Fehler beim Erstellen der Terminart:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Terminart' });
  }
};

// Terminart aktualisieren
exports.updateAppointmentType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, color, isPublic, duration } = req.body;

    // Prüfen, ob die Terminart existiert
    let appointmentType = await AppointmentType.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'Terminart nicht gefunden' });
    }

    // Terminart aktualisieren
    appointmentType.name = name || appointmentType.name;
    appointmentType.color = color || appointmentType.color;
    appointmentType.isPublic = isPublic !== undefined ? isPublic : appointmentType.isPublic;
    appointmentType.duration = duration || appointmentType.duration;

    const updatedAppointmentType = await appointmentType.save();
    res.json(updatedAppointmentType);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Terminart:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Terminart' });
  }
};

// Terminart löschen
exports.deleteAppointmentType = async (req, res) => {
  try {
    const appointmentType = await AppointmentType.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'Terminart nicht gefunden' });
    }

    await appointmentType.deleteOne();

    res.json({ message: 'Terminart erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Terminart:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen der Terminart' });
  }
};

