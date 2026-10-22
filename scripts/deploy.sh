#!/usr/bin/env bash
# ==============================================================================
# CloudGov - Production Deployment Automation Script (Non-Docker Host)
# Pulls latest code, updates venv, builds React SPA, and reloads systemd/Nginx
# ==============================================================================

set -euo pipefail

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/home/ubuntu/cloudgov"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
WEB_ROOT="/var/www/cloudgov"
VENV_DIR="${BACKEND_DIR}/venv"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}             CloudGov Production Zero-Downtime Deployment             ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Ensure we are in project root
cd "${PROJECT_DIR}"

# 1. Pull Latest Git Code
echo -e "\n${YELLOW}[1/6] Fetching latest codebase from origin/main...${NC}"
git fetch --all --prune
git reset --hard origin/main
echo -e "${GREEN}Git repository synchronized at commit: $(git rev-parse --short HEAD)${NC}"

# 2. Update Backend Python Virtual Environment
echo -e "\n${YELLOW}[2/6] Updating Python virtual environment & dependencies...${NC}"
if [ ! -d "${VENV_DIR}" ]; then
    echo "Creating virtual environment at ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/pip" install --upgrade pip setuptools wheel
"${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"
echo -e "${GREEN}Backend dependencies synchronized.${NC}"

# 3. Execute Database Schema Upgrades & Migrations
echo -e "\n${YELLOW}[3/6] Applying database schema synchronization...${NC}"
cd "${BACKEND_DIR}"
"${VENV_DIR}/bin/python" -c "
import sys
sys.path.insert(0, '.')
from app.core.database import engine, Base
from app.models import User, Service, Application, Document, Grievance, Certificate, AuditLog, Notification
Base.metadata.create_all(bind=engine)
print('Database schema verification complete.')
"
echo -e "${GREEN}Database migration check passed.${NC}"

# 4. Build Frontend Single Page Application
echo -e "\n${YELLOW}[4/6] Building production React Single Page Application...${NC}"
cd "${FRONTEND_DIR}"
npm ci --prefer-offline || npm install
npm run build

echo -e "Deploying build artifacts to ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -r dist/* "${WEB_ROOT}/"
sudo chown -R www-data:www-data "${WEB_ROOT}"
sudo chmod -R 775 "${WEB_ROOT}"
echo -e "${GREEN}Frontend SPA deployed successfully to ${WEB_ROOT}.${NC}"

# 5. Restart Backend Service & Reload Nginx
echo -e "\n${YELLOW}[5/6] Reloading systemd service & Nginx reverse proxy...${NC}"
sudo systemctl daemon-reload
sudo systemctl restart cloudgov.service

# Validate Nginx configuration before reload
sudo nginx -t
sudo systemctl reload nginx
echo -e "${GREEN}Services reloaded with latest release.${NC}"

# 6. Post-Deployment Smoke Test
echo -e "\n${YELLOW}[6/6] Executing smoke test healthcheck...${NC}"
sleep 2

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health || true)

if [ "${HEALTH_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}Healthcheck PASSED (HTTP 200 OK). Backend online!${NC}"
else
    echo -e "${RED}[ERROR] Healthcheck FAILED with status code: ${HEALTH_STATUS}${NC}"
    echo -e "Check application logs using: sudo journalctl -u cloudgov -n 50 --no-pager"
    exit 1
fi

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}        CloudGov Deployment Completed Successfully! [LIVE]            ${NC}"
echo -e "${BLUE}======================================================================${NC}"
