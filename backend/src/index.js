const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Lade Umgebungsvariablen aus .env-Datei
dotenv.config();

// Importiere Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const appointmentTypeRoutes = require('./routes/appointmentTypes');
const customerRoutes = require('./routes/customers');
const workingHoursRoutes = require('./routes/workingHours');
const blockedTimesRoutes = require('./routes/blockedTimes');
const publicRoutes = require('./routes/public');

// Initialisiere Express-App
const app = express();

// CORS-Konfiguration für Produktion
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://tattootime.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Logging nur in Entwicklung
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check Endpoint für Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Verbindung zur Datenbank herstellen
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Verbindung zur MongoDB hergestellt');
  console.log(`🌍 Umgebung: ${process.env.NODE_ENV || 'development'}`);
})
.catch(err => {
  console.error('❌ MongoDB-Verbindungsfehler:', err);
  process.exit(1);
});

// Basis-Route
app.get('/', (req, res) => {
  res.json({
    message: 'TattooTime API ist aktiv',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API-Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-types', appointmentTypeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/working-hours', workingHoursRoutes);
app.use('/api/blocked-times', blockedTimesRoutes);
app.use('/api/public', publicRoutes);

// Fehlerbehandlung für nicht gefundene Routen
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route nicht gefunden',
    path: req.path,
    method: req.method
  });
});

// Globale Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('❌ Fehler:', err.stack);
  
  // Detaillierte Fehler nur in Entwicklung
  const errorResponse = {
    message: 'Interner Serverfehler',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM empfangen, Server wird heruntergefahren...');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB-Verbindung geschlossen');
    process.exit(0);
  });
});

// Server starten
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});

// Server-Timeout für große Anfragen
server.timeout = 30000;

module.exports = app;

