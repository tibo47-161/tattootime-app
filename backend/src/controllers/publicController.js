const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');
const AppointmentType = require('../models/AppointmentType');
const Customer = require('../models/Customer');
const WorkingHours = require('../models/WorkingHours');
const BlockedTime = require('../models/BlockedTime');
const User = require('../models/User');

// Verfügbare Zeitfenster für ein bestimmtes Datum abrufen
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, userId } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Datum ist erforderlich' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Benutzer-ID ist erforderlich' });
    }

    // Benutzer abrufen
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Datum parsen
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Ungültiges Datumsformat' });
    }

    // Wochentag ermitteln (0 = Sonntag, 6 = Samstag)
    const dayOfWeek = selectedDate.getDay();

    // Arbeitszeiten für diesen Wochentag abrufen
    const workingHours = await WorkingHours.find({
      user: userId,
      dayOfWeek,
      isForTattoo: true
    }).sort({ start: 1 });

    if (workingHours.length === 0) {
      return res.json({ message: 'Keine Arbeitszeiten für diesen Tag definiert', slots: [] });
    }

    // Start- und Endzeit des Tages setzen
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Bestehende Termine für diesen Tag abrufen
    const appointments = await Appointment.find({
      user: userId,
      start: { $gte: startOfDay },
      end: { $lte: endOfDay }
    });

    // Sperrzeiten für diesen Tag abrufen
    const blockedTimes = await BlockedTime.find({
      user: userId,
      start: { $lte: endOfDay },
      end: { $gte: startOfDay }
    });

    // Öffentlich buchbare Terminarten abrufen
    const appointmentTypes = await AppointmentType.find({
      user: userId,
      isPublic: true
    });

    if (appointmentTypes.length === 0) {
      return res.json({ message: 'Keine öffentlich buchbaren Terminarten definiert', slots: [] });
    }

    // Standarddauer für Termine (in Minuten)
    const defaultDuration = 60;

    // Verfügbare Zeitfenster berechnen
    const availableSlots = [];

    for (const workingHour of workingHours) {
      // Start- und Endzeit der Arbeitszeit parsen
      const [startHour, startMinute] = workingHour.start.split(':').map(Number);
      const [endHour, endMinute] = workingHour.end.split(':').map(Number);

      // Start- und Endzeit für diesen Arbeitszeitblock setzen
      const blockStart = new Date(selectedDate);
      blockStart.setHours(startHour, startMinute, 0, 0);

      const blockEnd = new Date(selectedDate);
      blockEnd.setHours(endHour, endMinute, 0, 0);

      // Zeitfenster in 30-Minuten-Schritten generieren
      const slotDuration = 30; // in Minuten
      let currentSlotStart = new Date(blockStart);

      while (currentSlotStart < blockEnd) {
        const currentSlotEnd = new Date(currentSlotStart);
        currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + slotDuration);

        // Prüfen, ob das Zeitfenster innerhalb der Arbeitszeit liegt
        if (currentSlotEnd <= blockEnd) {
          // Prüfen, ob das Zeitfenster mit bestehenden Terminen kollidiert
          const isOverlappingWithAppointment = appointments.some(appointment => {
            return (
              (currentSlotStart >= appointment.start && currentSlotStart < appointment.end) ||
              (currentSlotEnd > appointment.start && currentSlotEnd <= appointment.end) ||
              (currentSlotStart <= appointment.start && currentSlotEnd >= appointment.end)
            );
          });

          // Prüfen, ob das Zeitfenster mit Sperrzeiten kollidiert
          const isOverlappingWithBlockedTime = blockedTimes.some(blockedTime => {
            return (
              (currentSlotStart >= blockedTime.start && currentSlotStart < blockedTime.end) ||
              (currentSlotEnd > blockedTime.start && currentSlotEnd <= blockedTime.end) ||
              (currentSlotStart <= blockedTime.start && currentSlotEnd >= blockedTime.end)
            );
          });

          // Wenn das Zeitfenster nicht kollidiert, hinzufügen
          if (!isOverlappingWithAppointment && !isOverlappingWithBlockedTime) {
            availableSlots.push({
              start: currentSlotStart,
              end: currentSlotEnd
            });
          }
        }

        // Zum nächsten Zeitfenster springen
        currentSlotStart = new Date(currentSlotEnd);
      }
    }

    res.json({
      date: selectedDate,
      slots: availableSlots,
      appointmentTypes
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der verfügbaren Zeitfenster:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der verfügbaren Zeitfenster' });
  }
};

// Termin buchen
exports.bookAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      email,
      start,
      end,
      appointmentTypeId,
      tattooDetails,
      userId
    } = req.body;

    // Benutzer abrufen
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Terminart abrufen und prüfen, ob sie öffentlich buchbar ist
    const appointmentType = await AppointmentType.findOne({
      _id: appointmentTypeId,
      user: userId,
      isPublic: true
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'Terminart nicht gefunden oder nicht öffentlich buchbar' });
    }

    // Start- und Endzeit parsen
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ message: 'Ungültiges Zeitformat' });
    }

    // Prüfen, ob die Endzeit nach der Startzeit liegt
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'Die Endzeit muss nach der Startzeit liegen' });
    }

    // Prüfen, ob der Termin in der Zukunft liegt
    const now = new Date();
    if (startTime <= now) {
      return res.status(400).json({ message: 'Der Termin muss in der Zukunft liegen' });
    }

    // Wochentag ermitteln (0 = Sonntag, 6 = Samstag)
    const dayOfWeek = startTime.getDay();

    // Prüfen, ob der Termin innerhalb der Arbeitszeiten liegt
    const workingHours = await WorkingHours.find({
      user: userId,
      dayOfWeek,
      isForTattoo: true
    });

    let isWithinWorkingHours = false;
    for (const workingHour of workingHours) {
      const [startHour, startMinute] = workingHour.start.split(':').map(Number);
      const [endHour, endMinute] = workingHour.end.split(':').map(Number);

      const workingStart = new Date(startTime);
      workingStart.setHours(startHour, startMinute, 0, 0);

      const workingEnd = new Date(startTime);
      workingEnd.setHours(endHour, endMinute, 0, 0);

      if (startTime >= workingStart && endTime <= workingEnd) {
        isWithinWorkingHours = true;
        break;
      }
    }

    if (!isWithinWorkingHours) {
      return res.status(400).json({ message: 'Der Termin liegt außerhalb der Arbeitszeiten' });
    }

    // Prüfen, ob der Termin mit bestehenden Terminen kollidiert
    const conflictingAppointments = await Appointment.find({
      user: userId,
      $or: [
        { start: { $lt: endTime, $gte: startTime } },
        { end: { $gt: startTime, $lte: endTime } },
        { start: { $lte: startTime }, end: { $gte: endTime } }
      ]
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({ message: 'Der Termin kollidiert mit einem bestehenden Termin' });
    }

    // Prüfen, ob der Termin mit Sperrzeiten kollidiert
    const conflictingBlockedTimes = await BlockedTime.find({
      user: userId,
      $or: [
        { start: { $lt: endTime, $gte: startTime } },
        { end: { $gt: startTime, $lte: endTime } },
        { start: { $lte: startTime }, end: { $gte: endTime } }
      ]
    });

    if (conflictingBlockedTimes.length > 0) {
      return res.status(400).json({ message: 'Der Termin kollidiert mit einer Sperrzeit' });
    }

    // Prüfen, ob der Kunde bereits existiert
    let customer = await Customer.findOne({
      email,
      user: userId
    });

    // Wenn der Kunde nicht existiert, einen neuen erstellen
    if (!customer) {
      customer = new Customer({
        name,
        email,
        user: userId
      });
      await customer.save();
    }

    // Token für Stornierung generieren
    const bookingToken = crypto.randomBytes(20).toString('hex');

    // Termin erstellen
    const appointment = new Appointment({
      title: `Tattoo: ${name}`,
      start: startTime,
      end: endTime,
      appointmentType: appointmentTypeId,
      customer: customer._id,
      tattooDetails,
      isPrivate: false,
      user: userId,
      bookingToken
    });

    await appointment.save();

    // E-Mail-Bestätigung senden
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const cancelUrl = `${process.env.FRONTEND_URL}/cancel-appointment/${bookingToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Terminbestätigung',
      text: `Hallo ${name},

Vielen Dank für deine Terminbuchung. Dein Termin wurde erfolgreich gebucht.

Termindetails:
Datum: ${startTime.toLocaleDateString()}
Uhrzeit: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}
Terminart: ${appointmentType.name}

Um deinen Termin zu stornieren, klicke bitte auf den folgenden Link:
${cancelUrl}

Bei Fragen stehe ich dir gerne zur Verfügung.

Viele Grüße,
${user.name}`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'Termin erfolgreich gebucht',
      appointment: {
        start: appointment.start,
        end: appointment.end,
        appointmentType: appointmentType.name
      }
    });
  } catch (error) {
    console.error('Fehler beim Buchen des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Buchen des Termins' });
  }
};

// Öffentlich buchbare Terminarten abrufen
exports.getPublicAppointmentTypes = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'Benutzer-ID ist erforderlich' });
    }

    const appointmentTypes = await AppointmentType.find({
      user: userId,
      isPublic: true
    }).sort({ name: 1 });

    res.json(appointmentTypes);
  } catch (error) {
    console.error('Fehler beim Abrufen der Terminarten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Terminarten' });
  }
};

// Termin stornieren
exports.cancelAppointment = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token ist erforderlich' });
    }

    // Termin anhand des Tokens suchen
    const appointment = await Appointment.findOne({ bookingToken: token });

    if (!appointment) {
      return res.status(404).json({ message: 'Termin nicht gefunden oder bereits storniert' });
    }

    // Prüfen, ob der Termin in der Zukunft liegt
    const now = new Date();
    if (appointment.start <= now) {
      return res.status(400).json({ message: 'Vergangene Termine können nicht storniert werden' });
    }

    // Kunde und Benutzer abrufen
    const customer = await Customer.findById(appointment.customer);
    const user = await User.findById(appointment.user);

    if (!customer || !user) {
      return res.status(404).json({ message: 'Kunde oder Benutzer nicht gefunden' });
    }

    // Termin löschen
    await appointment.deleteOne();

    // Stornierungsbestätigung per E-Mail senden
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: 'Terminbestätigung',
      text: `Hallo ${customer.name},

Dein Termin wurde erfolgreich storniert.

Termindetails:
Datum: ${appointment.start.toLocaleDateString()}
Uhrzeit: ${appointment.start.toLocaleTimeString()} - ${appointment.end.toLocaleTimeString()}

Bei Fragen stehe ich dir gerne zur Verfügung.

Viele Grüße,
${user.name}`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Termin erfolgreich storniert' });
  } catch (error) {
    console.error('Fehler beim Stornieren des Termins:', error);
    res.status(500).json({ message: 'Serverfehler beim Stornieren des Termins' });
  }
};

