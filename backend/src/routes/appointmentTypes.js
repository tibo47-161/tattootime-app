const express = require('express');
const { check } = require('express-validator');
const appointmentTypeController = require('../controllers/appointmentTypeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen sind geschützt
router.use(protect);

// @route   GET /api/appointment-types
// @desc    Alle Terminarten eines Benutzers abrufen
// @access  Private
router.get('/', appointmentTypeController.getAppointmentTypes);

// @route   GET /api/appointment-types/:id
// @desc    Eine bestimmte Terminart abrufen
// @access  Private
router.get('/:id', appointmentTypeController.getAppointmentType);

// @route   POST /api/appointment-types
// @desc    Neue Terminart erstellen
// @access  Private
router.post(
  '/',
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('color', 'Farbe ist erforderlich').not().isEmpty(),
    check('duration', 'Dauer muss eine Zahl sein').isNumeric()
  ],
  appointmentTypeController.createAppointmentType
);

// @route   PUT /api/appointment-types/:id
// @desc    Terminart aktualisieren
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name ist erforderlich').optional().not().isEmpty(),
    check('color', 'Farbe ist erforderlich').optional().not().isEmpty(),
    check('duration', 'Dauer muss eine Zahl sein').optional().isNumeric()
  ],
  appointmentTypeController.updateAppointmentType
);

// @route   DELETE /api/appointment-types/:id
// @desc    Terminart löschen
// @access  Private
router.delete('/:id', appointmentTypeController.deleteAppointmentType);

module.exports = router;

