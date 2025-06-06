const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Hilfsfunktion zum Generieren eines JWT-Tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });
};

// Hilfsfunktion zum Generieren eines Refresh-Tokens
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION
  });
};

// Registrierung eines neuen Benutzers
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;

  try {
    // Prüfen, ob der Benutzer bereits existiert
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'Benutzer existiert bereits' });
    }

    // Neuen Benutzer erstellen
    user = new User({
      email,
      password,
      name
    });

    // Benutzer speichern
    await user.save();

    // Token generieren
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
};

// Login eines Benutzers
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Benutzer in der Datenbank suchen
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Token generieren
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      settings: user.settings,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
};

// Passwort vergessen
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Benutzer in der Datenbank suchen
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Token für Passwort-Reset generieren
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Stunde gültig

    await user.save();

    // E-Mail mit Reset-Link senden
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // E-Mail-Transporter konfigurieren
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // E-Mail-Optionen
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Passwort zurücksetzen',
      text: `Du erhältst diese E-Mail, weil du (oder jemand anderes) das Zurücksetzen des Passworts für dein Konto beantragt hast.\n\n
        Bitte klicke auf den folgenden Link oder füge ihn in deinen Browser ein, um den Vorgang abzuschließen:\n\n
        ${resetUrl}\n\n
        Wenn du dies nicht beantragt hast, ignoriere diese E-Mail bitte und dein Passwort bleibt unverändert.\n`
    };

    // E-Mail senden
    await transporter.sendMail(mailOptions);

    res.json({ message: 'E-Mail zum Zurücksetzen des Passworts wurde gesendet' });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500).json({ message: 'Serverfehler beim Zurücksetzen des Passworts' });
  }
};

// Passwort zurücksetzen
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Token aus den Parametern holen und hashen
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  try {
    // Benutzer mit gültigem Token suchen
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Ungültiger oder abgelaufener Token' });
    }

    // Neues Passwort setzen
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Token generieren
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ message: 'Serverfehler beim Zurücksetzen des Passworts' });
  }
};

// Benutzereinstellungen aktualisieren
exports.updateSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Einstellungen aktualisieren
    if (req.body.settings) {
      user.settings = {
        ...user.settings,
        ...req.body.settings
      };
    }

    // Name aktualisieren, falls vorhanden
    if (req.body.name) {
      user.name = req.body.name;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      settings: user.settings
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Einstellungen' });
  }
};

// Aktuellen Benutzer abrufen
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Benutzers' });
  }
};

