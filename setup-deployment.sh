#!/bin/bash

# TattooTime Deployment-Hilfsskript
# Dieses Skript hilft beim Setup der Produktionsumgebung

set -e  # Beenden bei Fehlern

echo "🚀 TattooTime Deployment-Setup"
echo "================================"

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgaben
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfen, ob Git installiert ist
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git ist nicht installiert. Bitte installieren Sie Git zuerst."
        exit 1
    fi
    print_success "Git ist installiert"
}

# Prüfen, ob Node.js installiert ist
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js ist nicht installiert. Bitte installieren Sie Node.js zuerst."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js ist installiert: $NODE_VERSION"
}

# Prüfen, ob npm installiert ist
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm ist nicht installiert. Bitte installieren Sie npm zuerst."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm ist installiert: $NPM_VERSION"
}

# Git Repository initialisieren
init_git() {
    print_status "Initialisiere Git Repository..."
    
    if [ ! -d ".git" ]; then
        git init
        print_success "Git Repository initialisiert"
    else
        print_warning "Git Repository bereits vorhanden"
    fi
    
    # .gitignore prüfen
    if [ ! -f ".gitignore" ]; then
        print_warning ".gitignore nicht gefunden - wird erstellt"
        cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Deployment
.vercel
.railway
EOF
        print_success ".gitignore erstellt"
    fi
}

# Dependencies installieren
install_dependencies() {
    print_status "Installiere Backend-Dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend-Dependencies installiert"
    
    print_status "Installiere Frontend-Dependencies..."
    cd tattootime-app
    npm install
    cd ..
    print_success "Frontend-Dependencies installiert"
}

# Build testen
test_build() {
    print_status "Teste Frontend-Build..."
    cd tattootime-app
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend-Build erfolgreich"
    else
        print_error "Frontend-Build fehlgeschlagen"
        exit 1
    fi
    cd ..
}

# Git Commit erstellen
create_commit() {
    print_status "Erstelle Git Commit..."
    
    git add .
    
    if git diff --staged --quiet; then
        print_warning "Keine Änderungen zum Committen"
    else
        git commit -m "Initial commit: TattooTime PWA ready for deployment"
        print_success "Git Commit erstellt"
    fi
}

# GitHub Repository URL abfragen
get_github_url() {
    echo ""
    print_status "GitHub Repository Setup"
    echo "Bitte erstellen Sie zuerst ein Repository auf GitHub.com"
    echo "Repository-Name: tattootime-app"
    echo ""
    
    read -p "GitHub Repository URL (z.B. https://github.com/username/tattootime-app.git): " GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        print_error "GitHub URL ist erforderlich"
        exit 1
    fi
    
    # Remote hinzufügen
    if git remote get-url origin &> /dev/null; then
        print_warning "Remote 'origin' bereits vorhanden - wird aktualisiert"
        git remote set-url origin "$GITHUB_URL"
    else
        git remote add origin "$GITHUB_URL"
    fi
    
    print_success "GitHub Remote hinzugefügt: $GITHUB_URL"
}

# Code zu GitHub pushen
push_to_github() {
    print_status "Pushe Code zu GitHub..."
    
    # Prüfen, ob es Commits gibt
    if ! git log --oneline -1 &> /dev/null; then
        print_error "Keine Commits vorhanden. Erstelle zuerst einen Commit."
        exit 1
    fi
    
    # Branch prüfen und ggf. umbenennen
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        git branch -M main
        print_status "Branch zu 'main' umbenannt"
    fi
    
    # Push zu GitHub
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        print_success "Code erfolgreich zu GitHub gepusht"
    else
        print_error "Fehler beim Pushen zu GitHub"
        exit 1
    fi
}

# Deployment-URLs sammeln
collect_deployment_info() {
    echo ""
    print_status "Deployment-Informationen"
    echo "Nach dem Deployment auf Railway und Vercel, tragen Sie hier die URLs ein:"
    echo ""
    
    read -p "Railway Backend URL (z.B. https://tattootime-backend.railway.app): " BACKEND_URL
    read -p "Vercel Frontend URL (z.B. https://tattootime.vercel.app): " FRONTEND_URL
    
    if [ ! -z "$BACKEND_URL" ] && [ ! -z "$FRONTEND_URL" ]; then
        echo ""
        print_success "Deployment-URLs gespeichert:"
        echo "Backend:  $BACKEND_URL"
        echo "Frontend: $FRONTEND_URL"
        
        # URLs in Datei speichern
        cat > deployment-urls.txt << EOF
TattooTime Deployment URLs
==========================

Backend (Railway):  $BACKEND_URL
Frontend (Vercel):  $FRONTEND_URL

Umgebungsvariablen für Railway:
- MONGODB_URI: [Ihre MongoDB Atlas Connection String]
- JWT_SECRET: [Generierter sicherer Schlüssel]
- FRONTEND_URL: $FRONTEND_URL
- NODE_ENV: production

Umgebungsvariablen für Vercel:
- VITE_API_URL: $BACKEND_URL

Nächste Schritte:
1. MongoDB Atlas Cluster erstellen
2. Backend auf Railway deployen
3. Frontend auf Vercel deployen
4. Admin-Account erstellen
EOF
        
        print_success "Deployment-Informationen in 'deployment-urls.txt' gespeichert"
    fi
}

# Hauptfunktion
main() {
    echo ""
    print_status "Starte Deployment-Setup..."
    echo ""
    
    # Systemprüfungen
    check_git
    check_node
    check_npm
    
    echo ""
    
    # Git Setup
    init_git
    
    # Dependencies installieren
    install_dependencies
    
    # Build testen
    test_build
    
    # Git Commit
    create_commit
    
    # GitHub Setup
    get_github_url
    
    # Push zu GitHub
    push_to_github
    
    echo ""
    print_success "Setup abgeschlossen!"
    echo ""
    print_status "Nächste Schritte:"
    echo "1. MongoDB Atlas Account erstellen (mongodb.com/atlas)"
    echo "2. Backend auf Railway deployen (railway.app)"
    echo "3. Frontend auf Vercel deployen (vercel.com)"
    echo "4. Umgebungsvariablen konfigurieren"
    echo "5. Admin-Account erstellen"
    echo ""
    print_status "Detaillierte Anleitung finden Sie in DEPLOYMENT.md"
    
    # Optional: Deployment-URLs sammeln
    read -p "Möchten Sie jetzt die Deployment-URLs eingeben? (j/n): " COLLECT_URLS
    if [ "$COLLECT_URLS" = "j" ] || [ "$COLLECT_URLS" = "ja" ]; then
        collect_deployment_info
    fi
}

# Skript ausführen
main "$@"

