# S2R2 Inventory Management System

**Enterprise IoT & Inventory Platform** · Version 1.0  
Built by **Civitas Atlas Technologies Pvt. Ltd.** for **S2R2 Technologies**, Pune, India  
**Contact:** civitasatlasco@gmail.com

---

## 🚀 Overview

S2R2 IMS is a complete inventory management platform featuring:
- **Real-time stock tracking** with IoT device integration
- **AI-powered Decision Intelligence** (Civi AI) for reorder alerts & replenishment planning
- **Bill of Materials (BOM)** management with automatic manufacturing logic
- **Role-based access control** (ADMIN / EDITOR / VIEWER)
- **Animated Civi AI icon** - Gemini-style hexagonal design with slow rotation
- **Trial/License system** with instant activation
- **Complete audit trail** with activity logging
- **Responsive UI** with dark mode support

---

## 🎨 Brand Identity

### Civi AI Icon
- **Design:** Animated hexagonal icon (Gemini AI inspired)
- **Style:** Thick strokes (2.5px), purple gradient (#7c3aed → #a855f7 → #c084fc)
- **Animation:** Slow rotation (12s outer, 15s inner counter-rotation, 3s pulse)
- **Usage:** Header, sidebar, intelligence pages, chat avatars
- **Component:** `frontend/components/CiviAIIcon.tsx`

### Copyright
**© 2026 Civitas Atlas Technologies Pvt. Ltd., Pune**  
Used in footer and all generated reports/exports

---

## 📦 Stack

| Layer    | Technology                                     |
|----------|------------------------------------------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Backend  | Node.js, Express 4, Prisma 5, JWT, bcryptjs    |
| Database | PostgreSQL 17 (local)                          |
| AI       | Gemini 2.0 Flash (Decision Intelligence)      |

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **Authentication** | JWT login, bcrypt password hashing, role-based access (ADMIN / EDITOR / VIEWER) |
| **Dashboard** | 4-tab live dashboard: Real-Time Stock, Low Stock Alerts, Cost/Price Analysis, Recent Issuances |
| **Raw Materials** | Full CRUD, **Inward** (receive stock) + **Outward** (issue stock), Excel bulk import with template, category filter, stock status, price, CSV/Excel/PDF export |
| **Finished Products** | Full CRUD, **Inward** / **Outward** / **Manufacture** (BOM-driven), Excel bulk import with template, BOM editor in add/edit modal, stock tracking, CSV/Excel/PDF export |
| **Bill of Materials (BOM)** | Define components per finished product, per-material feasibility (green/red), material cost per unit — ADMIN + EDITOR only |
| **Manufacture Logic** | Pressing Manufacture deducts raw material stock automatically per BOM, validates sufficiency before proceeding |
| **Inventory Transactions** | Full audit log of every INWARD / OUTWARD / MANUFACTURE movement with user attribution |
| **Clients** | Full CRUD, card + table view, Excel bulk import with preview, CSV/Excel/PDF export |
| **IoT Devices** | Full CRUD, ping, ONLINE/OFFLINE/MAINTENANCE status tracking |
| **Activity Log** | Paginated audit trail — module, action, username, timestamp |
| **Reports** | 4-tab report view with date range filter, CSV/Excel/PDF download per module |
| **Admin Panel** | User management (CRUD), live permission matrix, trial/license status card |
| **Notifications** | Bell icon in header with badge count, bottom-right popup (10s auto-dismiss), `/notifications` subpage grouped by urgency |
| **Decision Intelligence (Civi AI)** | AI-powered reorder alerts, manufacture readiness, replenishment plan with cost, 30-day velocity analytics |
| **Civi AI Chat** | Real-time chat assistant for inventory queries and recommendations |
| **Exports** | All exports branded: "Generated using Civi API \| By Civitas Atlas Co, Pune" |
| **Dark Mode** | Persistent, flash-free, system-aware |
| **Responsive UI** | Mobile sidebar, collapsible nav, card/table toggle |

---

## 🏗️ Project Structure

```
s2r2-inventory/
├── frontend/                      # Next.js 14 app (port 3000)
│   ├── app/                       # Pages (App Router)
│   │   ├── page.tsx               # Dashboard (4-tab)
│   │   ├── raw-materials/         # CRUD + Inward/Outward + Excel Import
│   │   ├── finished-products/     # CRUD + Inward/Outward/Manufacture + Excel Import + BOM editor
│   │   ├── bom/                   # BOM management (ADMIN + EDITOR)
│   │   ├── clients/               # CRUD + Excel Import
│   │   ├── iot-devices/           # CRUD + Ping
│   │   ├── reports/               # Multi-tab export
│   │   ├── intelligence/          # Civi AI Decision Intelligence
│   │   │   └── chat/              # Civi AI Chat Assistant
│   │   ├── notifications/         # Stock alerts subpage
│   │   ├── admin/                 # User management + trial status
│   │   ├── login/                 # Auth
│   │   └── trial-expired/         # License key entry
│   ├── components/
│   │   ├── AppShell.tsx           # Auth guard + inactivity timeout + notification popup
│   │   ├── Header.tsx             # Navigation + Civi AI icon + bell icon with badge
│   │   ├── Sidebar.tsx            # Nav (role-filtered) + Civi AI icon
│   │   ├── Footer.tsx             # Protected branding (integrity check)
│   │   └── CiviAIIcon.tsx         # Animated hexagonal icon (Gemini-style)
│   ├── lib/
│   │   ├── api.ts                 # Centralised API client (all fetch calls)
│   │   ├── permissions.ts         # Role-based permission matrix
│   │   ├── notifications.ts       # Shared notification store (single fetch/session)
│   │   ├── useTrialStatus.ts      # Trial countdown hook
│   │   └── useInactivityTimeout.ts# 10-minute inactivity logout
│   └── types/
│       └── index.ts               # All TypeScript interfaces
│
└── backend/                       # Express 4 API (port 4000)
    ├── server.js                  # App setup, middleware, route registration
    ├── prisma/
    │   ├── schema.prisma          # DB models: User, RawMaterial, FinishedProduct,
    │   │                          # Client, IoTDevice, ActivityLog, BillOfMaterials,
    │   │                          # InventoryTransaction
    │   └── seed.js                # Users + sample data + real-life BOM mappings
    └── src/
        ├── middleware/
        │   ├── auth.js            # JWT verify, requireAuth, requireRole
        │   ├── trial.js           # License key validation, plan expiry
        │   └── integrity.js       # Ownership HMAC check (startup + per-request)
        └── routes/
            ├── auth.js            # POST /api/auth/login
            ├── rawMaterials.js    # CRUD + Inward + Outward + Import + PDF export
            ├── finishedProducts.js# CRUD + Import + PDF export
            ├── clients.js         # CRUD + Import + PDF export
            ├── dashboard.js       # Stats aggregation (4-tab dashboard)
            ├── manufacture.js     # BOM CRUD, feasibility, produce, inward/outward, transactions
            ├── intelligence.js    # Civi AI: reorder alerts, readiness, replenishment, velocity + Chat
            ├── activity.js        # Paginated activity log
            ├── iotDevices.js      # IoT device CRUD + ping
            ├── users.js           # User management (ADMIN)
            └── trial.js           # POST /api/trial/activate
```

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 17 installed and running locally

### 1 — Clone & install

```bash
git clone <repo-url>
cd s2r2-inventory
cd backend  && npm install
cd ../frontend && npm install
```

### 2 — Create the local database

Contact civitasatlasco@gmail.com for DB setup credentials.  
SQL setup script is in `backend/setup-local-db.sql`.

### 3 — Configure environment files

`backend/.env` and `frontend/.env.local` are **not in the repository** — obtain from your administrator.

**Required `backend/.env` variables:**

| Variable            | Description |
|---------------------|-------------|
| `OWNER_SIG`         | Ownership signature (tamper protection — do not change) |
| `DATABASE_URL`      | PostgreSQL connection string |
| `JWT_SECRET`        | JWT signing secret |
| `PORT`              | API port (default 4000) |
| `FRONTEND_URL`      | Frontend origin for CORS |
| `TRIAL_LICENSE_KEY` | License key — contact civitasatlasco@gmail.com |
| `GEMINI_API_KEY`    | Gemini AI API key for Civi AI features |

**Required `frontend/.env.local` variable:**

| Variable              | Description |
|-----------------------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### 4 — Push schema & seed

```bash
cd backend
npm run db:push   # creates all tables
npm run db:seed   # creates 8 users + sample data
```

### 5 — Run both servers

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Login Credentials

Seeded by `npm run db:seed`.

| Username  | Password       | Role   |
|-----------|----------------|--------|
| `sandeep` | `Sandeep@2025` | ADMIN  |
| `rohan`   | `Rohan@2025`   | ADMIN  |
| `akshay`  | `Akshay@2025`  | ADMIN  |
| `emp1`    | `Emp1@2025`    | EDITOR |
| `emp2`    | `Emp2@2025`    | EDITOR |
| `emp3`    | `Emp3@2025`    | EDITOR |
| `emp4`    | `Emp4@2025`    | EDITOR |
| `emp5`    | `Emp5@2025`    | EDITOR |

> **Note:** Keep these credentials private. Do not commit them to version control.

---

## 📜 Trial / License

### How it works

1. `TRIAL_LICENSE_KEY` in `backend/.env` activates the plan at startup.
2. Every API request is checked against the expiry before reaching any route.
3. On expiry, users see `/trial-expired` — enter a renewal key to restore access instantly.
4. Entering a valid key updates the in-memory expiry — **no data is reset, no restart needed**.

### Plans (start date: 19 Aug 2026)

| Plan | Expires |
|------|---------|
| 1-month | 19 Sep 2026 |
| 6-month | 19 Feb 2027 |
| 1-year | 19 Aug 2027 |

License keys issued exclusively by Civitas Atlas Technologies Pvt. Ltd.  
Contact: civitasatlasco@gmail.com

### Trial status (Admin panel)

The Admin panel shows a live license card with:
- Plan name + expiry date and time
- Days + hours remaining (accurate calendar calculation)
- Next plan upgrade suggestion
- Direct contact link

### Verify via health endpoint

```bash
GET /health
→ { "status": "ok", "trial": { "mode": "1-month plan", "expired": false, "daysRemaining": 33, ... } }
```

---

## 🔒 Integrity & Ownership Protection

| What is checked | When | On failure |
|-----------------|------|-----------|
| All required env vars present | Startup + every request | Server exits / 503 |
| `OWNER_SIG` matches ownership signature | Startup + every request | Server exits / 503 |
| PostgreSQL reachable | Startup | Server exits |
| Footer branding constants intact | Frontend runtime | Full-screen lock with builder key bypass |

**Do not:**
- Remove or change `OWNER_SIG` in `.env`
- Delete or modify `backend/src/middleware/integrity.js`
- Remove "Civitas Atlas Technologies" from `Footer.tsx`

Builder override key available for Civitas Atlas team — contact civitasatlasco@gmail.com.

---

## 🌐 API Reference

Base URL: `http://localhost:4000`  
Protected routes require: `Authorization: Bearer <token>`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/dashboard` | Yes | Stats summary |
| GET/POST/PUT/DELETE | `/api/raw-materials` | Yes | Raw materials CRUD |
| GET | `/api/raw-materials/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/finished-products` | Yes | Finished products CRUD |
| GET | `/api/finished-products/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/clients` | Yes | Clients CRUD |
| POST | `/api/clients/import` | Yes | Bulk Excel import |
| GET | `/api/clients/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/iot-devices` | Yes | IoT devices CRUD |
| PATCH | `/api/iot-devices/:id/ping` | Yes | Ping device |
| GET | `/api/activity` | Yes | Activity log |
| DELETE | `/api/activity` | ADMIN | Clear log |
| GET/POST/PUT/DELETE | `/api/users` | ADMIN | User management |
| GET | `/api/intelligence` | Yes | Civi AI analytics |
| POST | `/api/intelligence/chat` | Yes | Civi AI chat assistant |
| POST | `/api/trial/activate` | No | Activate license key |
| GET | `/health` | No | Health + trial status |

---

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| `User` | App users with role (ADMIN/EDITOR/VIEWER) |
| `RawMaterial` | Raw material records with quantity, price, stock tracking |
| `FinishedProduct` | Finished goods with qty, price, ACTIVE/HOLD status |
| `Client` | Client records with GST, contact, status |
| `IoTDevice` | IoT device registry with status and ping tracking |
| `ActivityLog` | Audit trail of all create/update/delete actions |
| `BillOfMaterials` | Component mappings for finished products |
| `InventoryTransaction` | All stock movements (INWARD/OUTWARD/MANUFACTURE) |

---

## 👥 Role Permissions

| Action | ADMIN | EDITOR | VIEWER |
|--------|-------|--------|--------|
| View all pages | ✅ | ✅ | ✅ |
| Add records | ✅ | ✅ | ❌ |
| Edit records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| BOM Management | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |
| Civi AI | ✅ | ✅ | ✅ |

---

## 🛠️ Scripts

```bash
# Backend
npm run dev        # nodemon dev server :4000
npm run start      # production server
npm run db:push    # push schema to DB
npm run db:seed    # seed users + sample data
npm run db:studio  # Prisma Studio GUI

# Frontend
npm run dev        # Next.js dev server :3000
npm run build      # production build
npm run lint       # ESLint
```

---

## 🤖 Civi AI Features

### Decision Intelligence (`/intelligence`)
- **Reorder Alerts:** Items below reorder threshold
- **Manufacture Readiness:** Products with sufficient raw materials
- **Replenishment Plan:** Priority restocking with cost estimates
- **30-Day Velocity:** Consumption trends and forecasting
- **AI Narrative:** Natural language insights from Gemini 2.0 Flash

### Chat Assistant (`/intelligence/chat`)
- Real-time inventory queries
- Natural language responses
- Context-aware recommendations
- Stock analysis and suggestions
- Quick starter prompts

---

## 📞 Contact & Support

**Civitas Atlas Technologies Pvt. Ltd.**  
Pune, India  
📧 [civitasatlasco@gmail.com](mailto:civitasatlasco@gmail.com)

---

## 📄 License

Proprietary software owned by **Civitas Atlas Technologies Pvt. Ltd.**  
See `LICENSE.md` for complete terms.

---

*© 2026 Civitas Atlas Technologies Pvt. Ltd., Pune. All rights reserved.*

| Module | Capabilities |
|--------|-------------|
| **Authentication** | JWT login, bcrypt password hashing, role-based access (ADMIN / EDITOR / VIEWER) |
| **Dashboard** | 4-tab live dashboard: Real-Time Stock, Low Stock Alerts, Cost/Price Analysis, Recent Issuances |
| **Raw Materials** | Full CRUD, **Inward** (receive stock) + **Outward** (issue stock), Excel bulk import with template, category filter, stock status, price, CSV/Excel/PDF export |
| **Finished Products** | Full CRUD, **Inward** / **Outward** / **Manufacture** (BOM-driven), Excel bulk import with template, BOM editor in add/edit modal, stock tracking, CSV/Excel/PDF export |
| **Bill of Materials (BOM)** | Define components per finished product, per-material feasibility (green/red), material cost per unit — ADMIN + EDITOR only |
| **Manufacture Logic** | Pressing Manufacture deducts raw material stock automatically per BOM, validates sufficiency before proceeding |
| **Inventory Transactions** | Full audit log of every INWARD / OUTWARD / MANUFACTURE movement with user attribution |
| **Clients** | Full CRUD, card + table view, Excel bulk import with preview, CSV/Excel/PDF export |
| **IoT Devices** | Full CRUD, ping, ONLINE/OFFLINE/MAINTENANCE status tracking |
| **Activity Log** | Paginated audit trail — module, action, username, timestamp |
| **Reports** | 4-tab report view with date range filter, CSV/Excel/PDF download per module |
| **Admin Panel** | User management (CRUD), live permission matrix, trial/license status card |
| **Notifications** | Bell icon in header with badge count, bottom-right popup (10s auto-dismiss), `/notifications` subpage grouped by urgency — SRS §3.4 |
| **Decision Intelligence** | Civi AI page: reorder alerts, manufacture readiness, replenishment plan with cost, 30-day velocity — SRS §3.5 |
| **Exports** | All exports branded: "Generated using Civi API \| By Civitas Atlas Co, Pune" |
| **Dark Mode** | Persistent, flash-free, system-aware |
| **Responsive UI** | Mobile sidebar, collapsible nav, card/table toggle |

---

## Project Structure

```
s2r2-inventory/
├── frontend/                      # Next.js 14 app (port 3000)
│   ├── app/                       # Pages (App Router)
│   │   ├── page.tsx               # Dashboard (4-tab)
│   │   ├── raw-materials/         # CRUD + Inward/Outward + Excel Import
│   │   ├── finished-products/     # CRUD + Inward/Outward/Manufacture + Excel Import + BOM editor
│   │   ├── bom/                   # BOM management (ADMIN + EDITOR)
│   │   ├── clients/               # CRUD + Excel Import
│   │   ├── iot-devices/           # CRUD + Ping
│   │   ├── reports/               # Multi-tab export
│   │   ├── intelligence/          # Civi AI Decision Intelligence (SRS §3.5)
│   │   ├── notifications/         # Stock alerts subpage (SRS §3.4)
│   │   ├── admin/                 # User management + trial status
│   │   ├── login/                 # Auth
│   │   └── trial-expired/         # License key entry
│   ├── components/
│   │   ├── AppShell.tsx           # Auth guard + inactivity timeout + notification popup
│   │   ├── Header.tsx             # Navigation + bell icon with badge
│   │   ├── Sidebar.tsx            # Nav (role-filtered)
│   │   └── Footer.tsx             # Protected branding (integrity check)
│   ├── lib/
│   │   ├── api.ts                 # Centralised API client (all fetch calls)
│   │   ├── permissions.ts         # Role-based permission matrix
│   │   ├── notifications.ts       # Shared notification store (single fetch/session)
│   │   ├── useTrialStatus.ts      # Trial countdown hook
│   │   └── useInactivityTimeout.ts# 10-minute inactivity logout
│   └── types/
│       └── index.ts               # All TypeScript interfaces
│
└── backend/                       # Express 4 API (port 4000)
    ├── server.js                  # App setup, middleware, route registration
    ├── prisma/
    │   ├── schema.prisma          # DB models: User, RawMaterial, FinishedProduct,
    │   │                          # Client, IoTDevice, ActivityLog, BillOfMaterials,
    │   │                          # InventoryTransaction
    │   └── seed.js                # Users + sample data + real-life BOM mappings
    └── src/
        ├── middleware/
        │   ├── auth.js            # JWT verify, requireAuth, requireRole
        │   ├── trial.js           # License key validation, plan expiry
        │   └── integrity.js       # Ownership HMAC check (startup + per-request)
        └── routes/
            ├── auth.js            # POST /api/auth/login
            ├── rawMaterials.js    # CRUD + Inward + Outward + Import + PDF export
            ├── finishedProducts.js# CRUD + Import + PDF export
            ├── clients.js         # CRUD + Import + PDF export
            ├── dashboard.js       # Stats aggregation (4-tab dashboard)
            ├── manufacture.js     # BOM CRUD, feasibility, produce, inward/outward, transactions
            ├── intelligence.js    # Civi AI: reorder alerts, readiness, replenishment, velocity
            ├── activity.js        # Paginated activity log
            ├── iotDevices.js      # IoT device CRUD + ping
            ├── users.js           # User management (ADMIN)
            └── trial.js           # POST /api/trial/activate
```

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 17 installed and running locally

### 1 — Clone & install

```bash
git clone <repo-url>
cd s2r2-inventory
cd backend  && npm install
cd ../frontend && npm install
```

### 2 — Create the local database

Contact civitasatlasco@gmail.com for DB setup credentials.  
SQL setup script is in `backend/setup-local-db.sql`.

### 3 — Configure environment files

`backend/.env` and `frontend/.env.local` are **not in the repository** — obtain from your administrator.

**Required `backend/.env` variables:**

| Variable            | Description |
|---------------------|-------------|
| `OWNER_SIG`         | Ownership signature (tamper protection — do not change) |
| `DATABASE_URL`      | PostgreSQL connection string |
| `JWT_SECRET`        | JWT signing secret |
| `PORT`              | API port (default 4000) |
| `FRONTEND_URL`      | Frontend origin for CORS |
| `TRIAL_LICENSE_KEY` | License key — contact civitasatlasco@gmail.com |

**Required `frontend/.env.local` variable:**

| Variable              | Description |
|-----------------------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### 4 — Push schema & seed

```bash
cd backend
npm run db:push   # creates all tables
npm run db:seed   # creates 8 users + sample data
```

### 5 — Run both servers

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

Seeded by `npm run db:seed`.

| Username  | Password       | Role   |
|-----------|----------------|--------|
| `sandeep` | `Sandeep@2025` | ADMIN  |
| `rohan`   | `Rohan@2025`   | ADMIN  |
| `akshay`  | `Akshay@2025`  | ADMIN  |
| `emp1`    | `Emp1@2025`    | EDITOR |
| `emp2`    | `Emp2@2025`    | EDITOR |
| `emp3`    | `Emp3@2025`    | EDITOR |
| `emp4`    | `Emp4@2025`    | EDITOR |
| `emp5`    | `Emp5@2025`    | EDITOR |

> **Note:** Keep these credentials private. Do not commit them to version control.

---

## Trial / License

### How it works

1. `TRIAL_LICENSE_KEY` in `backend/.env` activates the plan at startup.
2. Every API request is checked against the expiry before reaching any route.
3. On expiry, users see `/trial-expired` — enter a renewal key to restore access instantly.
4. Entering a valid key updates the in-memory expiry — **no data is reset, no restart needed**.

### Plans (start date: 19 Aug 2026)

| Plan | Expires |
|------|---------|
| 1-month | 19 Sep 2026 |
| 6-month | 19 Feb 2027 |
| 1-year | 19 Aug 2027 |

License keys issued exclusively by Civitas Atlas Technologies Pvt. Ltd.  
Contact: civitasatlasco@gmail.com

### Trial status (Admin panel)

The Admin panel shows a live license card with:
- Plan name + expiry date and time
- Days + hours remaining (accurate calendar calculation)
- Next plan upgrade suggestion
- Direct contact link

### Verify via health endpoint

```bash
GET /health
→ { "status": "ok", "trial": { "mode": "1-month plan", "expired": false, "daysRemaining": 33, ... } }
```

---

## Integrity & Ownership Protection

| What is checked | When | On failure |
|-----------------|------|-----------|
| All required env vars present | Startup + every request | Server exits / 503 |
| `OWNER_SIG` matches ownership signature | Startup + every request | Server exits / 503 |
| PostgreSQL reachable | Startup | Server exits |
| Footer branding constants intact | Frontend runtime | Full-screen lock with builder key bypass |

**Do not:**
- Remove or change `OWNER_SIG` in `.env`
- Delete or modify `backend/src/middleware/integrity.js`
- Remove "Civitas Atlas Technologies" from `Footer.tsx`

Builder override key available for Civitas Atlas team — contact civitasatlasco@gmail.com.

---

## API Reference

Base URL: `http://localhost:4000`  
Protected routes require: `Authorization: Bearer <token>`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/dashboard` | Yes | Stats summary |
| GET/POST/PUT/DELETE | `/api/raw-materials` | Yes | Raw materials CRUD |
| GET | `/api/raw-materials/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/finished-products` | Yes | Finished products CRUD |
| GET | `/api/finished-products/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/clients` | Yes | Clients CRUD |
| POST | `/api/clients/import` | Yes | Bulk Excel import |
| GET | `/api/clients/export/pdf` | Yes | PDF export |
| GET/POST/PUT/DELETE | `/api/iot-devices` | Yes | IoT devices CRUD |
| PATCH | `/api/iot-devices/:id/ping` | Yes | Ping device |
| GET | `/api/activity` | Yes | Activity log |
| DELETE | `/api/activity` | ADMIN | Clear log |
| GET/POST/PUT/DELETE | `/api/users` | ADMIN | User management |
| POST | `/api/trial/activate` | No | Activate license key |
| GET | `/health` | No | Health + trial status |

---

## Database Models

| Model | Description |
|-------|-------------|
| `User` | App users with role (ADMIN/EDITOR/VIEWER) |
| `RawMaterial` | Raw material records with quantity, price, stock tracking |
| `FinishedProduct` | Finished goods with qty, price, ACTIVE/HOLD status |
| `Client` | Client records with GST, contact, status |
| `IoTDevice` | IoT device registry with status and ping tracking |
| `ActivityLog` | Audit trail of all create/update/delete actions |

---

## Role Permissions

| Action | ADMIN | EDITOR | VIEWER |
|--------|-------|--------|--------|
| View all pages | ✅ | ✅ | ✅ |
| Add records | ✅ | ✅ | ❌ |
| Edit records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |

---

## Scripts

```bash
# Backend
npm run dev        # nodemon dev server :4000
npm run start      # production server
npm run db:push    # push schema to DB
npm run db:seed    # seed users + sample data
npm run db:studio  # Prisma Studio GUI

# Frontend
npm run dev        # Next.js dev server :3000
npm run build      # production build
npm run lint       # ESLint
```

---

## Contact & Support

**Civitas Atlas Technologies Pvt. Ltd.**, Pune, India  
[civitasatlasco@gmail.com](mailto:civitasatlasco@gmail.com)

---

*© Civitas Atlas Technologies Pvt. Ltd., Pune, India. All rights reserved.*
