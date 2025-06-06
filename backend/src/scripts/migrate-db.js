/**
 * Datenbank-Migrations-Skript für TattooTime
 * 
 * Dieses Skript führt Datenbank-Migrationen durch, um Änderungen am Datenbankschema zu implementieren.
 * Es verwendet eine einfache Versionierung, um sicherzustellen, dass Migrationen nur einmal ausgeführt werden.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Modell für die Migrations-Tabelle
const MigrationSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

const Migration = mongoose.model('Migration', MigrationSchema);

// Verbindung zur Datenbank herstellen
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

// Migrationen ausführen
const runMigrations = async () => {
  // Verzeichnis mit den Migrations-Dateien
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Prüfen, ob das Verzeichnis existiert
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Creating one...');
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Alle Migrations-Dateien lesen
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }
  
  // Bereits angewendete Migrationen abrufen
  const appliedMigrations = await Migration.find().sort({ version: 1 });
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));
  
  // Migrationen ausführen, die noch nicht angewendet wurden
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = require(migrationPath);
    
    // Versionsnummer aus dem Dateinamen extrahieren (z.B. 001_initial_schema.js -> 1)
    const versionMatch = file.match(/^(\d+)_/);
    if (!versionMatch) {
      console.warn(`Invalid migration filename format: ${file}. Skipping.`);
      continue;
    }
    
    const version = parseInt(versionMatch[1], 10);
    
    // Prüfen, ob die Migration bereits angewendet wurde
    if (appliedVersions.has(version)) {
      console.log(`Migration ${version} (${file}) already applied. Skipping.`);
      continue;
    }
    
    console.log(`Applying migration ${version} (${file})...`);
    
    try {
      // Migration ausführen
      await migration.up();
      
      // Migration als angewendet markieren
      await Migration.create({
        version,
        name: file
      });
      
      console.log(`Migration ${version} (${file}) applied successfully.`);
    } catch (err) {
      console.error(`Error applying migration ${version} (${file}):`, err);
      process.exit(1);
    }
  }
  
  console.log('All migrations applied successfully.');
};

// Hauptfunktion
const main = async () => {
  await connectDB();
  await runMigrations();
  mongoose.disconnect();
};

// Skript ausführen
main().catch(err => {
  console.error('Error in migration script:', err);
  process.exit(1);
});

