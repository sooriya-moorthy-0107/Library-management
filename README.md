# 📚 Lumina Library Management System

A full-stack **Library Management System** built with **React + Vite** (frontend) and **NestJS + PostgreSQL** (backend), with an automatic **SQLite fallback** for zero-config local development.

---

## 🚀 Quick Start (No Docker Required)

The backend auto-detects if PostgreSQL is available. If not, it **silently falls back to SQLite** and seeds itself on first boot. You can be up and running in 2 commands.

### 1. Start the Backend

```bash
cd backend
npm install        # first time only
npm run start:dev  # starts on http://localhost:3000
```

On first boot you'll see:
```
PostgreSQL database is unreachable ... Falling back to local SQLite.
Database is empty. Starting database seeding...
Database seeding successfully completed! Ready for usage.
```

### 2. Start the Frontend

```bash
cd frontend
npm install        # first time only
npm run dev        # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

All accounts use password: **`password123`**

| Role | Email | Portal | Notes |
|------|-------|--------|-------|
| **Student** | `sarah@college.edu.in` | `/portal/student` | Has active loans + overdue fine |
| **Librarian** | `john@college.edu.in` | `/portal/librarian` | Requires MFA code: `123456` |
| **Coordinator** | `julian@college.edu.in` | `/portal/librarian` | Book request approvals |
| **Administrator** | `elena@college.edu.in` | `/portal/dashboard` | Requires MFA code: `123456` |
| **Super Admin** | `super@college.edu.in` | `/portal/dashboard` | Requires MFA code: `123456` |

---

## 🐳 Full Stack with Docker (Optional)

If you want the real PostgreSQL + Redis setup:

```bash
# From repo root
docker compose up -d

# Then start backend (will connect to PostgreSQL instead of SQLite)
cd backend && npm run start:dev
```

---

## 🗂 Project Structure

```
libary-mangement-system/
├── backend/                   # NestJS API Server (port 3000)
│   ├── src/
│   │   ├── auth/              # JWT auth, MFA challenge
│   │   ├── books/             # Catalog CRUD, copy management
│   │   ├── circulation/       # Issue, return, renew, requests
│   │   ├── fines/             # Fine collection, waivers
│   │   ├── reports/           # KPIs, trends, audit log
│   │   ├── settings/          # System configuration
│   │   ├── entities/          # TypeORM entities (10 tables)
│   │   └── db/                # DB config (PG → SQLite fallback) + seed
│   └── .env                   # Environment variables
├── frontend/                  # React + Vite (port 5173)
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── StudentPortal.tsx
│       │   ├── LibrarianPortal.tsx
│       │   ├── ExecutiveDashboard.tsx
│       │   ├── CatalogManagement.tsx
│       │   └── VerifyCertificate.tsx
│       └── store/useLmsStore.ts    # Zustand auth + API store
├── docker-compose.yml         # PostgreSQL 16 + Redis 7
└── docs/                      # PRD and design references
```

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api/v1`. JWT required unless noted.

| Module | Endpoint | Access |
|--------|----------|--------|
| Auth | `POST /auth/login` | Public |
| Auth | `POST /auth/mfa/verify` | Public |
| Auth | `GET /auth/me` | Authenticated |
| Books | `GET /books` | All staff + students |
| Books | `POST /books` | Librarian+ |
| Books | `PATCH /books/:id` | Librarian+ |
| Books | `POST /books/:id/copies` | Librarian+ |
| Circulation | `GET /circulation/my-loans` | Student |
| Circulation | `POST /circulation/issue` | Librarian |
| Circulation | `POST /circulation/return` | Librarian |
| Circulation | `POST /circulation/renew/:id` | Student / Librarian |
| Circulation | `GET /circulation/requests` | All |
| Circulation | `PATCH /circulation/requests/:id/approve` | Coordinator+ |
| Fines | `GET /fines/my-fines` | Student |
| Fines | `POST /fines/collect/:id` | Librarian |
| Fines | `POST /fines/waive/:id` | Librarian |
| Reports | `GET /reports/kpis` | Staff |
| Reports | `GET /reports/activity` | Staff |
| Reports | `GET /reports/overdue` | Staff |
| Reports | `GET /reports/top-books` | Staff |
| Reports | `GET /reports/audit` | Admin |
| Settings | `GET /settings` | Librarian+ |
| Settings | `PATCH /settings/:key` | Admin |

---

## 🛡 Security Notes

- JWT tokens expire in **8 hours**
- Account **locked for 15 minutes** after 5 failed login attempts
- MFA required for Librarian, Admin, and Super Admin roles
- All destructive actions are audit-logged

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Zustand, TanStack Query, Recharts |
| Backend | NestJS 11, TypeORM, TypeScript |
| Database | PostgreSQL 16 (primary) / SQLite (local fallback) |
| Auth | JWT (jsonwebtoken), MFA simulation |
| DevOps | Docker Compose (PostgreSQL + Redis) |
