const express = require('express');
const { check } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen sind geschützt
router.use(protect);

// @route   GET /api/appointments
// @desc    Alle Termine eines Benutzers abrufen
// @access  Private
router.get('/', appointmentController.getAppointments);

// @route   GET /api/appointments/calendar
// @desc    Termine für den Kalender abrufen
// @access  Private
router.get('/calendar', appointmentController.getCalendarAppointments);

// @route   GET /api/appointments/:id
// @desc    Einen bestimmten Termin abrufen
// @access  Private
router.get('/:id', appointmentController.getAppointment);

// @route   POST /api/appointments
// @desc    Neuen Termin erstellen
// @access  Private
router.post(
  '/',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('start', 'Startzeit ist erforderlich').not().isEmpty(),
    check('end', 'Endzeit ist erforderlich').not().isEmpty()
  ],
  appointmentController.createAppointment
);

// @route   PUT /api/appointments/:id
// @desc    Termin aktualisieren
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Titel ist erforderlich').optional().not().isEmpty(),
    check('start', 'Startzeit muss ein gültiges Datum sein').optional().isISO8601(),
    check('end', 'Endzeit muss ein gültiges Datum sein').optional().isISO8601()
  ],
  appointmentController.updateAppointment
);

// @route   DELETE /api/appointments/:id
// @desc    Termin löschen
// @access  Private
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;

