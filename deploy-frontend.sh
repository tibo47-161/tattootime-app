#!/bin/bash

# Deployment-Skript für das TattooTime Frontend

# Farben für die Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting TattooTime Frontend Deployment${NC}"

# Verzeichnis zum Frontend wechseln
cd /home/ubuntu/tattootime/tattootime-app

# Aktuelle Änderungen von Git holen
echo -e "${YELLOW}Pulling latest changes from Git...${NC}"
git pull

# Abhängigkeiten installieren
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Produktions-Build erstellen
echo -e "${YELLOW}Creating production build...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Aborting deployment.${NC}"
  exit 1
fi

# Deployment mit Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment failed!${NC}"
  exit 1
fi

echo -e "${GREEN}Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}Your app is now live at https://tattootime.vercel.app${NC}"

exit 0

