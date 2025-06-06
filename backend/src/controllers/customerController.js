const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');

// Alle Kunden eines Benutzers abrufen
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id }).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kunden:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Kunden' });
  }
};

// Einen bestimmten Kunden abrufen
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Fehler beim Abrufen des Kunden:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Kunden' });
  }
};

// Neuen Kunden erstellen
exports.createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, phone, notes } = req.body;

    // Prüfen, ob der Kunde bereits existiert
    const existingCustomer = await Customer.findOne({
      email,
      user: req.user._id
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Ein Kunde mit dieser E-Mail-Adresse existiert bereits' });
    }

    // Neuen Kunden erstellen
    const newCustomer = new Customer({
      name,
      email,
      phone,
      notes,
      user: req.user._id
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Fehler beim Erstellen des Kunden:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen des Kunden' });
  }
};

// Kunden aktualisieren
exports.updateCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, phone, notes } = req.body;

    // Prüfen, ob der Kunde existiert
    let customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden' });
    }

    // Prüfen, ob die E-Mail-Adresse bereits von einem anderen Kunden verwendet wird
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email,
        user: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({ message: 'Ein anderer Kunde verwendet bereits diese E-Mail-Adresse' });
      }
    }

    // Kunden aktualisieren
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone !== undefined ? phone : customer.phone;
    customer.notes = notes !== undefined ? notes : customer.notes;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Kunden' });
  }
};

// Kunden löschen
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden' });
    }

    // Prüfen, ob der Kunde noch Termine hat
    const appointments = await Appointment.find({
      customer: req.params.id,
      user: req.user._id
    });

    if (appointments.length > 0) {
      return res.status(400).json({
        message: 'Dieser Kunde hat noch Termine. Bitte löschen Sie zuerst die Termine oder entfernen Sie die Kundenzuordnung.'
      });
    }

    await customer.deleteOne();

    res.json({ message: 'Kunde erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Kunden' });
  }
};

// Termine eines Kunden abrufen
exports.getCustomerAppointments = async (req, res) => {
  try {
    // Prüfen, ob der Kunde existiert
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden' });
    }

    // Termine des Kunden abrufen
    const appointments = await Appointment.find({
      customer: req.params.id,
      user: req.user._id
    })
      .populate('appointmentType', 'name color')
      .sort({ start: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kundentermine:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Kundentermine' });
  }
};

