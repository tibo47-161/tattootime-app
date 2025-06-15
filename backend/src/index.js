const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

// CORS erlauben für Firebase & lokal
const corsOptions = {
  origin: [
    "https://tattootime.web.app",
    "https://tattootime.firebaseapp.com",
    "http://localhost:3000"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 Stunden
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  app.listen(PORT, () => {
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error("❌ MongoDB-Verbindungsfehler:", err);
});
