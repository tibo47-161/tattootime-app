Write-Host "🔧 Fix-Skript für TattooTime wird ausgeführt..."

# Schritt 1: Verzeichnis überprüfen
$projectRoot = "$env:USERPROFILE\Documents\tattootime-app"
if (-Not (Test-Path $projectRoot)) {
    Write-Error " Projektverzeichnis nicht gefunden: $projectRoot"
    exit 1
}
Set-Location $projectRoot

# Schritt 2: .env.development erstellen
$envPath = ".env.development"
if (-Not (Test-Path $envPath)) {
    @"
VITE_API_BASE_URL=http://localhost:5000/api
"@ | Set-Content $envPath -Encoding UTF8
    Write-Host " .env.development erstellt"
} else {
    Write-Host " .env.development bereits vorhanden"
}

# Schritt 3: Tailwind/PostCSS Config prüfen
$postcssPath = "postcss.config.js"
if (-Not (Test-Path $postcssPath)) {
    @"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@ | Set-Content $postcssPath -Encoding UTF8
    Write-Host " postcss.config.js erstellt"
}

$tailwindConfigPath = "tailwind.config.js"
if (-Not (Test-Path $tailwindConfigPath)) {
    @"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"@ | Set-Content $tailwindConfigPath -Encoding UTF8
    Write-Host " tailwind.config.js erstellt"
}

# Schritt 4: PostCSS Plugin installieren
pnpm add -D @tailwindcss/postcss

Write-Host "n Alle Schritte abgeschlossen. Du kannst nun 'pnpm run build' erneut ausführen."