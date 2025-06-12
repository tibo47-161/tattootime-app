import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; // 👈 NEU

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

// 👇 CORS erlauben für Firebase & lokal
const corsOptions = {
  origin: [
    "https://tattootime.web.app",
    "https://tattootime.firebaseapp.com",
    "http://localhost:3000"
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // 👈 NEU
app.use(express.json());

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
