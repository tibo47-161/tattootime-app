# TattooTime - Deployment Anleitung

## 🚀 Schritt-für-Schritt Deployment

### Voraussetzungen
- GitHub Account
- VS Code (bereits vorhanden)
- Git installiert

### Phase 1: GitHub Repository erstellen

1. **Gehen Sie zu GitHub.com und loggen Sie sich ein**

2. **Neues Repository erstellen:**
   - Klicken Sie auf "New Repository"
   - Name: `tattootime-app`
   - Beschreibung: `Persönliche Kalender-PWA für Tätowierer:innen`
   - Öffentlich oder Privat (Ihre Wahl)
   - **NICHT** "Initialize with README" ankreuzen
   - Klicken Sie auf "Create Repository"

3. **Repository-URL kopieren:**
   - Kopieren Sie die HTTPS-URL (z.B. `https://github.com/IhrUsername/tattootime-app.git`)

### Phase 2: Code zu GitHub hochladen

**Öffnen Sie VS Code und das Terminal (Strg+Shift+`):**

```bash
# 1. In das Projektverzeichnis wechseln
cd /pfad/zum/tattootime/ordner

# 2. Git initialisieren (falls noch nicht geschehen)
git init

# 3. Alle Dateien hinzufügen
git add .

# 4. Ersten Commit erstellen
git commit -m "Initial commit: TattooTime PWA"

# 5. GitHub Repository als Remote hinzufügen
git remote add origin https://github.com/IhrUsername/tattootime-app.git

# 6. Code zu GitHub hochladen
git push -u origin main
```

### Phase 3: MongoDB Atlas einrichten

1. **Gehen Sie zu mongodb.com/atlas**
2. **Kostenlosen Account erstellen**
3. **Neues Projekt erstellen:**
   - Name: "TattooTime"
4. **Cluster erstellen:**
   - Wählen Sie "M0 Sandbox" (kostenlos)
   - Region: Europe (Frankfurt)
5. **Datenbank-Benutzer erstellen:**
   - Username: `tattootime`
   - Passwort: Generieren Sie ein sicheres Passwort
   - **Passwort notieren!**
6. **IP-Adresse freigeben:**
   - Wählen Sie "Allow access from anywhere" (0.0.0.0/0)
7. **Verbindungsstring kopieren:**
   - Klicken Sie auf "Connect"
   - Wählen Sie "Connect your application"
   - Kopieren Sie den Connection String
   - Ersetzen Sie `<password>` mit Ihrem Passwort

### Phase 4: Backend auf Railway deployen

1. **Gehen Sie zu railway.app**
2. **Mit GitHub anmelden**
3. **Neues Projekt erstellen:**
   - "Deploy from GitHub repo"
   - Wählen Sie Ihr `tattootime-app` Repository
   - Wählen Sie den `backend` Ordner
4. **Umgebungsvariablen setzen:**
   ```
   NODE_ENV=production
   MONGODB_URI=ihr-mongodb-connection-string
   JWT_SECRET=super-sicherer-schluessel-mindestens-32-zeichen
   FRONTEND_URL=https://tattootime.vercel.app
   ```
5. **Deployment starten**
6. **Domain notieren** (z.B. `https://tattootime-backend.railway.app`)

### Phase 5: Frontend auf Vercel deployen

1. **Gehen Sie zu vercel.com**
2. **Mit GitHub anmelden**
3. **Neues Projekt erstellen:**
   - "Import Git Repository"
   - Wählen Sie Ihr `tattootime-app` Repository
   - Root Directory: `tattootime-app`
4. **Umgebungsvariablen setzen:**
   ```
   VITE_API_URL=https://ihre-railway-backend-url
   ```
5. **Deployment starten**
6. **Domain notieren** (z.B. `https://tattootime.vercel.app`)

### Phase 6: Finale Konfiguration

1. **Backend-URL im Frontend aktualisieren:**
   - In Vercel: Umgebungsvariable `VITE_API_URL` mit Railway-URL setzen
   - Redeploy auslösen

2. **Frontend-URL im Backend aktualisieren:**
   - In Railway: Umgebungsvariable `FRONTEND_URL` mit Vercel-URL setzen
   - Redeploy auslösen

### Phase 7: Admin-Account erstellen

**Führen Sie das Admin-Erstellungsskript aus:**

```bash
# In VS Code Terminal
cd backend
node src/scripts/create-admin.js
```

**Oder manuell über die API:**
```bash
curl -X POST https://ihre-railway-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ihre-email@example.com",
    "password": "IhrSicheresPasswort123!",
    "name": "Ihr Name"
  }'
```

## ✅ Fertig!

Ihre TattooTime-App ist jetzt live unter:
- **Frontend:** https://tattootime.vercel.app
- **Backend:** https://tattootime-backend.railway.app

## 🔧 Wartung und Updates

**Code-Updates:**
```bash
# Änderungen committen
git add .
git commit -m "Beschreibung der Änderung"
git push

# Automatisches Deployment auf Vercel und Railway
```

**Logs anschauen:**
- **Vercel:** Dashboard → Ihr Projekt → Functions
- **Railway:** Dashboard → Ihr Projekt → Deployments

## 📞 Support

Bei Problemen:
1. Logs in Vercel/Railway prüfen
2. GitHub Issues erstellen
3. Dokumentation nochmal durchlesen

## 🎉 Glückwunsch!

Sie haben erfolgreich eine professionelle PWA deployed!

