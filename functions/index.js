const functions = require('firebase-functions');
const { onRequest } = require("firebase-functions/v2/https");
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Firebase Admin initialisieren
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Verbesserte CORS-Konfiguration
const corsOptions = {
  origin: [
    'https://tattootime.web.app',
    'https://tattootime.firebaseapp.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 Stunden
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Umgebungsvariablen aus Firebase Functions Config lesen
const config = functions.config();
const JWT_SECRET = config.jwt?.secret || 'tattootime-secret-key-2024';
const JWT_EXPIRES_IN = config.jwt?.expires_in || '7d';
const NODE_ENV = config.node?.env || 'production';

// Validierung Middleware
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
];

// Auth Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { ...userDoc.data(), id: userDoc.id };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/auth/register', validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Prüfe ob User bereits existiert
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Erstelle User
    const userRef = await db.collection('users').add({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generiere Token
    const token = jwt.sign(
      { userId: userRef.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: userRef.id,
        email,
        name,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Finde User
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Prüfe Password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generiere Token
    const token = jwt.sign(
      { userId: userDoc.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: userDoc.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Termine Routes
app.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const { date, time, service, notes } = req.body;
    const appointmentRef = await db.collection('appointments').add({
      userId: req.user.id,
      date,
      time,
      service,
      notes,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      id: appointmentRef.id,
      date,
      time,
      service,
      notes,
      status: 'pending'
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const appointmentsSnapshot = await db.collection('appointments')
      .where('userId', '==', req.user.id)
      .orderBy('date', 'asc')
      .get();

    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(appointments);
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Designs Routes
app.post('/designs', authenticateToken, async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const designRef = await db.collection('designs').add({
      userId: req.user.id,
      name,
      description,
      imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      id: designRef.id,
      name,
      description,
      imageUrl
    });
  } catch (error) {
    console.error('Design creation error:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

app.get('/designs', authenticateToken, async (req, res) => {
  try {
    const designsSnapshot = await db.collection('designs')
      .where('userId', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    const designs = designsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(designs);
  } catch (error) {
    console.error('Designs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Express-Server für Firebase Functions (2nd Gen)
exports.api = onRequest({
  memory: "512MB",
  region: "us-central1",
  minInstances: 0,
  maxInstances: 2,
  timeoutSeconds: 60,
  concurrency: 80
}, app);

// Für lokale Entwicklung
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
