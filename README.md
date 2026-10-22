# 🏛️ CloudGov - Cloud-Native e-Governance & Public Service Delivery Platform

> A full-stack, enterprise-grade cloud-native e-Governance and public certificate verification platform built with **FastAPI (Python)**, **React.js (SPA)**, **Tailwind CSS**, **SQLAlchemy ORM**, **PostgreSQL / AWS RDS**, **AWS S3 Document Vault (SSE-S3)**, and **Nginx + Systemd (Docker-Free Hosting)** optimized for **AWS Free Tier**.

---

## 🌟 Key Features

### 🔐 Authentication & Role-Based Access Control (RBAC):
- **Bcrypt Password Security**: Master user authentication powered by salted bcrypt password hashing with automatic 72-byte truncation safeguards.
- **Stateless JWT Authorization**: Secure, fine-grained Bearer token authentication safeguarding all citizen services, officer queues, and administrative routes.
- **Granular Multi-Tenant Roles**: Specialized permission scopes and desk interfaces for `Citizen`, `Clerk`, `Officer`, and `Administrator`.
- **Instant Demo Login**: 1-Click instant sandbox access for Citizen, Officer, and Administrator for fast feature evaluation.

### 📋 Public Services & Application Lifecycle:
- **Digital Service Catalog**: Dynamic registry of statutory services across Revenue, Municipal Corporation, Social Welfare, Public Health, and Urban Planning.
- **Multi-Step Application Wizard**: Guided citizen application filing with input validation, residential declarations, and statutory compliance checks.
- **Encrypted S3 Document Vault**: Secure citizen document uploads leveraging AWS S3 Presigned URLs with Server-Side Encryption (`SSE-S3 AES-256`) and local fallback storage.
- **Visual 4-Stage Timeline Tracker**: Real-time tracking from *Submission → Clerk Verification → Officer Decision → Digital Certificate Issuance*.

### 🛡️ Cryptographic Verification & Automated Certificate Engine:
- **Automated ReportLab PDF Engine**: Dynamic generation of official high-resolution government certificates with state seals, stamps, and double-border styling upon officer approval.
- **Embedded Dynamic QR Codes**: High-contrast emerald QR codes generated on the fly pointing to public authenticity verification endpoints.
- **SHA-256 Cryptographic Fingerprint**: Cryptographic digest computed over issuance payloads ensuring immutable anti-tampering verification.
- **Public QR Verification Portal**: Instant zero-login verification of certificates with authentic status shields and anti-fraud vigilance alerts.

### ⚖️ Department Desk & Grievance Redressal:
- **Officer & Clerk Verification Desk**: Work queue with full-text search, status tabs, and department filtering.
- **Review & Inspection Modal**: Comprehensive applicant inspection, document preview, and one-click status transitions with required justification logs.
- **Public Grievance Redressal**: Citizen ticketing system with priority categorization (`Low`, `Medium`, `High`, `Urgent`) and SLA-driven resolution tracking.
- **Immutable Audit Trail**: Chronological security event logging tracking all logins, submissions, verifications, approvals, and certificate releases.

### 🚀 AWS Free Tier & DevOps Engineering (Docker-Free):
- **Zero-Docker Native Host Architecture**: Eliminates container daemon overhead, saving 350MB+ RAM on 1GB AWS `t2.micro`/`t3.micro` instances.
- **Automated 2GB Swap Memory**: Linux kernel swap provisioning script to completely eliminate Out-Of-Memory (OOM) failures during builds and peak loads.
- **Nginx Reverse Proxy & Gzip Optimization**: Port 80/443 unified reverse proxy with Gzip compression minimizing AWS egress bandwidth expenses.
- **Automated CI/CD Pipeline**: GitHub Actions workflow executing SSH deployment to EC2 upon push to `main`.
- **High-Concurrency Load Testing**: Locust performance test suite simulating 100 to 1,000 concurrent citizens with HTML latency graphs.

---

## 📂 Project Structure

```text
cloudgov/
├── .github/
│   └── workflows/
│       └── deploy.yml                   # GitHub Actions automated SSH deployment to EC2
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                # Environment configurations (AWS, DB, JWT, CORS)
│   │   │   ├── database.py              # SQLAlchemy engine with RDS pool & SQLite fallback
│   │   │   └── security.py              # Bcrypt hashing, JWT tokens & RBAC dependencies
│   │   ├── models/
│   │   │   ├── user.py                  # User authentication & role database model
│   │   │   ├── service.py               # Government service catalog database model
│   │   │   ├── application.py           # Citizen application database model
│   │   │   ├── document.py              # S3 Document Vault attachment model
│   │   │   ├── grievance.py             # Citizen grievance ticket database model
│   │   │   ├── certificate.py           # Cryptographic certificate database model
│   │   │   ├── audit_log.py             # Immutable security audit trail database model
│   │   │   └── notification.py          # Citizen & staff notification model
│   │   ├── schemas/
│   │   │   ├── user.py                  # User authentication & token Pydantic schemas
│   │   │   ├── service.py               # Service catalog Pydantic schemas
│   │   │   ├── application.py           # Application request & response Pydantic schemas
│   │   │   ├── document.py              # S3 Presigned URL request & response schemas
│   │   │   ├── grievance.py             # Grievance filing & resolution schemas
│   │   │   ├── certificate.py           # Certificate issuance & verification schemas
│   │   │   └── admin.py                 # Analytics metrics & audit trail schemas
│   │   ├── routers/
│   │   │   ├── auth.py                  # Registration, login, OTP verification & profile routes
│   │   │   ├── services.py              # Service catalog query & creation endpoints
│   │   │   ├── applications.py          # Application submission, queue & approval routes
│   │   │   ├── documents.py             # S3 Presigned upload & vault download endpoints
│   │   │   ├── grievances.py            # Grievance lodging & officer resolution endpoints
│   │   │   ├── verify.py                # Public QR verification & certificate PDF downloads
│   │   │   └── admin.py                 # Real-time state analytics & audit trail endpoints
│   │   ├── services/
│   │   │   ├── s3_service.py            # AWS S3 Presigned URL & SSE-S3 encryption engine
│   │   │   ├── certificate_service.py   # Automated QR code (qrcode) & PDF engine (ReportLab)
│   │   │   └── audit_service.py         # Audit event logger & notification dispatcher
│   │   └── main.py                      # FastAPI application entrypoint & auto-seeder
│   ├── .env.example                     # Template environment configuration
│   └── requirements.txt                 # Backend Python dependencies
├── docs/
│   └── AWS_INFRASTRUCTURE_BLUEPRINT.md  # Production AWS runbook (ALB, ASG, S3, IAM, CloudWatch)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                # Axios client with JWT Bearer interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # User session, role state & 1-click sandbox logins
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation bar with role badges & profile menu
│   │   │   ├── StatusBadge.jsx          # Color-coded status badge components
│   │   │   ├── TimelineTracker.jsx      # Visual 4-stage application lifecycle stepper
│   │   │   ├── CertificateCard.jsx      # Certificate preview card with QR code & PDF download
│   │   │   └── ReviewModal.jsx          # Officer inspection modal with document preview
│   │   ├── views/
│   │   │   ├── AuthView.jsx             # Sign in, registration & role selector portal
│   │   │   ├── CitizenDashboard.jsx     # Citizen application list, tracking & certificate vault
│   │   │   ├── ApplyServiceView.jsx     # Multi-step service application wizard & file dropzone
│   │   │   ├── OfficerQueueView.jsx     # Verification desk work queue with filters
│   │   │   ├── GrievancesView.jsx       # Grievance lodging & resolution tracking view
│   │   │   ├── AdminAnalyticsView.jsx   # State analytics dashboard & audit logs
│   │   │   └── PublicVerifyView.jsx     # Public QR verification page with cryptographic matching
│   │   ├── App.jsx                      # Main application view & tab router
│   │   ├── index.css                    # Tailwind CSS directives & custom design tokens
│   │   └── main.jsx                     # React DOM root entrypoint
│   ├── index.html                       # HTML5 template with Plus Jakarta Sans typography
│   ├── package.json                     # Frontend dependencies & Vite scripts
│   ├── tailwind.config.js               # Pale Green / Sage Mint color palette configuration
│   └── vite.config.js                   # Vite bundler & API reverse proxy configuration
├── scripts/
│   ├── cloudgov.service                 # Systemd service unit for Gunicorn/Uvicorn on EC2
│   ├── nginx.conf                       # Nginx reverse proxy routing port 80 to SPA & FastAPI
│   ├── setup_ec2.sh                     # 1-Click OS provisioning script (Nginx, Python, 2GB Swap)
│   ├── deploy.sh                        # Zero-downtime native deployment automation script
│   └── deploy_frontend.sh               # Frontend build and sync script for /var/www/cloudgov
├── locustfile.py                        # Performance & load testing suite (100 to 1,000 users)
├── .gitignore                           # Git ignore rules for virtualenvs, node_modules & secrets
└── README.md                            # Comprehensive platform documentation
```

---

## 💻 Installation & Setup

### Prerequisites
- **Python**: v3.10, v3.11, or v3.12 installed.
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended) and `npm`.
- **Database**: PostgreSQL (AWS RDS or local) *OR* automatic local SQLite fallback for offline development.

---

### 1. Clone Repository
```bash
git clone https://github.com/shyamsundarmd19-hub/cloud-e-govt-.git
cd cloud-e-govt-
```

---

### 2. Backend Setup
Navigate into the backend directory and configure a virtual environment:
```bash
cd backend
python -m venv venv

# On Linux / macOS / EC2:
source venv/bin/activate

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install dependencies:
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```
Example configuration:
```env
PROJECT_NAME="CloudGov Platform API"
ENVIRONMENT=development
DEBUG=True

# Master JWT Secret (Generate via: openssl rand -hex 32)
SECRET_KEY=e83a7f29b4c09d81726a5e12893fbc019a8264718392bcdefa01827364519283
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Connection (AWS RDS PostgreSQL or local SQLite fallback)
DATABASE_URL=postgresql://cloudgov_admin:YourStrongPassword@localhost:5432/cloudgov_db

# AWS Cloud Settings (Free Tier S3 Document Vault)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET_NAME=cloudgov-document-vault

# CORS Allowed Origins
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://127.0.0.1:3000
```
> **Note**: If PostgreSQL is not running on localhost, CloudGov automatically falls back to a local SQLite database (`cloudgov.db`) with zero manual setup required.

---

### 4. Run Backend Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```
Open your browser and visit:
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Healthcheck Probe**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 5. Frontend Setup
In a new terminal window, navigate into the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and visit: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Live Access & Repositories

- **GitHub Repository**: [https://github.com/shyamsundarmd19-hub/cloud-e-govt-.git](https://github.com/shyamsundarmd19-hub/cloud-e-govt-.git)
- **Frontend SPA Portal**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Core Engine**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **OpenAPI / Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔑 Default Accounts & Sample Tracking Data (Created Automatically)

On startup, CloudGov automatically provisions baseline services and demo credentials:

| Role / Entity | Identifier / Email | Default Password | Features Accessible |
|---|---|---|---|
| **Administrator** | `admin@cloudgov.gov` | `Admin@123` | Full access, state analytics dashboard, SLA compliance reports, service creation, immutable audit trail |
| **Officer** | `officer@cloudgov.gov` | `Officer@123` | Verification queue, citizen document preview, approval & automated certificate issuance, grievance resolution |
| **Clerk** | `clerk@cloudgov.gov` | `Clerk@123` | Initial document intake review, applicant verification, marking applications under review |
| **Citizen** | `citizen@cloudgov.gov` | `Citizen@123` | Multi-step service application, S3 vault uploads, visual 4-stage tracking, grievance filing |
| **Public Verifier** | *No login required* | *Publicly accessible* | Public QR code verification, SHA-256 integrity match, official PDF certificate download |

---

## 🔒 Security & DevOps Best Practices Implemented

- **SSE-S3 AES-256 Vault Encryption**: All citizen identity documents, salary slips, and affidavits uploaded to the S3 Document Vault are encrypted at rest with Server-Side Encryption (`AES256`).
- **Cryptographic SHA-256 Signatures**: Issued certificates receive a tamper-proof SHA-256 cryptographic digest computed over issuance payloads, verifiable by anyone via the public QR portal.
- **Bcrypt Master Password Hashing**: Passwords are salted and hashed with bcrypt, safeguarding against offline rainbow-table and dictionary attacks.
- **JWT Role-Based Access Control**: Strict multi-tenant isolation enforced via FastAPI dependency injection (`require_role`), preventing privilege escalation across Citizen, Clerk, Officer, and Admin tiers.
- **Direct Systemd Hosting (Docker-Free)**: Eliminates container runtime memory overhead, saving 350MB+ RAM on 1GB AWS `t2.micro`/`t3.micro` instances.
- **Automated 2GB Swap Memory**: Automated provisioning script safeguards host instances against Linux kernel Out-Of-Memory (OOM) termination during builds or sudden traffic bursts.
- **Nginx Reverse Proxy & Gzip Compression**: Front-facing proxy terminating port 80/443, serving static assets, and compressing payloads to minimize AWS egress bandwidth expenses.
- **Automated CI/CD Deployment**: GitHub Actions workflow automatically validates builds and triggers zero-downtime SSH deployments to EC2 upon push to `main`.
- **High-Concurrency Load Testing**: Built-in Locust test suite simulating 100 to 1,000 concurrent citizens with latency and throughput reporting.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
