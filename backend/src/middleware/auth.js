const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware zur Überprüfung des JWT-Tokens
exports.protect = async (req, res, next) => {
  let token;

  // Token aus dem Authorization-Header extrahieren
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Prüfen, ob ein Token vorhanden ist
  if (!token) {
    return res.status(401).json({ message: 'Nicht autorisiert, kein Token vorhanden' });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Benutzer aus der Datenbank abrufen
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' });
    }

    // Benutzer zum Request-Objekt hinzufügen
    req.user = user;
    next();
  } catch (error) {
    console.error('Token-Fehler:', error);
    return res.status(401).json({ message: 'Nicht autorisiert, ungültiger Token' });
  }
};

// Middleware zur Aktualisierung des Tokens
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh-Token ist erforderlich' });
  }

  try {
    // Refresh-Token verifizieren
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Neuen Access-Token generieren
    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh-Token-Fehler:', error);
    return res.status(401).json({ message: 'Ungültiger Refresh-Token' });
  }
};

