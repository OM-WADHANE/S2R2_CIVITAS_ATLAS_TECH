# S2R2 Inventory — Frontend

**Next.js 14 + React 18 + TypeScript + Tailwind CSS**  
Built by **Civitas Atlas Technologies Pvt. Ltd.**, Pune  
📧 Contact: civitasatlasco@gmail.com  
**Version:** 1.0 | **Updated:** August 14, 2026

---

## 🚀 Quick Start

```powershell
cd frontend
npm install
npm run dev    # starts at http://localhost:3000
```

Requires the backend running at `http://localhost:4000` (see `backend/README.md`).

---

## 🎨 Brand Identity

### Civi AI Icon
- **Component:** `components/CiviAIIcon.tsx`
- **Design:** Animated hexagonal icon (Gemini AI inspired)
- **Specifications:**
  - Thick strokes: 2.5px with rounded caps/joins
  - Purple gradient: #7c3aed → #a855f7 → #c084fc
  - Slow rotation: 12s (outer), 15s (inner counter-rotation), 3s (pulse)
- **Usage:** Header, sidebar, intelligence pages, chat avatars

### Copyright
**© 2026 Civitas Atlas Technologies Pvt. Ltd., Pune**  
Protected footer component with runtime integrity checks

---

## ⚡ Performance Optimizations

- **React Strict Mode** enabled for development safety
- **SWC minification** for faster builds
- **WebP image format** support
- **Memoized components** (Sidebar) to prevent unnecessary re-renders
- **Next.js prefetching** for instant page transitions
- **Lazy loading** for heavy components
- **GPU-accelerated animations** for Civi AI icon

**Tested:** Fast tab/page switches with 5 concurrent users — no lag or flicker

---

## 📦 Tech Stack

| Package | Purpose |
|---------|---------|
| Next.js 14 (App Router) | React framework, SSR + client components |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| lucide-react | Icon library |
| CiviAIIcon (Custom) | Animated hexagonal icon |
| xlsx | Excel import/export (client-side) |
| papaparse | CSV export |

---

## 🔧 Environment Variables (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend base URL (e.g. `http://localhost:4000`) |

The Next.js proxy in `next.config.js` rewrites `/api/*` → backend, so all API calls use `/api/...` relative paths.

---

## 🛠️ Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Development server with hot reload on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint check |

---

## 📂 Project Structure

```
frontend/
├── next.config.js             # API proxy rewrites (/api/* → backend)
├── tailwind.config.js         # Tailwind theme config
├── tsconfig.json              # TypeScript config
├── .env.local                 # Environment variables (not in git)
│
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # Root layout (metadata, dark mode, footer)
│   ├── globals.css            # Global styles + Tailwind + custom component classes
│   ├── page.tsx               # Dashboard (4-tab: Real-Time, Alerts, Cost, Issuances)
│   │
│   ├── raw-materials/         # Raw materials CRUD + Inward/Outward + Excel import
│   ├── finished-products/     # Finished products CRUD + Manufacture + Excel import + BOM editor
│   ├── bom/                   # Bill of Materials management (ADMIN + EDITOR only)
│   ├── clients/               # Clients CRUD + Excel import/export
│   ├── iot-devices/           # IoT device registry + ping
│   ├── reports/               # Multi-tab report with CSV/Excel/PDF export
│   ├── intelligence/          # Civi AI Decision Intelligence
│   │   ├── page.tsx           # Main intelligence dashboard
│   │   └── chat/              # Civi AI chat assistant
│   │       └── page.tsx       # Chat interface with animated Civi AI icon
│   ├── notifications/         # Stock alert notifications (bell icon → here)
│   ├── admin/                 # User management + trial status (ADMIN only)
│   ├── login/                 # Login page (JWT auth)
│   └── trial-expired/         # License key entry page
│
├── components/
│   ├── AppShell.tsx           # Auth guard + inactivity timeout + notification popup
│   ├── Header.tsx             # Top nav bar + Civi AI icon + dark mode + bell icon + user dropdown
│   ├── Sidebar.tsx            # Side navigation (role-filtered) + Civi AI icon
│   ├── Footer.tsx             # Protected branding footer (integrity check)
│   ├── CiviAIIcon.tsx         # ⭐ Animated hexagonal icon (Gemini-style, thick strokes, slow rotation)
│   └── ui/
│       └── StatCard.tsx       # Dashboard stat card component
│
├── lib/
│   ├── api.ts                 # Centralised API client (all fetch calls go here)
│   ├── permissions.ts         # Role-based permission matrix (ADMIN/EDITOR/VIEWER)
│   ├── notifications.ts       # Shared notification store (fetches /api/intelligence)
│   ├── useTrialStatus.ts      # Trial countdown hook (used by admin page)
│   └── useInactivityTimeout.ts# 10-minute inactivity auto-logout
│
└── types/
    └── index.ts               # All shared TypeScript interfaces
```

---

## 📄 Pages Reference

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | `app/page.tsx` | All | 4-tab dashboard with animated Civi AI icon |
| `/raw-materials` | Raw Materials | All | CRUD + Inward/Outward + Excel import |
| `/finished-products` | Finished Products | All | CRUD + Manufacture + BOM editor in modal |
| `/bom` | BOM | ADMIN, EDITOR | Bill of Materials management |
| `/clients` | Clients | All | Client CRUD + Excel import |
| `/iot-devices` | IoT Devices | All | Device registry |
| `/reports` | Reports | All | Export reports |
| `/intelligence` | Civi AI | ADMIN, EDITOR | Decision intelligence + AI narrative with animated icon |
| `/intelligence/chat` | Civi AI Chat | ADMIN, EDITOR | Chat with Civi AI assistant (animated icon avatars) |
| `/notifications` | Notifications | All | Stock alerts (from header bell) |
| `/admin` | Admin | ADMIN only | Users + trial status |
| `/login` | Login | Public | JWT authentication |
| `/trial-expired` | Trial Expired | Public | License key activation |

---

## 🎯 Key Components

### `CiviAIIcon.tsx` ⭐ NEW
Animated hexagonal icon component (Gemini AI inspired):
- **Props:** `size`, `className`, `animated` (boolean)
- **Design:** Thick 2.5px strokes, purple gradient
- **Animation:** 12s outer rotation, 15s inner counter-rotation, 3s pulse
- **Performance:** GPU-accelerated transforms, optimized for mobile
- **Usage:** Import and use like any icon component

```tsx
import CiviAIIcon from "@/components/CiviAIIcon";

<CiviAIIcon size={20} animated={true} className="text-purple-500" />
```

### `AppShell.tsx`
Wraps every authenticated page. Handles:
- **Auth guard** — redirects to `/login` if no token
- **Trial guard** — redirects to `/trial-expired` if flag set
- **Inactivity timeout** — 10-minute auto-logout (all roles)
- **Notification popup** — bottom-right, 10-second auto-dismiss, CRITICAL/HIGH stock alerts only

### `Header.tsx`
- Brand logo + title
- **Civi AI animated icon** (links to Decision Intelligence)
- Dark/light mode toggle (persisted in localStorage)
- **Bell icon** — shows red badge with alert count, navigates to `/notifications`
- User dropdown (username, role badge, sign out)
- Hides on scroll down, reveals on scroll up

### `Sidebar.tsx`
Role-filtered navigation:
- **Civi AI icon** in Decision Intelligence menu item
- VIEWER — hides BOM and Decision Intelligence
- EDITOR — sees BOM and Intelligence
- ADMIN — sees all including Admin Panel

### `Footer.tsx`
Protected component — verifies brand constants at runtime. If tampered:
- Shows full-screen lock screen
- Builder override key bypasses for maintenance (`Civitas@Co11`)

---

## 🔐 Authentication Flow

1. User submits credentials → `POST /api/auth/login`
2. Backend returns `{ token, username, role }`
3. Stored in `localStorage` as `s2r2_token`, `s2r2_username`, `s2r2_role`
4. All API requests attach `Authorization: Bearer <token>` via `lib/api.ts`
5. On 401 → clear token + redirect to `/login`
6. On 402 → redirect to `/trial-expired`
7. After 10 min inactivity → `logout()` + redirect to `/login?reason=inactivity`

---

## 👥 Role Permissions

| Feature | ADMIN | EDITOR | VIEWER |
|---------|-------|--------|--------|
| View all pages | ✅ | ✅ | ✅ |
| Add records | ✅ | ✅ | ❌ |
| Edit records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Import Excel | ✅ | ✅ | ❌ |
| BOM management | ✅ | ✅ | ❌ |
| Civi AI / Decision Intelligence | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |

---

## 🌐 API Client (`lib/api.ts`)

All HTTP calls go through the `request<T>()` function which:
- Automatically attaches the Bearer token
- On **401** — clears token + hard redirects to `/login`
- On **402** — hard redirects to `/trial-expired`
- On error — throws `new Error(body.error)` for components to catch

Key exports:
- `login()` / `logout()` / `isLoggedIn()`
- `getRawMaterials()` / `createRawMaterial()` / `updateRawMaterial()` / `deleteRawMaterial()`
- `inwardRawMaterial()` / `outwardRawMaterial()` / `importRawMaterials()`
- `getFinishedProducts()` / `createFinishedProduct()` / etc.
- `importFinishedProducts()` / `importClients()`
- `getBom()` / `setBom()` / `getFeasibility()`
- `inwardStock()` / `outwardStock()` / `produceProduct()`
- `getTransactions()` / `getDashboardStats()`
- `getIntelligence()` / `chatWithCiviAI()` / `exportIntelligencePdf()`

---

## 📊 Excel Import Format

### Raw Materials template columns:
`Name` | `Category` | `Description` | `Qty` | `Unit` | `Supplier` | `Location` | `Min Stock` | `Price (₹)`

### Finished Products template columns:
`Name` | `Qty` | `Unit` | `Category` | `Location` | `Supplier` | `Min Stock` | `Price (₹)`

### Clients template columns:
`Client Name` | `Company` | `Phone` | `Email` | `Address` | `GST No`

Download templates via the **Template** button in each page header.

---

## 🔔 Notification System

**Popup** — appears bottom-right on every authenticated page:
- Fetches `/api/intelligence` once per session
- Shows CRITICAL + HIGH stock alerts only
- Auto-dismisses after 10 seconds
- "View all" → `/notifications`
- Stores dismissal in `sessionStorage`

**Bell icon in header**:
- Shows red badge with count of CRITICAL + HIGH alerts
- Clicking navigates to `/notifications`

**Notifications page** (`/notifications`):
- Full list grouped by CRITICAL → HIGH → MEDIUM
- Links to `/raw-materials` for each item
- "Open Decision Intelligence" CTA

---

## 🤖 Civi AI Features

### Decision Intelligence (`/intelligence`)
- Reorder alerts with animated Civi AI icon indicators
- Manufacture readiness calculations
- Replenishment plan with cost estimates
- 30-day velocity analytics
- AI narrative from Gemini 2.0 Flash

### Chat Assistant (`/intelligence/chat`)
- Real-time chat interface
- Animated Civi AI icon in header and message avatars
- Natural language responses
- Context-aware recommendations
- Quick starter prompts

---

## 🔒 Integrity Protection

`Footer.tsx` verifies brand constants (`BRAND_NAME`, `BRAND_OWNER`, `BRAND_CITY`, `BRAND_EMAIL`) at component mount. If any are changed:
- Full-screen lock screen appears
- Enter builder override key `Civitas@Co11` to bypass for maintenance
- Bypass stored in `sessionStorage` (single session only)

---

## 📞 Contact & Support

**Civitas Atlas Technologies Pvt. Ltd.**  
Pune, India  
📧 [civitasatlasco@gmail.com](mailto:civitasatlasco@gmail.com)

---

*© 2026 Civitas Atlas Technologies Pvt. Ltd., Pune. All rights reserved.*

```powershell
cd frontend
npm install
npm run dev    # starts at http://localhost:3000
```

Requires the backend running at `http://localhost:4000` (see `backend/README.md`).

---

## Performance Optimizations

- **React Strict Mode** enabled for development safety
- **SWC minification** for faster builds
- **WebP image format** support
- **Memoized components** (Sidebar) to prevent unnecessary re-renders
- **Next.js prefetching** for instant page transitions
- **Lazy loading** for heavy components

**Tested:** Fast tab/page switches with 5 concurrent users — no lag or flicker

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| Next.js 14 (App Router) | React framework, SSR + client components |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| lucide-react | Icon library |
| xlsx | Excel import/export (client-side) |
| papaparse | CSV export |

---

## Environment Variables (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend base URL (e.g. `http://localhost:4000`) |

The Next.js proxy in `next.config.js` rewrites `/api/*` → backend, so all API calls use `/api/...` relative paths.

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Development server with hot reload on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint check |

---

## Project Structure

```
frontend/
├── next.config.js             # API proxy rewrites (/api/* → backend)
├── tailwind.config.js         # Tailwind theme config
├── tsconfig.json              # TypeScript config
├── .env.local                 # Environment variables (not in git)
│
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # Root layout (metadata, dark mode, footer)
│   ├── globals.css            # Global styles + Tailwind + custom component classes
│   ├── page.tsx               # Dashboard (4-tab: Real-Time, Alerts, Cost, Issuances)
│   │
│   ├── raw-materials/         # Raw materials CRUD + Inward/Outward + Excel import
│   ├── finished-products/     # Finished products CRUD + Manufacture + Excel import + BOM editor
│   ├── bom/                   # Bill of Materials management (ADMIN + EDITOR only)
│   ├── clients/               # Clients CRUD + Excel import/export
│   ├── iot-devices/           # IoT device registry + ping
│   ├── reports/               # Multi-tab report with CSV/Excel/PDF export
│   ├── intelligence/          # Civi AI Decision Intelligence
│   │   ├── page.tsx           # Main intelligence dashboard
│   │   └── chat/              # Civi AI chat assistant
│   ├── notifications/         # Stock alert notifications (bell icon → here)
│   ├── admin/                 # User management + trial status (ADMIN only)
│   ├── login/                 # Login page (JWT auth)
│   └── trial-expired/         # License key entry page
│
├── components/
│   ├── AppShell.tsx           # Auth guard + inactivity timeout + notification popup
│   ├── Header.tsx             # Top nav bar + dark mode + bell icon + user dropdown
│   ├── Sidebar.tsx            # Side navigation (role-filtered)
│   ├── Footer.tsx             # Protected branding footer (integrity check)
│   └── ui/
│       └── StatCard.tsx       # Dashboard stat card component
│
├── lib/
│   ├── api.ts                 # Centralised API client (all fetch calls go here)
│   ├── permissions.ts         # Role-based permission matrix (ADMIN/EDITOR/VIEWER)
│   ├── notifications.ts       # Shared notification store (fetches /api/intelligence)
│   ├── useTrialStatus.ts      # Trial countdown hook (used by admin page)
│   └── useInactivityTimeout.ts# 10-minute inactivity auto-logout
│
└── types/
    └── index.ts               # All shared TypeScript interfaces
```

---

## Pages Reference

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | `app/page.tsx` | All | 4-tab dashboard |
| `/raw-materials` | Raw Materials | All | CRUD + Inward/Outward + Excel import |
| `/finished-products` | Finished Products | All | CRUD + Manufacture + BOM editor in modal |
| `/bom` | BOM | ADMIN, EDITOR | Bill of Materials management |
| `/clients` | Clients | All | Client CRUD + Excel import |
| `/iot-devices` | IoT Devices | All | Device registry |
| `/reports` | Reports | All | Export reports |
| `/intelligence` | Civi AI | ADMIN, EDITOR | Decision intelligence + AI narrative |
| `/intelligence/chat` | Civi AI Chat | ADMIN, EDITOR | Chat with Civi AI |
| `/notifications` | Notifications | All | Stock alerts (from header bell) |
| `/admin` | Admin | ADMIN only | Users + trial status |
| `/login` | Login | Public | JWT authentication |
| `/trial-expired` | Trial Expired | Public | License key activation |

---

## Key Components

### `AppShell.tsx`
Wraps every authenticated page. Handles:
- **Auth guard** — redirects to `/login` if no token
- **Trial guard** — redirects to `/trial-expired` if flag set
- **Inactivity timeout** — 10-minute auto-logout (all roles)
- **Notification popup** — bottom-right, 10-second auto-dismiss, CRITICAL/HIGH stock alerts only

### `Header.tsx`
- Brand logo + title
- Dark/light mode toggle (persisted in localStorage)
- **Bell icon** — shows red badge with alert count, navigates to `/notifications`
- User dropdown (username, role badge, sign out)
- Hides on scroll down, reveals on scroll up

### `Sidebar.tsx`
Role-filtered navigation:
- VIEWER — hides BOM and Decision Intelligence
- EDITOR — sees BOM and Intelligence
- ADMIN — sees all including Admin Panel

### `Footer.tsx`
Protected component — verifies brand constants at runtime. If tampered:
- Shows full-screen lock screen
- Builder override key bypasses for maintenance (`Civitas@Co11`)

---

## Authentication Flow

1. User submits credentials → `POST /api/auth/login`
2. Backend returns `{ token, username, role }`
3. Stored in `localStorage` as `s2r2_token`, `s2r2_username`, `s2r2_role`
4. All API requests attach `Authorization: Bearer <token>` via `lib/api.ts`
5. On 401 → clear token + redirect to `/login`
6. On 402 → redirect to `/trial-expired`
7. After 10 min inactivity → `logout()` + redirect to `/login?reason=inactivity`

---

## Role Permissions

| Feature | ADMIN | EDITOR | VIEWER |
|---------|-------|--------|--------|
| View all pages | ✅ | ✅ | ✅ |
| Add records | ✅ | ✅ | ❌ |
| Edit records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Import Excel | ✅ | ✅ | ❌ |
| BOM management | ✅ | ✅ | ❌ |
| Decision Intelligence | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |

---

## API Client (`lib/api.ts`)

All HTTP calls go through the `request<T>()` function which:
- Automatically attaches the Bearer token
- On **401** — clears token + hard redirects to `/login`
- On **402** — hard redirects to `/trial-expired`
- On error — throws `new Error(body.error)` for components to catch

Key exports:
- `login()` / `logout()` / `isLoggedIn()`
- `getRawMaterials()` / `createRawMaterial()` / `updateRawMaterial()` / `deleteRawMaterial()`
- `inwardRawMaterial()` / `outwardRawMaterial()` / `importRawMaterials()`
- `getFinishedProducts()` / `createFinishedProduct()` / etc.
- `importFinishedProducts()` / `importClients()`
- `getBom()` / `setBom()` / `getFeasibility()`
- `inwardStock()` / `outwardStock()` / `produceProduct()`
- `getTransactions()` / `getDashboardStats()`
- `getIntelligence()` / `exportIntelligencePdf()`

---

## Excel Import Format

### Raw Materials template columns:
`Name` | `Category` | `Description` | `Qty` | `Unit` | `Supplier` | `Location` | `Min Stock` | `Price (₹)`

### Finished Products template columns:
`Name` | `Qty` | `Unit` | `Category` | `Location` | `Supplier` | `Min Stock` | `Price (₹)`

### Clients template columns:
`Client Name` | `Company` | `Phone` | `Email` | `Address` | `GST No`

Download templates via the **Template** button in each page header.

---

## Notification System (SRS §3.4)

**Popup** — appears bottom-right on every authenticated page:
- Fetches `/api/intelligence` once per session
- Shows CRITICAL + HIGH stock alerts only
- Auto-dismisses after 10 seconds
- "View all" → `/notifications`
- Stores dismissal in `sessionStorage`

**Bell icon in header**:
- Shows red badge with count of CRITICAL + HIGH alerts
- Clicking navigates to `/notifications`

**Notifications page** (`/notifications`):
- Full list grouped by CRITICAL → HIGH → MEDIUM
- Links to `/raw-materials` for each item
- "Open Decision Intelligence" CTA

---

## Integrity Protection

`Footer.tsx` verifies brand constants (`BRAND_NAME`, `BRAND_OWNER`, `BRAND_CITY`, `BRAND_EMAIL`) at component mount. If any are changed:
- Full-screen lock screen appears
- Enter builder override key `Civitas@Co11` to bypass for maintenance
- Bypass stored in `sessionStorage` (single session only)

---

*© Civitas Atlas Technologies Pvt. Ltd., Pune, India*
