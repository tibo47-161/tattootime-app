const express = require('express');
const { check } = require('express-validator');
const workingHoursController = require('../controllers/workingHoursController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen sind geschützt
router.use(protect);

// @route   GET /api/working-hours
// @desc    Alle Arbeitszeiten eines Benutzers abrufen
// @access  Private
router.get('/', workingHoursController.getWorkingHours);

// @route   GET /api/working-hours/day/:day
// @desc    Arbeitszeiten für einen bestimmten Wochentag abrufen
// @access  Private
router.get('/day/:day', workingHoursController.getWorkingHoursByDay);

// @route   POST /api/working-hours
// @desc    Neue Arbeitszeit erstellen
// @access  Private
router.post(
  '/',
  [
    check('dayOfWeek', 'Wochentag ist erforderlich und muss zwischen 0 und 6 liegen').isInt({ min: 0, max: 6 }),
    check('start', 'Startzeit ist erforderlich').not().isEmpty(),
    check('end', 'Endzeit ist erforderlich').not().isEmpty()
  ],
  workingHoursController.createWorkingHours
);

// @route   PUT /api/working-hours/:id
// @desc    Arbeitszeit aktualisieren
// @access  Private
router.put(
  '/:id',
  [
    check('dayOfWeek', 'Wochentag muss zwischen 0 und 6 liegen').optional().isInt({ min: 0, max: 6 }),
    check('start', 'Startzeit muss im Format HH:MM sein').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check('end', 'Endzeit muss im Format HH:MM sein').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  ],
  workingHoursController.updateWorkingHours
);

// @route   DELETE /api/working-hours/:id
// @desc    Arbeitszeit löschen
// @access  Private
router.delete('/:id', workingHoursController.deleteWorkingHours);

module.exports = router;

