/**
 * Admin-Benutzer-Erstellungsskript für TattooTime
 * Erstellt den ersten Admin-Benutzer für die Anwendung
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Modelle importieren
const User = require('../models/User');

// Umgebungsvariablen laden
dotenv.config();

// Readline Interface für Benutzereingaben
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funktion zum Stellen von Fragen
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Funktion zum Stellen von Fragen mit versteckter Eingabe (für Passwörter)
function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// Funktion zur Passwort-Validierung
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Mindestens ${minLength} Zeichen`);
  }
  if (!hasUpperCase) {
    errors.push('Mindestens ein Großbuchstabe');
  }
  if (!hasLowerCase) {
    errors.push('Mindestens ein Kleinbuchstabe');
  }
  if (!hasNumbers) {
    errors.push('Mindestens eine Zahl');
  }
  if (!hasSpecialChar) {
    errors.push('Mindestens ein Sonderzeichen');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Funktion zur E-Mail-Validierung
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Funktion zum Generieren eines sicheren Passworts
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Mindestens ein Zeichen aus jeder Kategorie
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Restliche Zeichen zufällig
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Passwort mischen
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createAdminUser() {
  try {
    console.log('🔧 TattooTime Admin-Benutzer erstellen\n');
    
    // Verbindung zur Datenbank
    console.log('🔄 Verbinde mit MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Verbindung zur MongoDB hergestellt\n');

    // Prüfen, ob bereits ein Admin-Benutzer existiert
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Es existiert bereits ein Admin-Benutzer:');
      console.log(`   E-Mail: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      
      const overwrite = await askQuestion('\nMöchten Sie einen neuen Admin-Benutzer erstellen? (j/n): ');
      if (overwrite.toLowerCase() !== 'j' && overwrite.toLowerCase() !== 'ja') {
        console.log('❌ Abgebrochen');
        return;
      }
    }

    // Benutzerdaten abfragen
    console.log('📝 Bitte geben Sie die Admin-Daten ein:\n');
    
    let name;
    do {
      name = await askQuestion('Name: ');
      if (!name.trim()) {
        console.log('❌ Name darf nicht leer sein');
      }
    } while (!name.trim());

    let email;
    do {
      email = await askQuestion('E-Mail: ');
      if (!validateEmail(email)) {
        console.log('❌ Ungültige E-Mail-Adresse');
      } else {
        // Prüfen, ob E-Mail bereits existiert
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          console.log('❌ Diese E-Mail-Adresse wird bereits verwendet');
          email = '';
        }
      }
    } while (!email);

    // Passwort-Option
    console.log('\nPasswort-Optionen:');
    console.log('1. Eigenes Passwort eingeben');
    console.log('2. Sicheres Passwort automatisch generieren');
    
    let passwordOption;
    do {
      passwordOption = await askQuestion('Wählen Sie eine Option (1 oder 2): ');
    } while (passwordOption !== '1' && passwordOption !== '2');

    let password;
    
    if (passwordOption === '1') {
      // Eigenes Passwort
      let passwordValid = false;
      do {
        password = await askPassword('Passwort: ');
        const validation = validatePassword(password);
        
        if (validation.isValid) {
          const confirmPassword = await askPassword('Passwort bestätigen: ');
          if (password === confirmPassword) {
            passwordValid = true;
          } else {
            console.log('❌ Passwörter stimmen nicht überein');
          }
        } else {
          console.log('❌ Passwort erfüllt nicht die Anforderungen:');
          validation.errors.forEach(error => console.log(`   - ${error}`));
        }
      } while (!passwordValid);
    } else {
      // Automatisch generiertes Passwort
      password = generateSecurePassword();
      console.log(`\n🔐 Generiertes Passwort: ${password}`);
      console.log('⚠️  Bitte notieren Sie sich dieses Passwort sicher!');
      
      const confirm = await askQuestion('\nPasswort notiert? Fortfahren? (j/n): ');
      if (confirm.toLowerCase() !== 'j' && confirm.toLowerCase() !== 'ja') {
        console.log('❌ Abgebrochen');
        return;
      }
    }

    // Passwort hashen
    console.log('\n🔄 Erstelle Admin-Benutzer...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Admin-Benutzer erstellen oder aktualisieren
    const adminData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (existingAdmin) {
      await User.findByIdAndUpdate(existingAdmin._id, adminData);
      console.log('✅ Admin-Benutzer aktualisiert');
    } else {
      const newAdmin = new User(adminData);
      await newAdmin.save();
      console.log('✅ Admin-Benutzer erstellt');
    }

    console.log('\n🎉 Admin-Benutzer erfolgreich eingerichtet!');
    console.log('\nAnmeldedaten:');
    console.log(`📧 E-Mail: ${email}`);
    if (passwordOption === '2') {
      console.log(`🔐 Passwort: ${password}`);
    }
    console.log('\n🌐 Sie können sich jetzt in der TattooTime-App anmelden.');
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Admin-Benutzers:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n📦 Datenbankverbindung geschlossen');
    process.exit(0);
  }
}

// Skript ausführen, wenn direkt aufgerufen
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;

