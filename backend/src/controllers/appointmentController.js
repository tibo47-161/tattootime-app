const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const AppointmentType = require('../models/AppointmentType');

// Alle Termine eines Benutzers abrufen
exports.getAppointments = async (req, res) => {
  try {
    // Optionale Filter für Start- und Enddatum
    const { start, end } = req.query;
    const filter = { user: req.user._id };

    if (start) {
      filter.start = { $gte: new Date(start) };
    }

    if (end) {
      filter.end = { $lte: new Date(end) };
    }

    const appointments = await Appointment.find(filter)
      .populate('appointmentType', 'name color')
      .populate('customer', 'name email')
      .sort({ start: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Termine' });
  }
};

// Einen bestimmten Termin abrufen
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('appointmentType', 'name color')
      .populate('customer', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Fehler beim Abrufen des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Termins' });
  }
};

// Neuen Termin erstellen
exports.createAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      start,
      end,
      appointmentType,
      customer,
      notes,
      isPrivate,
      tattooDetails
    } = req.body;

    // Prüfen, ob der Termintyp existiert
    if (appointmentType) {
      const typeExists = await AppointmentType.findOne({
        _id: appointmentType,
        user: req.user._id
      });

      if (!typeExists) {
        return res.status(404).json({ message: 'Termintyp nicht gefunden' });
      }
    }

    // Prüfen, ob der Kunde existiert
    if (customer) {
      const customerExists = await Customer.findOne({
        _id: customer,
        user: req.user._id
      });

      if (!customerExists) {
        return res.status(404).json({ message: 'Kunde nicht gefunden' });
      }
    }

    // Neuen Termin erstellen
    const newAppointment = new Appointment({
      title,
      start: new Date(start),
      end: new Date(end),
      appointmentType,
      customer,
      notes,
      isPrivate,
      tattooDetails,
      user: req.user._id
    });

    const savedAppointment = await newAppointment.save();

    // Termin mit Beziehungen zurückgeben
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('appointmentType', 'name color')
      .populate('customer', 'name email');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen des Termins' });
  }
};

// Termin aktualisieren
exports.updateAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      start,
      end,
      appointmentType,
      customer,
      notes,
      isPrivate,
      tattooDetails
    } = req.body;

    // Prüfen, ob der Termin existiert
    let appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }

    // Prüfen, ob der Termintyp existiert
    if (appointmentType) {
      const typeExists = await AppointmentType.findOne({
        _id: appointmentType,
        user: req.user._id
      });

      if (!typeExists) {
        return res.status(404).json({ message: 'Termintyp nicht gefunden' });
      }
    }

    // Prüfen, ob der Kunde existiert
    if (customer) {
      const customerExists = await Customer.findOne({
        _id: customer,
        user: req.user._id
      });

      if (!customerExists) {
        return res.status(404).json({ message: 'Kunde nicht gefunden' });
      }
    }

    // Termin aktualisieren
    appointment.title = title || appointment.title;
    if (start) appointment.start = new Date(start);
    if (end) appointment.end = new Date(end);
    appointment.appointmentType = appointmentType || appointment.appointmentType;
    appointment.customer = customer || appointment.customer;
    appointment.notes = notes !== undefined ? notes : appointment.notes;
    appointment.isPrivate = isPrivate !== undefined ? isPrivate : appointment.isPrivate;
    
    if (tattooDetails) {
      appointment.tattooDetails = {
        ...appointment.tattooDetails,
        ...tattooDetails
      };
    }

    const updatedAppointment = await appointment.save();

    // Termin mit Beziehungen zurückgeben
    const populatedAppointment = await Appointment.findById(updatedAppointment._id)
      .populate('appointmentType', 'name color')
      .populate('customer', 'name email');

    res.json(populatedAppointment);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Termins' });
  }
};

// Termin löschen
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }

    await appointment.deleteOne();

    res.json({ message: 'Termin erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Termins' });
  }
};

// Termine für den Kalender abrufen
exports.getCalendarAppointments = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'Start- und Enddatum sind erforderlich' });
    }

    const appointments = await Appointment.find({
      user: req.user._id,
      start: { $gte: new Date(start) },
      end: { $lte: new Date(end) }
    })
      .populate('appointmentType', 'name color')
      .populate('customer', 'name email')
      .sort({ start: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalendertermine:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Kalendertermine' });
  }
};

