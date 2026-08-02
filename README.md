# S2R2 Inventory Management System

IoT & Inventory Platform · Version 1.0  
Built by **Civitas Atlas Technologies Pvt. Ltd.** for **S2R2 Technologies**, Pune, India.

---

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript  |
| Backend  | Node.js, Express 4, Prisma 5, JWT, bcryptjs     |
| Database | PostgreSQL on **Neon** (serverless)             |
| Hosting  | Vercel (frontend) · Railway or Render (backend) |

---

## Project Structure

```
s2r2-inventory/
├── frontend/          # Next.js app (port 3000)
│   ├── app/           # Pages (App Router)
│   ├── components/    # AppShell, Header, Sidebar, Footer
│   ├── lib/           # api.ts, permissions.ts
│   └── types/         # Shared TypeScript types
│
└── backend/           # Express API (port 4000)
    ├── server.js
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.js
    └── src/
        ├── middleware/auth.js
        └── routes/
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier is fine)

### 1 — Clone & install

```bash
git clone <your-repo-url>
cd s2r2-inventory

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2 — Configure backend environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@<pooler-host>/<db>?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>/<db>?sslmode=require"
PORT=4000
JWT_SECRET="s2r2IOT"
FRONTEND_URL="http://localhost:3000"
```

Get your `DATABASE_URL` and `DIRECT_URL` from Neon Console → Connection Details → **Prisma** mode.

### 3 — Configure frontend environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4 — Push schema & seed database

```bash
cd backend
npm run db:push       # pushes schema to Neon
npm run db:seed       # creates users + sample data
```

### 5 — Run both servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

| Username    | Password      | Role   |
|-------------|---------------|--------|
| `s2r2admin` | `s2r2Admin1`  | ADMIN  |
| `admin`     | `Admin2025`   | ADMIN  |
| `manager`   | `Manager2025` | ADMIN  |
| `superuser` | `Super2025s2` | ADMIN  |
| `editor1`   | `Editor2025a` | EDITOR |
| `editor2`   | `Editor2025b` | EDITOR |

---

## Deploying to Vercel + Railway

### Overview

```
Neon PostgreSQL  ←→  Railway (Express API)  ←→  Vercel (Next.js)
```

---

### Step 1 — Deploy the Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the **root of this repo**
3. Railway will detect Node.js automatically — set the **root directory** to `backend`
4. Go to **Variables** tab and add:

```
DATABASE_URL      = <your Neon pooled URL>
DIRECT_URL        = <your Neon direct URL>
JWT_SECRET        = s2r2IOT
FRONTEND_URL      = https://<your-vercel-app>.vercel.app
PORT              = 4000
```

5. Go to **Settings** → **Networking** → **Generate Domain**  
   Note the URL — it looks like `https://s2r2-api-production.up.railway.app`

6. After deploy, run the seed once via Railway shell or locally pointing at the same DB:
```bash
cd backend && npm run db:seed
```

---

### Step 2 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset will auto-detect **Next.js**
4. Under **Environment Variables** add:

```
NEXT_PUBLIC_API_URL = https://<your-railway-api-url>
```

5. Click **Deploy**

Vercel will build and deploy. The `next.config.js` rewrites proxy `/api/*` to your Railway backend automatically — no CORS issues.

---

### Step 3 — Update Railway CORS after Vercel deploys

Once Vercel gives you a final URL (e.g. `https://s2r2-inventory.vercel.app`), go back to Railway → Variables and update:

```
FRONTEND_URL = https://s2r2-inventory.vercel.app
```

Redeploy Railway (it auto-redeploys on variable change).

---

### Railway Alternative: Render

If you prefer [Render](https://render.com):

1. New → **Web Service** → connect repo, set root to `backend`
2. Build command: `npm install && npx prisma generate`
3. Start command: `node server.js`
4. Add the same env vars as Railway above
5. Free tier spins down after inactivity — upgrade to avoid cold starts

---

## API Reference

Base URL: `http://localhost:4000` (local) or your Railway URL (production)

All protected routes require header: `Authorization: Bearer <token>`

| Method | Route                         | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| POST   | `/api/auth/login`             | No   | Login, returns JWT       |
| GET    | `/api/dashboard`              | Yes  | Stats summary            |
| GET    | `/api/raw-materials`          | Yes  | List raw materials       |
| POST   | `/api/raw-materials`          | Yes  | Create raw material      |
| PUT    | `/api/raw-materials/:id`      | Yes  | Update raw material      |
| DELETE | `/api/raw-materials/:id`      | Yes  | Delete raw material      |
| GET    | `/api/finished-products`      | Yes  | List finished products   |
| POST   | `/api/finished-products`      | Yes  | Create finished product  |
| PUT    | `/api/finished-products/:id`  | Yes  | Update finished product  |
| DELETE | `/api/finished-products/:id`  | Yes  | Delete finished product  |
| GET    | `/api/clients`                | Yes  | List clients             |
| POST   | `/api/clients`                | Yes  | Create client            |
| PUT    | `/api/clients/:id`            | Yes  | Update client            |
| DELETE | `/api/clients/:id`            | Yes  | Delete client            |
| POST   | `/api/clients/import`         | Yes  | Bulk import from Excel   |
| GET    | `/api/iot-devices`            | Yes  | List IoT devices         |
| GET    | `/api/activity`               | Yes  | Recent activity log      |
| GET    | `/api/users`                  | ADMIN| List users               |
| POST   | `/api/users`                  | ADMIN| Create user              |
| DELETE | `/api/users/:id`              | ADMIN| Delete user              |
| GET    | `/health`                     | No   | Health check             |

---

## Database — Neon

Schema is managed via Prisma. To push changes:

```bash
cd backend
npx prisma db push       # apply schema changes (no migration files)
npx prisma migrate dev   # generate + apply migration files
npx prisma studio        # visual DB browser
```

Models: `User`, `RawMaterial`, `FinishedProduct`, `Client`, `IoTDevice`, `ActivityLog`

---

## Role Permissions

| Action         | ADMIN | EDITOR | VIEWER |
|----------------|-------|--------|--------|
| View all pages | ✅    | ✅     | ✅     |
| Add records    | ✅    | ✅     | ❌     |
| Edit records   | ✅    | ✅     | ❌     |
| Delete records | ✅    | ❌     | ❌     |
| Admin panel    | ✅    | ❌     | ❌     |

---

## Scripts Reference

```bash
# Backend
npm run dev          # nodemon dev server
npm run start        # production server
npm run db:push      # push schema to DB
npm run db:seed      # seed users + sample data
npm run db:studio    # Prisma Studio GUI

# Frontend
npm run dev          # Next.js dev server (port 3000)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint check
```

---

## Environment Variables — Full Reference

### Backend (`backend/.env`)

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `DATABASE_URL` | Yes      | Neon pooled PostgreSQL connection string |
| `DIRECT_URL`   | Yes      | Neon direct connection (for migrations)  |
| `JWT_SECRET`   | Yes      | Secret key for signing JWT tokens        |
| `PORT`         | No       | API port (default: 4000)                 |
| `FRONTEND_URL` | Yes      | Frontend origin for CORS                 |

### Frontend (`frontend/.env.local`)

| Variable               | Required | Description              |
|------------------------|----------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | Yes      | Backend API base URL     |

---

*S2R2 Inventory Management System — Civitas Atlas Technologies Pvt. Ltd., Pune, India*
