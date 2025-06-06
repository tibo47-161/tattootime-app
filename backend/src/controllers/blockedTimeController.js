const { validationResult } = require('express-validator');
const BlockedTime = require('../models/BlockedTime');

// Alle Sperrzeiten eines Benutzers abrufen
exports.getBlockedTimes = async (req, res) => {
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

    const blockedTimes = await BlockedTime.find(filter).sort({ start: 1 });
    res.json(blockedTimes);
  } catch (error) {
    console.error('Fehler beim Abrufen der Sperrzeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Sperrzeiten' });
  }
};

// Eine bestimmte Sperrzeit abrufen
exports.getBlockedTime = async (req, res) => {
  try {
    const blockedTime = await BlockedTime.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!blockedTime) {
      return res.status(404).json({ message: 'Sperrzeit nicht gefunden' });
    }

    res.json(blockedTime);
  } catch (error) {
    console.error('Fehler beim Abrufen der Sperrzeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Sperrzeit' });
  }
};

// Neue Sperrzeit erstellen
exports.createBlockedTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, start, end, reason } = req.body;

    // Prüfen, ob die Endzeit nach der Startzeit liegt
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      return res.status(400).json({ message: 'Die Endzeit muss nach der Startzeit liegen.' });
    }

    // Neue Sperrzeit erstellen
    const newBlockedTime = new BlockedTime({
      title,
      start: startDate,
      end: endDate,
      reason,
      user: req.user._id
    });

    const savedBlockedTime = await newBlockedTime.save();
    res.status(201).json(savedBlockedTime);
  } catch (error) {
    console.error('Fehler beim Erstellen der Sperrzeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Sperrzeit' });
  }
};

// Sperrzeit aktualisieren
exports.updateBlockedTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, start, end, reason } = req.body;

    // Prüfen, ob die Sperrzeit existiert
    let blockedTime = await BlockedTime.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!blockedTime) {
      return res.status(404).json({ message: 'Sperrzeit nicht gefunden' });
    }

    // Wenn Start- oder Endzeit geändert werden, prüfen, ob die Endzeit nach der Startzeit liegt
    if (start || end) {
      const startDate = start ? new Date(start) : blockedTime.start;
      const endDate = end ? new Date(end) : blockedTime.end;

      if (startDate >= endDate) {
        return res.status(400).json({ message: 'Die Endzeit muss nach der Startzeit liegen.' });
      }
    }

    // Sperrzeit aktualisieren
    if (title) blockedTime.title = title;
    if (start) blockedTime.start = new Date(start);
    if (end) blockedTime.end = new Date(end);
    if (reason !== undefined) blockedTime.reason = reason;

    const updatedBlockedTime = await blockedTime.save();
    res.json(updatedBlockedTime);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Sperrzeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Sperrzeit' });
  }
};

// Sperrzeit löschen
exports.deleteBlockedTime = async (req, res) => {
  try {
    const blockedTime = await BlockedTime.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!blockedTime) {
      return res.status(404).json({ message: 'Sperrzeit nicht gefunden' });
    }

    await blockedTime.deleteOne();

    res.json({ message: 'Sperrzeit erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Sperrzeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen der Sperrzeit' });
  }
};

