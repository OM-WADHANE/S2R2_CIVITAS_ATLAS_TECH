# S2R2 Inventory — Backend

**Express 4 + Prisma 5 + PostgreSQL 17**  
Built by Civitas Atlas Technologies Pvt. Ltd., Pune  
Contact: civitasatlasco@gmail.com

---

## Quick Start

```powershell
cd backend
npm install
npm run db:push    # sync schema to PostgreSQL
npm run db:seed    # seed users + sample data + BOM
npm run dev        # start dev server on :4000
```

Verify: `GET http://localhost:4000/health`

---

## Performance & Optimization

**Tested:** 5 concurrent users (3 ADMIN, 2 EDITOR)  
- 30 requests in 1.03s  
- 0 conflicts / race conditions  
- Avg response: 41ms (min 6ms, max 274ms)  
- 100% success rate

**Database:** Transaction isolation level `READ COMMITTED` prevents race conditions  
**Concurrency:** Prisma connection pooling handles multiple simultaneous requests  
**Security:** JWT tokens, bcrypt passwords, role-based access control

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.x | HTTP framework |
| @prisma/client | 5.x | PostgreSQL ORM |
| jsonwebtoken | 9.x | JWT auth tokens |
| bcryptjs | 2.x | Password hashing |
| groq-sdk | latest | Civi AI (decision intelligence) |
| pdfkit | 0.x | PDF report generation |
| cors | 2.x | Cross-origin resource sharing |
| helmet | 7.x | HTTP security headers |
| morgan | 1.x | HTTP request logging |
| xlsx | 0.x | Excel import parsing |

---

## Environment Variables (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OWNER_SIG` | ✅ Yes | Ownership HMAC signature — **do not change** |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | JWT signing secret |
| `PORT` | No | API port (default: `4000`) |
| `FRONTEND_URL` | ✅ Yes | Frontend origin for CORS |
| `TRIAL_LICENSE_KEY` | ✅ Yes | License key (contact civitasatlasco@gmail.com) |
| `TRIAL_ENABLED` | No | `false` = fully licensed, no expiry |
| `GROQ_API_KEY` | No | Groq API key for Civi AI narrative |

Example `DATABASE_URL`:
```
postgresql://s2r2_user:s2r2pass@localhost:5432/s2r2_inventory
```

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm run start` | Start production server |
| `npm run db:push` | Apply Prisma schema to DB (no migration files) |
| `npm run db:seed` | Seed users, raw materials, products, clients, BOM |
| `npm run db:studio` | Open Prisma Studio GUI at `http://localhost:5555` |

---

## Project Structure

```
backend/
├── server.js                  # App entry point — middleware + route registration
├── .env                       # Environment variables (not in git)
├── package.json
├── prisma/
│   ├── schema.prisma          # DB schema (models, enums, relations)
│   └── seed.js                # Seed script
└── src/
    ├── middleware/
    │   ├── auth.js            # requireAuth, requireRole
    │   ├── trial.js           # License key + plan expiry check
    │   └── integrity.js       # Ownership HMAC startup + runtime check
    └── routes/
        ├── auth.js            # POST /api/auth/login
        ├── rawMaterials.js    # CRUD + Inward + Outward + Import + PDF export
        ├── finishedProducts.js# CRUD + Import + PDF export
        ├── clients.js         # CRUD + Import + PDF export
        ├── dashboard.js       # Stats aggregation
        ├── manufacture.js     # BOM CRUD, feasibility, produce, transactions
        ├── intelligence.js    # Civi AI: reorder, readiness, replenishment, PDF, chat
        ├── activity.js        # Paginated activity log
        ├── iotDevices.js      # IoT CRUD + ping
        ├── users.js           # User management (ADMIN only)
        └── trial.js           # POST /api/trial/activate
```

---

## API Reference

Base URL: `http://localhost:4000`  
Protected routes require: `Authorization: Bearer <jwt_token>`

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | No | Login → returns JWT + username + role |

### Raw Materials
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/raw-materials` | Yes | List (search, category, status filters) |
| GET | `/api/raw-materials/:id` | Yes | Single item |
| POST | `/api/raw-materials` | Yes | Create |
| PUT | `/api/raw-materials/:id` | Yes | Update |
| DELETE | `/api/raw-materials/:id` | Yes | Delete |
| POST | `/api/raw-materials/:id/inward` | Yes | Add stock (receive) |
| POST | `/api/raw-materials/:id/outward` | Yes | Reduce stock (issue) |
| POST | `/api/raw-materials/import` | Yes | Bulk Excel import |
| GET | `/api/raw-materials/export/pdf` | Yes | PDF report |

### Finished Products
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/finished-products` | Yes | List (search, status, stockStatus filters) |
| GET | `/api/finished-products/:id` | Yes | Single product |
| POST | `/api/finished-products` | Yes | Create |
| PUT | `/api/finished-products/:id` | Yes | Update |
| DELETE | `/api/finished-products/:id` | Yes | Delete |
| POST | `/api/finished-products/import` | Yes | Bulk Excel import |
| GET | `/api/finished-products/export/pdf` | Yes | PDF report |

### Bill of Materials & Manufacture
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/manufacture/bom/all` | Yes | All BOMs for all products |
| GET | `/api/manufacture/bom/:id` | Yes | BOM for one product |
| POST | `/api/manufacture/bom/:id` | Yes | Set/replace BOM entries |
| GET | `/api/manufacture/feasibility/:id?qty=N` | Yes | Check if N units can be produced |
| POST | `/api/manufacture/inward` | Yes | Inward stock (raw or finished) |
| POST | `/api/manufacture/outward` | Yes | Outward dispatch (finished products) |
| POST | `/api/manufacture/produce` | Yes | Manufacture — deducts raw materials via BOM |
| GET | `/api/manufacture/transactions` | Yes | Paginated transaction history |

### Civi AI — Decision Intelligence
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/intelligence` | Yes | Full intelligence data + Groq AI narrative |
| GET | `/api/intelligence/export/pdf` | Yes | Detailed PDF report |
| POST | `/api/intelligence/chat` | Yes | Civi AI chat assistant (Groq) |

### Clients
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/clients` | Yes | List |
| POST | `/api/clients` | Yes | Create |
| PUT | `/api/clients/:id` | Yes | Update |
| DELETE | `/api/clients/:id` | Yes | Delete |
| POST | `/api/clients/import` | Yes | Bulk Excel import |
| GET | `/api/clients/export/pdf` | Yes | PDF report |

### IoT Devices
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/iot-devices` | Yes | List |
| POST | `/api/iot-devices` | Yes | Create |
| PUT | `/api/iot-devices/:id` | Yes | Update |
| DELETE | `/api/iot-devices/:id` | Yes | Delete |
| PATCH | `/api/iot-devices/:id/ping` | Yes | Update last ping |

### Users (ADMIN only)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users` | ADMIN | List all users |
| GET | `/api/users/me` | Yes | Current user info |
| POST | `/api/users` | ADMIN | Create user |
| PUT | `/api/users/:id` | ADMIN | Update user |
| DELETE | `/api/users/:id` | ADMIN | Delete user |

### System
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | No | Health check + trial status |
| POST | `/api/trial/activate` | No | Activate license key |

---

## Middleware Stack (request order)

```
Request
  → helmet()              — security headers
  → cors()                — CORS (FRONTEND_URL)
  → express.json()        — parse JSON body
  → morgan("dev")         — request logging
  → req.prisma = prisma   — inject DB client
  → /api/trial/*          — license activation (always allowed)
  → checkIntegrity()      — ownership check (503 if tampered)
  → checkTrial()          — license expiry (402 if expired)
  → route handlers
  → global error handler
```

---

## Integrity Protection

The server refuses to start if:
- Any required env var (`OWNER_SIG`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`) is missing
- `OWNER_SIG` doesn't match the expected SHA-256 HMAC
- PostgreSQL is unreachable

On every request, the same checks run — tampering at runtime returns `503 INTEGRITY_VIOLATION`.

---

## Response Conventions

All error responses:
```json
{ "error": "Human-readable message" }
```

All success responses: resource object or `{ items/products/clients/... }` array.

HTTP status codes:
- `200` — success
- `201` — created
- `400` — bad request (missing/invalid fields)
- `401` — unauthenticated
- `402` — trial expired (`TRIAL_EXPIRED`)
- `403` — forbidden (wrong role or invalid license key)
- `422` — business logic error (e.g. insufficient stock)
- `503` — integrity violation

---

## Login Credentials (after `npm run db:seed`)

| Username | Password | Role |
|----------|----------|------|
| `sandeep` | `Sandeep@2025` | ADMIN |
| `rohan` | `Rohan@2025` | ADMIN |
| `akshay` | `Akshay@2025` | ADMIN |
| `emp1`–`emp5` | `Emp1@2025`–`Emp5@2025` | EDITOR |

---

*© Civitas Atlas Technologies Pvt. Ltd., Pune, India*
