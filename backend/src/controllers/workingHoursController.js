const { validationResult } = require('express-validator');
const WorkingHours = require('../models/WorkingHours');

// Alle Arbeitszeiten eines Benutzers abrufen
exports.getWorkingHours = async (req, res) => {
  try {
    const workingHours = await WorkingHours.find({ user: req.user._id }).sort({ dayOfWeek: 1, start: 1 });
    res.json(workingHours);
  } catch (error) {
    console.error('Fehler beim Abrufen der Arbeitszeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Arbeitszeiten' });
  }
};

// Arbeitszeiten für einen bestimmten Wochentag abrufen
exports.getWorkingHoursByDay = async (req, res) => {
  try {
    const dayOfWeek = parseInt(req.params.day);
    
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'Ungültiger Wochentag. Muss zwischen 0 (Sonntag) und 6 (Samstag) liegen.' });
    }

    const workingHours = await WorkingHours.find({
      user: req.user._id,
      dayOfWeek
    }).sort({ start: 1 });

    res.json(workingHours);
  } catch (error) {
    console.error('Fehler beim Abrufen der Arbeitszeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Arbeitszeiten' });
  }
};

// Neue Arbeitszeit erstellen
exports.createWorkingHours = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { dayOfWeek, start, end, isForTattoo } = req.body;

    // Prüfen, ob die Zeiten im richtigen Format sind
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      return res.status(400).json({ message: 'Ungültiges Zeitformat. Verwende HH:MM (z.B. 09:00).' });
    }

    // Prüfen, ob die Endzeit nach der Startzeit liegt
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      return res.status(400).json({ message: 'Die Endzeit muss nach der Startzeit liegen.' });
    }

    // Prüfen, ob sich die neue Arbeitszeit mit bestehenden Arbeitszeiten überschneidet
    const existingWorkingHours = await WorkingHours.find({
      user: req.user._id,
      dayOfWeek
    });

    for (const existing of existingWorkingHours) {
      const [existingStartHour, existingStartMinute] = existing.start.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = existing.end.split(':').map(Number);

      // Prüfen auf Überschneidung
      const startOverlaps = (startHour > existingStartHour || (startHour === existingStartHour && startMinute >= existingStartMinute)) &&
                           (startHour < existingEndHour || (startHour === existingEndHour && startMinute < existingEndMinute));
      
      const endOverlaps = (endHour > existingStartHour || (endHour === existingStartHour && endMinute > existingStartMinute)) &&
                         (endHour < existingEndHour || (endHour === existingEndHour && endMinute <= existingEndMinute));
      
      const encompasses = (startHour < existingStartHour || (startHour === existingStartHour && startMinute <= existingStartMinute)) &&
                         (endHour > existingEndHour || (endHour === existingEndHour && endMinute >= existingEndMinute));

      if (startOverlaps || endOverlaps || encompasses) {
        return res.status(400).json({ message: 'Die neue Arbeitszeit überschneidet sich mit einer bestehenden Arbeitszeit.' });
      }
    }

    // Neue Arbeitszeit erstellen
    const newWorkingHours = new WorkingHours({
      dayOfWeek,
      start,
      end,
      isForTattoo: isForTattoo !== undefined ? isForTattoo : true,
      user: req.user._id
    });

    const savedWorkingHours = await newWorkingHours.save();
    res.status(201).json(savedWorkingHours);
  } catch (error) {
    console.error('Fehler beim Erstellen der Arbeitszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Arbeitszeit' });
  }
};

// Arbeitszeit aktualisieren
exports.updateWorkingHours = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { dayOfWeek, start, end, isForTattoo } = req.body;

    // Prüfen, ob die Arbeitszeit existiert
    let workingHours = await WorkingHours.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!workingHours) {
      return res.status(404).json({ message: 'Arbeitszeit nicht gefunden' });
    }

    // Wenn Start- oder Endzeit geändert werden, Format prüfen
    if (start || end) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      
      if (start && !timeRegex.test(start)) {
        return res.status(400).json({ message: 'Ungültiges Startzeit-Format. Verwende HH:MM (z.B. 09:00).' });
      }
      
      if (end && !timeRegex.test(end)) {
        return res.status(400).json({ message: 'Ungültiges Endzeit-Format. Verwende HH:MM (z.B. 09:00).' });
      }

      // Prüfen, ob die Endzeit nach der Startzeit liegt
      const startToCheck = start || workingHours.start;
      const endToCheck = end || workingHours.end;
      
      const [startHour, startMinute] = startToCheck.split(':').map(Number);
      const [endHour, endMinute] = endToCheck.split(':').map(Number);
      
      if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
        return res.status(400).json({ message: 'Die Endzeit muss nach der Startzeit liegen.' });
      }

      // Prüfen, ob sich die aktualisierte Arbeitszeit mit bestehenden Arbeitszeiten überschneidet
      const dayToCheck = dayOfWeek !== undefined ? dayOfWeek : workingHours.dayOfWeek;
      
      const existingWorkingHours = await WorkingHours.find({
        user: req.user._id,
        dayOfWeek: dayToCheck,
        _id: { $ne: req.params.id }
      });

      for (const existing of existingWorkingHours) {
        const [existingStartHour, existingStartMinute] = existing.start.split(':').map(Number);
        const [existingEndHour, existingEndMinute] = existing.end.split(':').map(Number);

        // Prüfen auf Überschneidung
        const startOverlaps = (startHour > existingStartHour || (startHour === existingStartHour && startMinute >= existingStartMinute)) &&
                             (startHour < existingEndHour || (startHour === existingEndHour && startMinute < existingEndMinute));
        
        const endOverlaps = (endHour > existingStartHour || (endHour === existingStartHour && endMinute > existingStartMinute)) &&
                           (endHour < existingEndHour || (endHour === existingEndHour && endMinute <= existingEndMinute));
        
        const encompasses = (startHour < existingStartHour || (startHour === existingStartHour && startMinute <= existingStartMinute)) &&
                           (endHour > existingEndHour || (endHour === existingEndHour && endMinute >= existingEndMinute));

        if (startOverlaps || endOverlaps || encompasses) {
          return res.status(400).json({ message: 'Die aktualisierte Arbeitszeit überschneidet sich mit einer bestehenden Arbeitszeit.' });
        }
      }
    }

    // Arbeitszeit aktualisieren
    if (dayOfWeek !== undefined) workingHours.dayOfWeek = dayOfWeek;
    if (start) workingHours.start = start;
    if (end) workingHours.end = end;
    if (isForTattoo !== undefined) workingHours.isForTattoo = isForTattoo;

    const updatedWorkingHours = await workingHours.save();
    res.json(updatedWorkingHours);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Arbeitszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Arbeitszeit' });
  }
};

// Arbeitszeit löschen
exports.deleteWorkingHours = async (req, res) => {
  try {
    const workingHours = await WorkingHours.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!workingHours) {
      return res.status(404).json({ message: 'Arbeitszeit nicht gefunden' });
    }

    await workingHours.deleteOne();

    res.json({ message: 'Arbeitszeit erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Arbeitszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen der Arbeitszeit' });
  }
};

