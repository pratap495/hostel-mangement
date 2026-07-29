# 🏨 HostelMint

> A production-grade, multi-tenant Hostel Management System built with a React Native (Expo) mobile frontend and a Python microservices backend orchestrated via Docker Compose.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Running on a Physical Device](#-running-on-a-physical-device)
- [Running E2E Integration Tests](#-running-e2e-integration-tests)
- [Key API Routes](#-key-api-routes)
- [Default Credentials](#-default-credentials)
- [Useful Docker Commands](#-useful-docker-commands)
- [Useful Database Queries](#-useful-database-queries)
- [Troubleshooting](#-troubleshooting)

---

## 🌐 Project Overview

HostelMint is a **multi-tenant** hostel management platform supporting two user roles:

| Role | Description |
|------|-------------|
| **Super Admin** | Manages all hostels, owners, rooms, and views global dashboard metrics |
| **Owner** | Manages their specific hostel — rooms, hostelers, income, and inventory |

Each hostel provisioned by the Super Admin automatically gets its own **dedicated PostgreSQL database**, ensuring complete data isolation between hostels.

---

## 🏗️ Architecture

```
React Native App (Expo)
         │
         ▼
  Nginx API Gateway (Port 80)
         │
   ┌─────┴─────┬──────────┬────────────┬──────────────┬──────────────────┐
   │           │          │            │              │                  │
Auth Service  Hostel   Finance    Storage        Notification       MinIO
(Tenants)    Service   Service    Service         Service           (S3)
             (Rooms)  (Income)  (File Vault)    (Push / WS)
   │
PostgreSQL (Central Admin DB + Dynamic Tenant DBs)
   │
Redis (Rate Limiting + Caching)
```

All traffic from the mobile app flows through the **Nginx gateway on port 80**. This ensures a single unified URL works across emulators, simulators, and physical devices.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.10** with **FastAPI**
- **PostgreSQL 15** (Central + Dynamic per-hostel tenant databases)
- **Redis 7** (Rate limiter & session caching)
- **MinIO** (S3-compatible local object storage for hostel images)
- **Nginx** (API Gateway / Reverse Proxy)
- **Docker & Docker Compose**

### Frontend
- **React Native 0.81** with **Expo SDK 54**
- **TypeScript**
- **Redux Toolkit** (state management)
- **React Navigation** (drawer + stack navigation)
- **Axios** (HTTP client)
- **React Hook Form + Yup** (form validation)

---

## ✅ Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Comes with Node.js |
| Expo CLI | Latest | `npm install -g expo-cli` |
| Python | 3.10+ | https://www.python.org (for E2E tests only) |

> **For physical device testing**: Install the **Expo Go** app on your phone from the Play Store / App Store.  
> Alternatively, use the bundled `Expo-Go-57.0.2.apk` in the `frontend/` folder.

---

## 📁 Project Structure

```
Hostel_Hub/
├── backend/                        # All microservices
│   ├── auth_service/               # Authentication + Tenant management
│   ├── hostel_service/             # Rooms + Hostelers management
│   ├── finance_service/            # Income + Inventory ledger
│   ├── storage_service/            # Presigned S3 file uploads
│   ├── notification_service/       # Push notifications + WebSocket events
│   ├── nginx/
│   │   └── nginx.conf              # API Gateway routing config
│   ├── docker-compose.yml          # Orchestrates all services
│   ├── .env.example                # Environment variable reference
│   └── verify_all_phases.py        # E2E integration test script
├── frontend/                       # React Native Expo app
│   ├── src/
│   │   ├── screens/                # App screens (SuperAdmin + Owner + Auth)
│   │   ├── services/               # API service clients
│   │   ├── redux/                  # Redux store + slices
│   │   ├── navigation/             # App navigators
│   │   ├── components/             # Shared UI components
│   │   ├── theme/                  # Design tokens (colors, typography)
│   │   └── types/                  # TypeScript interfaces
│   ├── assets/                     # App icons + images
│   └── package.json
├── docs/                           # Architecture docs
└── README.md
```

---

## 🐳 Backend Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Hostel_Hub
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed (default values work for local development out of the box).

### 3. Start all backend services

```bash
# From the backend/ directory:
docker compose up --build -d
```

This will build and start:
- `hostelmint-postgres` — PostgreSQL on port **5432**
- `hostelmint-redis` — Redis on port **6379**
- `hostelmint-minio` — MinIO on port **9000** (API) / **9001** (Console)
- `hostelmint-nginx` — API Gateway on port **80**
- `hostelmint-auth-service` — Auth + Tenant microservice
- `hostelmint-hostel-service` — Rooms + Hostelers microservice
- `hostelmint-finance-service` — Finance microservice
- `hostelmint-storage-service` — Storage microservice
- `hostelmint-notification-service` — Notifications microservice

### 4. Verify all services are running

```bash
docker compose ps
```

All containers should show status **Up**.

### 5. Check service health

```bash
curl http://localhost/api/v1/auth/health
curl http://localhost/api/v1/rooms/health
curl http://localhost/api/v1/finance/health
curl http://localhost/api/v1/storage/health
curl http://localhost/api/v1/notifications/health
```

Each should return `{"status": "healthy", ...}`.

---

## 📱 Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure API base URL

Open `src/services/apiClient.ts`:

```typescript
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2';   // Android emulator → maps to host localhost
  }
  return 'http://localhost';     // iOS simulator / Web browser
};
```

> **Physical device?** See the [Running on a Physical Device](#-running-on-a-physical-device) section below.

### 3. Start the Expo development server

**For emulator / simulator (same machine):**
```bash
npx expo start
```

**For physical device via Expo tunnel (recommended for phones):**
```bash
npx expo start --tunnel
```

**For web browser preview:**
```bash
npx expo start --web
```

**With cache cleared (use when things seem stale):**
```bash
npx expo start --clear
```

---

## 📲 Running on a Physical Device

When running on a **real phone** (not an emulator), `localhost` won't point to your computer. Use Expo Tunnel mode so the app can reach your backend via ngrok:

### Option A — Expo Tunnel (Recommended)

```bash
# Terminal 1: Start backend
cd backend && docker compose up -d

# Terminal 2: Start frontend with tunnel
cd frontend && npx expo start --tunnel
```

Scan the QR code shown in the terminal with your Expo Go app.  
The tunnel URL (e.g., `https://abc123.ngrok.io`) is automatically used for API calls.

> ⚠️ Tunnel mode routes through ngrok which can be slow. Use your **local Wi-Fi IP** for better performance.

### Option B — Local Wi-Fi IP

1. Find your computer's local IP address:
   - **Windows:** `ipconfig` → look for **IPv4 Address** (e.g., `192.168.1.10`)
   - **Mac/Linux:** `ifconfig` → look for `inet` address

2. Update `src/services/apiClient.ts`:
   ```typescript
   const getBaseUrl = () => {
     return 'http://192.168.1.10'; // ← replace with your actual local IP
   };
   ```

3. Make sure your phone and computer are on the **same Wi-Fi network**.

4. Start Expo normally:
   ```bash
   npx expo start
   ```

---

## 🧪 Running E2E Integration Tests

The `verify_all_phases.py` script runs a full end-to-end test of the entire system including login, hostel provisioning, room creation, bed assignment, finance, and storage.

### Prerequisites

```bash
pip install requests
```

### Run the tests

```bash
cd backend
python verify_all_phases.py
```

### What it tests

| Phase | Description |
|-------|-------------|
| 1 | Health checks for all 5 microservices |
| 2 | Rate limiter brute-force lockout (6th attempt blocked) |
| 3 | Super Admin login + Owner onboarding with temp password |
| 4 | Dynamic tenant database provisioning on hostel creation |
| 5 | Owner force-password-reset flow on first login |
| 6 | Room creation + bed assignment + over-allocation guard |
| 7 | Income logging + inventory pagination |
| 8 | S3 presigned URL upload + download via MinIO |

---

## 🌐 Key API Routes

All routes are prefixed through the Nginx gateway at `http://localhost`.

| Service | Route Prefix | Description |
|---------|-------------|-------------|
| Auth | `/api/v1/auth/` | Login, logout, password change, profile |
| Tenants | `/api/v1/tenants/` | Hostels, owners, dashboard stats |
| Rooms | `/api/v1/rooms/` | Room management |
| Hostelers | `/api/v1/hostelers/` | Resident registration + assignments |
| Finance | `/api/v1/finance/` | Income, inventory |
| Storage | `/api/v1/storage/` | Presigned upload URLs |
| Notifications | `/api/v1/notifications/` | Push + WebSocket events |
| File Vault | `/hostelmint-secure-vault/` | Uploaded hostel images (via MinIO proxy) |

### Interactive API Docs (Swagger UI)

Open in browser after starting the backend:

```
http://localhost/api/v1/auth/docs
```

Use the service selector dropdown to switch between all 5 microservices.

---

## 🔑 Default Credentials

> ⚠️ Change these immediately after first login in production.

| Role | Email | Default Password |
|------|-------|-----------------|
| Super Admin | `superadmin@hostelmint.com` | `SecurePassword123` |
| Owner | Set by Super Admin | Temporary (shown on creation) |

On first login, **owners are forced to change their password** before accessing the app.

### MinIO Console (File Storage)

```
URL:      http://localhost:9001
Username: minioadmin
Password: minioadminpassword
```

---

## 🐳 Useful Docker Commands

```bash
# Start all services (from backend/)
docker compose up -d

# Start and rebuild changed services
docker compose up --build -d

# Rebuild a specific service only
docker compose up -d --build auth-service

# Stop all services
docker compose down

# Stop and delete all data volumes (full reset)
docker compose down -v

# View logs for a specific service
docker compose logs auth-service --tail=50 -f

# View logs for all services
docker compose logs --tail=30

# Check container status
docker compose ps

# Restart a single service
docker compose restart auth-service
```

---

## 🗄️ Useful Database Queries

Connect to the PostgreSQL container:

```bash
# Connect to central admin database
docker compose exec postgres-db psql -U central_admin -d hostelmint_admin_db

# List all provisioned tenant databases
docker compose exec postgres-db psql -U central_admin -d hostelmint_admin_db \
  -c "SELECT hostel_id, db_name FROM tenant_databases;"

# Connect to a specific hostel's tenant database
docker compose exec postgres-db psql -U central_admin \
  -d hostelmint_hostel_<hostel_uuid_with_underscores>_db
```

> **Note:** UUID dashes `-` are replaced with underscores `_` in the database name.  
> e.g., `aa9e949a-c596-44e8-9ca3-236e0a591e38` → `hostelmint_hostel_aa9e949a_c596_44e8_9ca3_236e0a591e38_db`

```bash
# Count occupied beds in a hostel
docker compose exec postgres-db psql -U central_admin \
  -d hostelmint_hostel_<hostel_db_name> \
  -c "SELECT COUNT(*) AS occupied_beds FROM room_assignments WHERE is_active = true AND transferred_date IS NULL;"

# List all active hostelers in a hostel
docker compose exec postgres-db psql -U central_admin \
  -d hostelmint_hostel_<hostel_db_name> \
  -c "SELECT name, email, room_number FROM hostelers WHERE is_active = true AND is_deleted = false;"

# List all rooms with occupancy
docker compose exec postgres-db psql -U central_admin \
  -d hostelmint_hostel_<hostel_db_name> \
  -c "SELECT room_number, capacity, floor_number FROM rooms ORDER BY room_number;"

# Reset Redis rate limiter cache (if locked out of login)
docker compose exec redis-broker redis-cli FLUSHALL
```

---

## 🛠️ Troubleshooting

### App shows "Network Error" or can't connect

- Ensure `docker compose up -d` is running and all containers are healthy
- Verify the `API_BASE_URL` in `src/services/apiClient.ts` matches your setup:
  - Android Emulator → `http://10.0.2.2`
  - iOS Simulator / Browser → `http://localhost`
  - Physical Device (Wi-Fi) → your machine's local IP e.g. `http://192.168.x.x`
  - Physical Device (Tunnel) → no change needed, tunnel URL is auto-configured

### Login returns 403 Forbidden

- Your JWT token may be expired — log out and log back in
- If logging in for the first time after a fresh database reset, try the default credentials above

### Login returns 429 Too Many Requests

- The rate limiter locked you out after 5 failed attempts
- Wait a few minutes, or flush Redis to reset immediately:
  ```bash
  docker compose exec redis-broker redis-cli FLUSHALL
  ```

### Images not loading on physical device

- Images are served through the Nginx gateway on port 80
- Make sure the `API_BASE_URL` is correctly set to your machine's IP (not `localhost`)

### "Hostel not found" after creating a hostel

- This was a known bug (now fixed) where a mock ID was used instead of the backend UUID
- Ensure you are on the latest version of the code

### Database errors after `docker compose down -v`

- All data is wiped when using the `-v` flag (volumes deleted)
- The Super Admin account will be re-seeded automatically on next startup
- You will need to re-create hostels and owners

### Container fails to start

```bash
# Check logs for the failing container
docker compose logs <service-name> --tail=50

# Common fix: rebuild with no cache
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

---

## 📄 License

This project is licensed under the MIT License. See the `frontend/LICENSE` file for details.


hi this is pratap

