#!/usr/bin/env bash
# ==============================================================================
# CloudGov - Frontend Deployment Script
# Builds React SPA and copies production build to /var/www/cloudgov
# ==============================================================================

set -euo pipefail

WEB_ROOT="/var/www/cloudgov"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

echo "==> Deploying CloudGov Frontend..."

if [ ! -d "${FRONTEND_DIR}" ]; then
    echo "Error: Frontend directory ${FRONTEND_DIR} not found!"
    exit 1
fi

cd "${FRONTEND_DIR}"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Building production bundle..."
npm run build

echo "Deploying build artifacts to ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"
# Support both Vite (dist/) and Create React App (build/)
if [ -d "dist" ]; then
    sudo cp -r dist/* "${WEB_ROOT}/"
elif [ -d "build" ]; then
    sudo cp -r build/* "${WEB_ROOT}/"
else
    echo "Error: Build output folder (dist or build) not found!"
    exit 1
fi

sudo chown -R www-data:www-data "${WEB_ROOT}"
sudo chmod -R 775 "${WEB_ROOT}"

echo "==> Frontend deployment complete! Live at port 80."
