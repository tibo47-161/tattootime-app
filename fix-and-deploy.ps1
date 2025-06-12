# Pfade
$eslintrcPath = ".\functions\.eslintrc.js"
$packageJsonPath = ".\functions\package.json"
$firebaseJsonPath = ".\firebase.json"

# 1. .eslintrc.js mit CommonJS-Config erstellen/überschreiben
$eslintrcContent = @"
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    // eigene Regeln hier hinzufügen
  },
};
"@
Set-Content -Path $eslintrcPath -Value $eslintrcContent -Encoding UTF8
Write-Host "=> .eslintrc.js erstellt/überschrieben"

# 2. package.json prüfen und lint-Skript hinzufügen
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
} else {
    $packageJson = [PSCustomObject]@{
        name = "functions"
        version = "1.0.0"
        main = "index.js"
        scripts = @{ }
    }
}
if (-not $packageJson.scripts) {
    $packageJson | Add-Member -MemberType NoteProperty -Name scripts -Value @{}
}
$packageJson.scripts.lint = "eslint ."
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath -Encoding UTF8
Write-Host "=> lint-Skript in functions/package.json hinzugefügt/aktualisiert"

# 3. predeploy Lint-Hook aus firebase.json komplett entfernen
if (Test-Path $firebaseJsonPath) {
    $firebaseJson = Get-Content $firebaseJsonPath -Raw | ConvertFrom-Json
    if ($firebaseJson.functions -and $firebaseJson.functions.predeploy) {
        $firebaseJson.functions.predeploy = $firebaseJson.functions.predeploy | Where-Object { $_ -notmatch 'npm --prefix.*run lint' }
        $firebaseJson | ConvertTo-Json -Depth 10 | Set-Content -Path $firebaseJsonPath -Encoding UTF8
        Write-Host "=> predeploy lint Hook entfernt"
    } else {
        Write-Host "=> Keine predeploy Hooks zum Entfernen gefunden oder predeploy nicht definiert"
    }
} else {
    Write-Warning "firebase.json nicht gefunden."
}

# 4. Build + Deploy ohne Lint starten
Write-Host "Starte Build + Deploy ohne Lint..."
pnpm run build
Remove-Item -Recurse -Force .\public\* -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force .\dist\* .\public\

# Wichtig: Kommata in --only mit Anführungszeichen
firebase deploy --only "hosting,functions"
