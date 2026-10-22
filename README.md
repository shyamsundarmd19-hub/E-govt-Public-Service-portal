# CloudGov - Cloud-Native e-Governance Platform

> Cloud-Native e-Governance Platform optimized for **AWS Free Tier** (t2.micro/t3.micro + RDS + S3) with direct hosting (**No Docker**) using Python Virtualenv, Systemd, and Nginx.

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    Client[Citizen / Officer Browser] -->|Port 80 / 443| Nginx[Nginx Reverse Proxy]
    Nginx -->|/ (Static SPA)| WebRoot["/var/www/cloudgov (React Build)"]
    Nginx -->|/api/* & /docs| Gunicorn["Gunicorn + Uvicorn Workers (Port 8000)"]
    Gunicorn --> FastAPI[FastAPI Core Application]
    FastAPI --> DB[(AWS RDS PostgreSQL)]
    FastAPI --> S3[(AWS S3 Document Vault - SSE-S3)]
    FastAPI --> SES[AWS SES / SNS Notifications]
```

### Free Tier Cost & Performance Engineering
- **Direct Systemd Host (No Docker overhead)**: Conserves ~350MB+ of memory on 1GB RAM EC2 instances.
- **Automated 2GB Swap Space**: Prevents Linux kernel Out-Of-Memory (OOM) killer during heavy tasks or builds.
- **2 Uvicorn Workers**: Exactly balances concurrency on 1 vCPU instances without CPU thrashing.
- **Gzip Compression**: Nginx-level text/css/js compression minimizes AWS data-out bandwidth consumption.
- **S3 Document Vault**: Encrypted cloud document archival with AWS SSE-S3.

---

## 📁 Repository Layout

```text
cloudgov/
├── frontend/                     # React SPA (Pale Green / Sage Mint aesthetic)
├── backend/                      # FastAPI Backend Application
│   ├── app/
│   │   ├── core/                 # Config, Database Session, Security/JWT
│   │   ├── models/               # SQLAlchemy ORM Models
│   │   ├── schemas/              # Pydantic Request/Response Schemas
│   │   ├── routers/              # API Route Controllers
│   │   ├── services/             # S3 Document Vault, QR Code, Notifications
│   │   └── main.py               # FastAPI App Entrypoint
│   ├── .env.example              # Environment Configuration Template
│   └── requirements.txt          # Python Production Dependencies
├── scripts/
│   ├── cloudgov.service          # Production Systemd Service Unit
│   ├── nginx.conf                # Nginx Reverse Proxy & Static SPA Config
│   ├── setup_ec2.sh              # 1-Click Provisioning Script for Ubuntu EC2
│   └── deploy_frontend.sh        # Frontend Build & Deploy Automation
└── README.md
```

---

## 🚀 Quick Setup on AWS EC2 (Ubuntu 22.04 / 24.04 LTS)

### 1. Launch EC2 Free Tier Instance
- **AMI**: Ubuntu 22.04 LTS or 24.04 LTS
- **Instance Type**: `t2.micro` or `t3.micro` (Free Tier eligible)
- **Security Group Inbound Rules**:
  - `SSH` (Port 22) - Your IP
  - `HTTP` (Port 80) - 0.0.0.0/0
  - `HTTPS` (Port 443) - 0.0.0.0/0

### 2. Clone Repository & Run Provisioning Script
SSH into your instance and run:
```bash
git clone <your-repository-url> /home/ubuntu/cloudgov
cd /home/ubuntu/cloudgov

# Make scripts executable
chmod +x scripts/*.sh

# Run 1-Click Provisioning (Installs Nginx, Python, Postgres Client, Swap, Services)
sudo ./scripts/setup_ec2.sh
```

### 3. Configure Database & Secrets
Edit the backend environment file:
```bash
nano /home/ubuntu/cloudgov/backend/.env
```
Update your RDS endpoint, credentials, and S3 bucket details, then restart the service:
```bash
sudo systemctl restart cloudgov
```

---

## 🛠️ Management & Monitoring Commands

| Action | Command |
|---|---|
| Check Backend Status | `sudo systemctl status cloudgov` |
| View Real-time App Logs | `sudo journalctl -u cloudgov -f` |
| Restart Backend API | `sudo systemctl restart cloudgov` |
| Test Nginx Configuration | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Deploy Frontend Build | `./scripts/deploy_frontend.sh` |

---

## 🔑 Demo & Sandbox Credentials

For rapid verification, the system auto-provisions these baseline accounts on boot:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Administrator** | `admin@cloudgov.gov` | `Admin@123` | Full access, state analytics dashboard, audit logs, service creation |
| **Officer** | `officer@cloudgov.gov` | `Officer@123` | Application verification queue, document inspection, approval & certificate issuance, grievance resolution |
| **Clerk** | `clerk@cloudgov.gov` | `Clerk@123` | Queue review, document verification, marking applications under review |
| **Citizen** | `citizen@cloudgov.gov` | `Citizen@123` | Service application filing, S3 document vault uploads, live tracking, grievance lodging |

---

## 💻 Local Development Workflow

### 1. Run Backend (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Run Frontend (React SPA)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. All `/api` requests are automatically proxied to port 8000.

