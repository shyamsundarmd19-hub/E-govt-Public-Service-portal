#!/usr/bin/env bash
# ==============================================================================
# CloudGov - AWS EC2 Automated Provisioning Script (Free Tier Optimized)
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS (t2.micro / t3.micro)
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}   CloudGov AWS EC2 Provisioning & Setup (Non-Docker Architecture)   ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root or with sudo.${NC}"
    echo "Usage: sudo ./scripts/setup_ec2.sh"
    exit 1
fi

PROJECT_DIR="/home/ubuntu/cloudgov"
WEB_ROOT="/var/www/cloudgov"

# ------------------------------------------------------------------------------
# 1. Configure Swap Memory (Critical for Free Tier 1GB RAM Instances)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] Checking Swap memory configuration...${NC}"
if ! swapon --show | grep -q "swapfile"; then
    echo -e "Creating 2GB swap space to prevent Out-Of-Memory errors on Free Tier..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile none swap sw 0 0' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}Swap file (2GB) created and activated successfully.${NC}"
else
    echo -e "${GREEN}Swap space already present.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Update System & Install Core Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] Updating apt repositories and installing packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    postgresql-client \
    libpq-dev \
    build-essential \
    curl \
    git \
    ufw

echo -e "${GREEN}Core dependencies installed.${NC}"

# ------------------------------------------------------------------------------
# 3. Setup Web Root Directory for React SPA
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Setting up web root at ${WEB_ROOT}...${NC}"
mkdir -p "${WEB_ROOT}"
chown -R ubuntu:www-data "${WEB_ROOT}"
chmod -R 775 "${WEB_ROOT}"

# Create a placeholder index.html if empty
if [ ! -f "${WEB_ROOT}/index.html" ]; then
    cat << 'EOF' > "${WEB_ROOT}/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudGov Platform</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0fdf4; color: #064e3b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.1); border: 1px solid #a7f3d0; text-align: center; }
        h1 { color: #059669; margin-bottom: 0.5rem; }
        p { color: #047857; margin-top: 0; }
        .badge { background: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block; }
    </style>
</head>
<body>
    <div class="card">
        <h1>CloudGov Platform</h1>
        <div class="badge">Nginx & Systemd Online</div>
        <p style="margin-top: 1rem;">Frontend build will be deployed here to /var/www/cloudgov</p>
    </div>
</body>
</html>
EOF
fi

# ------------------------------------------------------------------------------
# 4. Setup Python Virtual Environment and Backend Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] Setting up Python virtual environment...${NC}"
BACKEND_DIR="${PROJECT_DIR}/backend"
if [ -d "${BACKEND_DIR}" ]; then
    su - ubuntu -c "python3 -m venv ${BACKEND_DIR}/venv"
    su - ubuntu -c "${BACKEND_DIR}/venv/bin/pip install --upgrade pip setuptools wheel"
    if [ -f "${BACKEND_DIR}/requirements.txt" ]; then
        echo "Installing Python dependencies from requirements.txt..."
        su - ubuntu -c "${BACKEND_DIR}/venv/bin/pip install -r ${BACKEND_DIR}/requirements.txt"
    fi
    
    # Generate default .env if not present
    if [ ! -f "${BACKEND_DIR}/.env" ] && [ -f "${BACKEND_DIR}/.env.example" ]; then
        cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
        chown ubuntu:ubuntu "${BACKEND_DIR}/.env"
        chmod 600 "${BACKEND_DIR}/.env"
        echo -e "${YELLOW}Created ${BACKEND_DIR}/.env from .env.example. Update your RDS credentials there.${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Backend directory ${BACKEND_DIR} not found yet. Skipping pip install.${NC}"
fi

# Create log files with correct permissions
touch /var/log/cloudgov_access.log /var/log/cloudgov_error.log
chown ubuntu:www-data /var/log/cloudgov_*.log
chmod 664 /var/log/cloudgov_*.log

# ------------------------------------------------------------------------------
# 5. Configure Systemd Service
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Configuring Systemd Service (cloudgov.service)...${NC}"
SERVICE_SRC="${PROJECT_DIR}/scripts/cloudgov.service"
if [ -f "${SERVICE_SRC}" ]; then
    cp "${SERVICE_SRC}" /etc/systemd/system/cloudgov.service
    systemctl daemon-reload
    systemctl enable cloudgov.service
    systemctl restart cloudgov.service || true
    echo -e "${GREEN}cloudgov.service installed and enabled.${NC}"
else
    echo -e "${RED}[WARN] scripts/cloudgov.service not found at ${SERVICE_SRC}${NC}"
fi

# ------------------------------------------------------------------------------
# 6. Configure Nginx Reverse Proxy
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] Configuring Nginx Reverse Proxy...${NC}"
NGINX_SRC="${PROJECT_DIR}/scripts/nginx.conf"
if [ -f "${NGINX_SRC}" ]; then
    # Disable default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Install CloudGov site
    cp "${NGINX_SRC}" /etc/nginx/sites-available/cloudgov
    ln -sf /etc/nginx/sites-available/cloudgov /etc/nginx/sites-enabled/cloudgov
    
    # Test and restart Nginx
    nginx -t
    systemctl restart nginx
    echo -e "${GREEN}Nginx configured and reloaded.${NC}"
else
    echo -e "${RED}[WARN] scripts/nginx.conf not found at ${NGINX_SRC}${NC}"
fi

# ------------------------------------------------------------------------------
# 7. Configure Firewall (UFW)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Configuring UFW Firewall rules...${NC}"
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
echo "y" | ufw enable || true

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}             CloudGov EC2 Setup Completed Successfully!               ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "1. Service Status:      ${YELLOW}sudo systemctl status cloudgov${NC}"
echo -e "2. Service Logs:        ${YELLOW}sudo journalctl -u cloudgov -f${NC}"
echo -e "3. Nginx Access Logs:   ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "4. FastAPI Access Logs: ${YELLOW}sudo tail -f /var/log/cloudgov_access.log${NC}"
echo -e "5. Health Check:        ${YELLOW}curl http://127.0.0.1:8000/api/health${NC}"
echo -e "${BLUE}======================================================================${NC}"
