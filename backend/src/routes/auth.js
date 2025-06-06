const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, refreshToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrierung eines neuen Benutzers
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').isEmail(),
    check('password', 'Bitte gib ein Passwort mit mindestens 6 Zeichen ein').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authentifizierung eines Benutzers & Token erhalten
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').isEmail(),
    check('password', 'Passwort ist erforderlich').exists()
  ],
  authController.login
);

// @route   POST /api/auth/refresh-token
// @desc    Aktualisierung des Access-Tokens mit einem Refresh-Token
// @access  Public
router.post('/refresh-token', refreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Passwort-Reset-Link anfordern
// @access  Public
router.post(
  '/forgot-password',
  [
    check('email', 'Bitte gib eine gültige E-Mail-Adresse ein').isEmail()
  ],
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password/:resetToken
// @desc    Passwort mit Token zurücksetzen
// @access  Public
router.post(
  '/reset-password/:resetToken',
  [
    check('password', 'Bitte gib ein Passwort mit mindestens 6 Zeichen ein').isLength({ min: 6 })
  ],
  authController.resetPassword
);

// @route   GET /api/auth/me
// @desc    Aktuellen Benutzer abrufen
// @access  Private
router.get('/me', protect, authController.getCurrentUser);

// @route   PUT /api/auth/settings
// @desc    Benutzereinstellungen aktualisieren
// @access  Private
router.put(
  '/settings',
  protect,
  [
    check('settings', 'Einstellungen müssen ein Objekt sein').optional().isObject(),
    check('name', 'Name muss ein String sein').optional().isString()
  ],
  authController.updateSettings
);

module.exports = router;

