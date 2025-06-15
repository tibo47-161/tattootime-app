const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Initialisierung
admin.initializeApp();
const db = admin.firestore();

// Konfiguration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100 // Limit pro IP
};

// Express App Setup
const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors);
app.use(rateLimit(RATE_LIMIT));

// Logging Middleware (temporär zur Diagnose)
app.use((req, res, next) => {
  console.log('Received request for path:', req.path);
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Ungültiger Token' });
  }
};

// Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Interner Serverfehler',
    code: err.code
  });
};

// Admin Middleware
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Keine Berechtigung: Nur für Admins' });
  }
};

// Validierung
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Registrierung
app.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    
    // Überprüfen ob E-Mail bereits existiert
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'E-Mail bereits registriert' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Benutzer in Firestore speichern
    const userRef = await db.collection('users').add({
      email,
      name,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      message: 'Benutzer erfolgreich registriert',
      userId: userRef.id 
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Login
app.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Benutzer in Firestore suchen
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const user = snapshot.docs[0].data();
    
    // Passwort überprüfen
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign(
      { userId: snapshot.docs[0].id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: snapshot.docs[0].id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Termin erstellen
app.post('/appointments', authMiddleware, [
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('description').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, time, description } = req.body;
    
    // Überprüfen auf Terminüberschneidungen
    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 Stunde Dauer

    const overlappingAppointments = await db.collection('appointments')
      .where('userId', '==', req.user.userId)
      .where('date', '==', date)
      .get();

    for (const doc of overlappingAppointments.docs) {
      const appointment = doc.data();
      const appointmentStart = new Date(`${appointment.date}T${appointment.time}`);
      const appointmentEnd = new Date(appointmentStart.getTime() + 60 * 60 * 1000);

      if (startTime < appointmentEnd && endTime > appointmentStart) {
        return res.status(400).json({ error: 'Terminüberschneidung' });
      }
    }

    const appointmentRef = await db.collection('appointments').add({
      userId: req.user.userId,
      date,
      time,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      message: 'Termin erfolgreich erstellt',
      appointmentId: appointmentRef.id 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Termine abrufen mit Pagination
app.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const start = (page - 1) * limit;

    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef
      .where('userId', '==', req.user.userId)
      .orderBy('date', 'desc')
      .orderBy('time', 'desc')
      .limit(parseInt(limit))
      .offset(start)
      .get();
    
    const appointments = [];
    snapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Gesamtanzahl der Termine für Pagination
    const totalSnapshot = await appointmentsRef
      .where('userId', '==', req.user.userId)
      .count()
      .get();

    res.json({
      appointments,
      pagination: {
        total: totalSnapshot.data().count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSnapshot.data().count / limit)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Design erstellen
app.post('/designs', authMiddleware, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('imageUrl').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, imageUrl } = req.body;
    
    const designRef = await db.collection('designs').add({
      userId: req.user.userId,
      name,
      description,
      imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      message: 'Design erfolgreich erstellt',
      designId: designRef.id 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Designs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Designs abrufen mit Pagination
app.get('/designs', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const start = (page - 1) * limit;

    const designsRef = db.collection('designs');
    const snapshot = await designsRef
      .where('userId', '==', req.user.userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(start)
      .get();
    
    const designs = [];
    snapshot.forEach(doc => {
      designs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Gesamtanzahl der Designs für Pagination
    const totalSnapshot = await designsRef
      .where('userId', '==', req.user.userId)
      .count()
      .get();

    res.json({
      designs,
      pagination: {
        total: totalSnapshot.data().count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSnapshot.data().count / limit)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Designs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Design by ID abrufen
app.get('/designs/:id', authMiddleware, async (req, res) => {
  try {
    const designId = req.params.id;
    const designRef = db.collection('designs').doc(designId);
    const snapshot = await designRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Design nicht gefunden' });
    }

    const design = snapshot.data();
    res.json(design);
  } catch (error) {
    console.error('Fehler beim Abrufen des Designs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Design aktualisieren
app.put('/designs/:id', authMiddleware, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('imageUrl').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const designId = req.params.id;
    const { name, description, imageUrl } = req.body;
    
    const designRef = db.collection('designs').doc(designId);
    const snapshot = await designRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Design nicht gefunden' });
    }

    await designRef.update({
      name,
      description,
      imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Design erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Designs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Design löschen
app.delete('/designs/:id', authMiddleware, async (req, res) => {
  try {
    const designId = req.params.id;
    const designRef = db.collection('designs').doc(designId);
    const snapshot = await designRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Design nicht gefunden' });
    }

    await designRef.delete();
    res.status(200).json({ message: 'Design erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Designs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Admin: Alle Nutzer abrufen
app.get('/admin/users', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Nutzer:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Admin: Nutzerrolle ändern
app.post('/admin/users/:id/role', authMiddleware, checkAdmin, [
  body('role').isIn(['admin', 'user'])
], async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    const userRef = db.collection('users').doc(userId);
    const snapshot = await userRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    }

    await userRef.update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Nutzerrolle erfolgreich geändert' });
  } catch (error) {
    console.error('Fehler beim Ändern der Nutzerrolle:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Admin: Nutzer löschen
app.delete('/admin/users/:id', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = db.collection('users').doc(userId);
    const snapshot = await userRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    }

    await userRef.delete();
    res.status(200).json({ message: 'Nutzer erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Nutzers:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Token-Aktualisierung
app.post('/refresh-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token: newToken });
  } catch (error) {
    console.error('Token-Aktualisierungsfehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Aktuellen Benutzer abrufen
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.userId);
    const snapshot = await userRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    }

    const user = snapshot.data();
    res.json(user);
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Passwort vergessen
app.post('/forgot-password', async (req, res) => {
  // Implementierung des Passwort-Vergessens-Prozesses
  res.status(501).json({ error: 'Diese Funktion ist noch nicht implementiert' });
});

// Passwort zurücksetzen
app.post('/reset-password/:token', async (req, res) => {
  // Implementierung des Passwort-Zurücksetzens-Prozesses
  res.status(501).json({ error: 'Diese Funktion ist noch nicht implementiert' });
});

// Benutzereinstellungen aktualisieren
app.put('/settings', authMiddleware, async (req, res) => {
  // Implementierung der Nutzer-Einstellungen-Aktualisierung
  res.status(501).json({ error: 'Diese Funktion ist noch nicht implementiert' });
});

// Error Handler Middleware
app.use(errorHandler);

// Exportiere die Cloud Function mit Generation 2
exports.api = onRequest({
  memory: '256MiB',
  timeoutSeconds: 60,
  region: 'us-central1'
}, app); 