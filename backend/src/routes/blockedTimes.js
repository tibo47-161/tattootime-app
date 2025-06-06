const express = require('express');
const { check } = require('express-validator');
const blockedTimeController = require('../controllers/blockedTimeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen sind geschützt
router.use(protect);

// @route   GET /api/blocked-times
// @desc    Alle Sperrzeiten eines Benutzers abrufen
// @access  Private
router.get('/', blockedTimeController.getBlockedTimes);

// @route   GET /api/blocked-times/:id
// @desc    Eine bestimmte Sperrzeit abrufen
// @access  Private
router.get('/:id', blockedTimeController.getBlockedTime);

// @route   POST /api/blocked-times
// @desc    Neue Sperrzeit erstellen
// @access  Private
router.post(
  '/',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('start', 'Startzeit ist erforderlich').not().isEmpty().isISO8601(),
    check('end', 'Endzeit ist erforderlich').not().isEmpty().isISO8601()
  ],
  blockedTimeController.createBlockedTime
);

// @route   PUT /api/blocked-times/:id
// @desc    Sperrzeit aktualisieren
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Titel ist erforderlich').optional().not().isEmpty(),
    check('start', 'Startzeit muss ein gültiges Datum sein').optional().isISO8601(),
    check('end', 'Endzeit muss ein gültiges Datum sein').optional().isISO8601()
  ],
  blockedTimeController.updateBlockedTime
);

// @route   DELETE /api/blocked-times/:id
// @desc    Sperrzeit löschen
// @access  Private
router.delete('/:id', blockedTimeController.deleteBlockedTime);

module.exports = router;

