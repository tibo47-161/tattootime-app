#!/bin/bash

# Deployment-Skript für das TattooTime Backend

# Farben für die Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting TattooTime Backend Deployment${NC}"

# Verzeichnis zum Backend wechseln
cd /home/ubuntu/tattootime/backend

# Aktuelle Änderungen von Git holen
echo -e "${YELLOW}Pulling latest changes from Git...${NC}"
git pull

# Abhängigkeiten installieren
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Umgebungsvariablen überprüfen
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found!${NC}"
  echo -e "${YELLOW}Creating sample .env file. Please update with your actual values.${NC}"
  cp .env.example .env
fi

# Tests ausführen
echo -e "${YELLOW}Running tests...${NC}"
npm test

if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed! Aborting deployment.${NC}"
  exit 1
fi

# Deployment mit Railway
echo -e "${YELLOW}Deploying to Railway...${NC}"
railway up

if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment failed!${NC}"
  exit 1
fi

echo -e "${GREEN}Backend deployment completed successfully!${NC}"
echo -e "${GREEN}Your API is now live at https://tattootime-api.up.railway.app${NC}"

exit 0

