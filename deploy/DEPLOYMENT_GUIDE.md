# RentaTool LK – AWS EC2 Production Deployment Guide

This guide walks you through deploying the complete RentaTool LK production stack (PostgreSQL 16, ASP.NET Core 9 Modular Monolith, Python LangGraph AI Subsystem, and React Web Admin Portal) onto an AWS EC2 Ubuntu instance.

---

## 1. Quick Architecture Overview

All services run inside isolated Docker containers on an internal network (`rentatool_network`).

| Service | Technology | Internal Port | Exposed Host Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | PostgreSQL 16 Alpine | 5432 | `5432` | Relational tables + JSONB condition & audit logs |
| **`ai_service`** | Python 3.11 / FastAPI / LangGraph | 8000 | Internal only | Validation, Wear-and-Tear Forensics, Dispute Planner, Action calculations |
| **`backend`** | ASP.NET Core 9.0 Web API | 5000 | `5000` | Composition root, JWT Auth, Swagger, Business modules |
| **`web`** | React 18 / Vite / Nginx | 80 | `80`, `3000` | Admin & Adjuster web portal + API Reverse Proxy |

---

## 2. One-Time Server Initialization

Once your AWS EC2 instance is created and running:

### Step 2.1: SSH into your EC2 Instance
From your local PC (PowerShell / Terminal):
```powershell
ssh -i "path/to/rentatool-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### Step 2.2: Run the Setup Script
Inside your EC2 terminal:
```bash
# Download and execute setup script
curl -fsSL https://raw.githubusercontent.com/jerun276/RentaTool/jerun-feature/deploy/aws-ec2-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```
*(Or clone the repository first, then run `./deploy/aws-ec2-setup.sh`).*

After setup finishes, activate the Docker group:
```bash
newgrp docker
```

---

## 3. Clone Repository & Configure Environment

```bash
git clone https://github.com/jerun276/RentaTool.git
cd RentaTool
git checkout jerun-feature   # (or dev / main once merged)
```

Create your production secrets file:
```bash
cp .env.production.example .env.production
nano .env.production
```
Update the values:
- `POSTGRES_PASSWORD`: Choose a strong password.
- `JWT_SECRET`: 32+ character secure secret.
- `GEMINI_API_KEY`: Your Google Gemini API key.

Save and exit in nano: `Ctrl + O`, `Enter`, then `Ctrl + X`.

---

## 4. Build & Start the Services

Run this single command:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Docker will:
1. Pull PostgreSQL 16 and start the database.
2. Build and run the Python AI Subsystem.
3. Compile and publish the .NET 9 API monolith.
4. Compile the React Web portal and launch Nginx.

---

## 5. Verify Running Services

### Check Container Status:
```bash
docker compose -f docker-compose.prod.yml ps
```
All containers should display status `Up` or `Up (healthy)`.

### View Live Logs:
```bash
# View logs across all services:
docker compose -f docker-compose.prod.yml logs -f

# Or inspect a specific container:
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f ai_service
docker compose -f docker-compose.prod.yml logs -f web
```

---

## 6. Accessing Your Deployed Applications

Replace `<YOUR_EC2_PUBLIC_IP>` with your instance's public IP:

- **Admin Web Dashboard**: `http://<YOUR_EC2_PUBLIC_IP>` (Port 80) or `http://<YOUR_EC2_PUBLIC_IP>:3000`
- **Backend Swagger UI**: `http://<YOUR_EC2_PUBLIC_IP>/swagger` or `http://<YOUR_EC2_PUBLIC_IP>:5000/swagger`
- **Backend Health Check**: `http://<YOUR_EC2_PUBLIC_IP>:5000/health`
- **AI Subsystem Health Check**: `http://<YOUR_EC2_PUBLIC_IP>:5000/health` (verified through backend)

---

## 7. Connecting the Mobile App (Flutter)

In your mobile project (`RentaTool-mobile/.env`):
```env
API_SCHEME=http
API_PORT=5000
API_PREFIX=api/v1
API_HOST_ANDROID=<YOUR_EC2_PUBLIC_IP>
API_HOST_IOS=<YOUR_EC2_PUBLIC_IP>
API_HOST_WEB=<YOUR_EC2_PUBLIC_IP>
```
Now both Android (physical & emulator) and iOS will communicate directly with your live cloud backend on AWS EC2!

---

## 8. Managing the Server

### Stop all containers (without losing data):
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart after code update:
```bash
git pull origin <your-branch>
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

---

## 9. Automated GitHub Actions CI/CD Setup

With the `.github/workflows/deploy.yml` workflow in place, every push automatically runs tests, builds containers, and deploys directly to your AWS EC2 instance.

### Configuring GitHub Repository Secrets:
Go to your GitHub repository: **Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| **`EC2_HOST`** | `13.250.xxx.xxx` | Your AWS EC2 Public IPv4 address |
| **`EC2_USERNAME`** | `ubuntu` | Default SSH user for Ubuntu instances |
| **`EC2_SSH_KEY`** | `-----BEGIN RSA PRIVATE KEY-----...` | Entire contents of your `rentatool-key.pem` file |

Once configured, pushing any commit to `jerun-feature`, `dev`, or `main` will automatically test and deploy to AWS EC2 without running manual SSH commands!

