const express = require('express');
const { check } = require('express-validator');
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen sind geschützt
router.use(protect);

// @route   GET /api/customers
// @desc    Alle Kunden eines Benutzers abrufen
// @access  Private
router.get('/', customerController.getCustomers);

// @route   GET /api/customers/:id
// @desc    Einen bestimmten Kunden abrufen
// @access  Private
router.get('/:id', customerController.getCustomer);

// @route   POST /api/customers
// @desc    Neuen Kunden erstellen
// @access  Private
router.post(
  '/',
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').isEmail()
  ],
  customerController.createCustomer
);

// @route   PUT /api/customers/:id
// @desc    Kunden aktualisieren
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name ist erforderlich').optional().not().isEmpty(),
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').optional().isEmail()
  ],
  customerController.updateCustomer
);

// @route   DELETE /api/customers/:id
// @desc    Kunden löschen
// @access  Private
router.delete('/:id', customerController.deleteCustomer);

// @route   GET /api/customers/:id/appointments
// @desc    Termine eines Kunden abrufen
// @access  Private
router.get('/:id/appointments', customerController.getCustomerAppointments);

module.exports = router;

