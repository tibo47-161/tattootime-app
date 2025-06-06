const express = require('express');
const { check } = require('express-validator');
const publicController = require('../controllers/publicController');

const router = express.Router();

// @route   GET /api/public/available-slots
// @desc    Verfügbare Zeitfenster für ein bestimmtes Datum abrufen
// @access  Public
router.get('/available-slots', publicController.getAvailableSlots);

// @route   POST /api/public/book-appointment
// @desc    Termin buchen
// @access  Public
router.post(
  '/book-appointment',
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').isEmail(),
    check('start', 'Startzeit ist erforderlich').not().isEmpty().isISO8601(),
    check('end', 'Endzeit ist erforderlich').not().isEmpty().isISO8601(),
    check('appointmentTypeId', 'Terminart-ID ist erforderlich').not().isEmpty(),
    check('userId', 'Benutzer-ID ist erforderlich').not().isEmpty()
  ],
  publicController.bookAppointment
);

// @route   GET /api/public/appointment-types
// @desc    Öffentlich buchbare Terminarten abrufen
// @access  Public
router.get('/appointment-types', publicController.getPublicAppointmentTypes);

// @route   GET /api/public/appointment/:token/cancel
// @desc    Termin stornieren
// @access  Public
router.get('/appointment/:token/cancel', publicController.cancelAppointment);

module.exports = router;

