# S2R2 Inventory — Database & Prisma Reference

**PostgreSQL 17 + Prisma ORM 5**  
Built by Civitas Atlas Technologies Pvt. Ltd., Pune  
Contact: civitasatlasco@gmail.com

---

## Quick Setup (Local PostgreSQL 17)

### Step 1 — Create database and user (run once)

Open **SQL Shell (psql)** and run:

```sql
CREATE USER s2r2_user WITH PASSWORD 's2r2pass';
CREATE DATABASE s2r2_inventory OWNER s2r2_user;
GRANT ALL PRIVILEGES ON DATABASE s2r2_inventory TO s2r2_user;
\c s2r2_inventory
GRANT ALL ON SCHEMA public TO s2r2_user;
\q
```

### Step 2 — Configure connection

In `backend/.env`:
```env
DATABASE_URL="postgresql://s2r2_user:s2r2pass@localhost:5432/s2r2_inventory"
```

### Step 3 — Apply schema and seed

```powershell
cd backend
npm run db:push    # creates all tables
npm run db:seed    # seeds users, raw materials, products, clients, BOM
```

---

## Prisma Commands

| Command | What it does |
|---------|-------------|
| `npx prisma db push` | Sync `schema.prisma` to the database (no migration files). Use for dev. |
| `npx prisma migrate dev` | Create + apply a named migration file. Use when ready for a tracked change. |
| `npx prisma migrate deploy` | Apply pending migrations in production. |
| `npx prisma generate` | Regenerate the Prisma Client after schema changes. |
| `npx prisma studio` | Open visual DB browser at `http://localhost:5555` |
| `npx prisma db seed` | Run `seed.js` (same as `npm run db:seed`) |
| `npx prisma validate` | Validate `schema.prisma` for syntax errors |

npm script shortcuts (from `backend/`):
```powershell
npm run db:push     # npx prisma db push
npm run db:seed     # node prisma/seed.js
npm run db:studio   # npx prisma studio
```

---

## Schema Location

```
backend/prisma/
├── schema.prisma    # All models, enums, relations
└── seed.js          # Seed data script
```

---

## Data Models

### `User` → `users`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `username` | String | Unique |
| `password` | String | bcrypt hash — never plain text |
| `role` | Role enum | ADMIN / EDITOR / VIEWER / USER |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Role enum values:**
- `ADMIN` — full access including user management
- `EDITOR` — add/edit records, no delete, no admin panel
- `VIEWER` — read-only
- `USER` — legacy alias for VIEWER

---

### `RawMaterial` → `raw_materials`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `name` | String | Material name |
| `category` | String | e.g. Electronics, Sensors |
| `description` | String? | Optional |
| `quantity` | Float | Current stock level |
| `unit` | String | e.g. pcs, m, kg (default: pcs) |
| `supplier` | String? | Supplier name |
| `location` | String? | Storage location |
| `minStock` | Float | Minimum threshold for alerts |
| `price` | Float | Unit price in ₹ |
| `lastUpdated` | DateTime | Manually updated on stock changes |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Computed status** (not stored — derived in application layer):
- `quantity === 0` → `"out"`
- `quantity <= minStock` → `"low"`
- otherwise → `"active"`

**Relations:** Has many `BillOfMaterials` entries (used as components in BOMs)

---

### `FinishedProduct` → `finished_products`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `name` | String | Product name |
| `qty` | Float | Current stock |
| `unit` | String | e.g. Box, pcs (default: Box) |
| `category` | String | Default: Finished Products |
| `location` | String? | Storage location |
| `supplier` | String? | Supplier / vendor |
| `minStock` | Float | Minimum stock threshold |
| `price` | Float | Unit selling price in ₹ |
| `status` | FinishedProductStatus | `ACTIVE` or `HOLD` (stored) |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Note:** `status` (ACTIVE/HOLD) is stored. `stockStatus` (active/low/out) is computed.

**Relations:** Has many `BillOfMaterials` entries (this product's component list)

---

### `BillOfMaterials` → `bill_of_materials`

Maps which raw materials (and how many) are needed to produce **one unit** of a finished product.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `finishedProductId` | Int (FK) | → `FinishedProduct.id` |
| `rawMaterialId` | Int (FK) | → `RawMaterial.id` |
| `quantityRequired` | Float | Units of raw material per 1 finished product |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Constraints:**
- `(finishedProductId, rawMaterialId)` — unique pair (no duplicates)
- `onDelete: Cascade` — BOM entries deleted when product or material is deleted

**Example:** IoT Tracking Device = 1x Microcontroller + 1x Sensor Module + 1x Plastic Casing

---

### `InventoryTransaction` → `inventory_transactions`

Audit log of every stock movement.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `transactionType` | TransactionType | `INWARD`, `OUTWARD`, or `MANUFACTURE` |
| `itemType` | ItemType | `RAW_MATERIAL` or `FINISHED_PRODUCT` |
| `itemId` | Int | ID of the affected item |
| `itemName` | String | Denormalized — name at time of transaction |
| `quantity` | Float | Positive = added, Negative = deducted |
| `note` | String? | Optional note / reference |
| `performedBy` | String | Username — denormalized |
| `createdAt` | DateTime | Auto |

**Transaction types:**
- `INWARD` — stock received (raw material purchase or FP restock)
- `OUTWARD` — stock dispatched (finished products sent to client)
- `MANUFACTURE` — raw materials consumed + finished product produced

---

### `Client` → `clients`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `clientName` | String | Primary contact or company short name |
| `companyName` | String? | Full company name |
| `phone` | String? | |
| `email` | String? | Unique |
| `address` | String? | |
| `gstNo` | String? | GST registration number |
| `status` | ClientStatus | `ACTIVE` or `INACTIVE` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

---

### `IoTDevice` → `iot_devices`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `deviceId` | String | Unique hardware device ID |
| `name` | String | Human-readable name |
| `type` | String? | e.g. Tracker, Sensor Hub |
| `location` | String? | Physical deployment location |
| `status` | IoTDeviceStatus | `ONLINE`, `OFFLINE`, or `MAINTENANCE` |
| `lastPing` | DateTime? | Last successful ping timestamp |
| `metadata` | Json? | Flexible key-value payload |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

---

### `ActivityLog` → `activity_logs`

Denormalized audit trail — all create/update/delete actions.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (PK) | Auto-increment |
| `module` | String | `raw_material`, `finished_product`, `client`, `iot_device` |
| `label` | String | Human-readable description (e.g. item name) |
| `action` | String | `created`, `updated`, `deleted` |
| `username` | String | Performing user (default: `system`) |
| `eventTime` | DateTime | Auto |

---

## Enums

| Enum | Values |
|------|--------|
| `Role` | `ADMIN`, `EDITOR`, `VIEWER`, `USER` |
| `FinishedProductStatus` | `ACTIVE`, `HOLD` |
| `ClientStatus` | `ACTIVE`, `INACTIVE` |
| `IoTDeviceStatus` | `ONLINE`, `OFFLINE`, `MAINTENANCE` |
| `TransactionType` | `INWARD`, `OUTWARD`, `MANUFACTURE` |
| `ItemType` | `RAW_MATERIAL`, `FINISHED_PRODUCT` |

---

## Seed Data (`prisma/seed.js`)

Run: `npm run db:seed` (from `backend/`)

What gets seeded:

| Data | Count | Notes |
|------|-------|-------|
| Users | 8 | 3 ADMIN + 5 EDITOR. **Wipes all existing users on each run.** |
| Raw Materials (base) | 6 | PLC Controller, RFID Antenna, ESP32 Module, Power Supply 24V, Temperature Sensor, LED Strip RGB |
| Raw Materials (BOM) | 18 | PCB Board, LoRa Module, Li-Po Battery, LCD Panel, etc. |
| Finished Products | 5 | Iotzee, Display, Display Stand, Hold-on Hold Kit, IoT Tracking Device |
| Clients | 9 | Real S2R2 client data — upserted by email (safe to re-run) |
| BOM mappings | 26 entries | All 5 products mapped to their components |

**Safe to re-run** — clients use `upsert` by email, BOM uses `deleteMany` + `createMany`. Only users are wiped.

---

## Prisma Studio

Visual database browser — run from `backend/`:

```powershell
npm run db:studio
# Opens http://localhost:5555
```

Browse, edit, and filter all tables visually. Useful for debugging seeded data.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `P1001` Connection refused | PostgreSQL service not running — `Get-Service postgresql*` |
| `P1003` DB does not exist | Run the SQL setup commands in Step 1 above |
| `P2002` Unique constraint | Duplicate email in clients — use upsert or delete duplicate |
| `P2025` Record not found | ID doesn't exist — check the ID in Prisma Studio |
| `prisma generate` fails | Run `npm install` in `backend/` to ensure Prisma CLI is installed |
| Schema out of sync | Run `npm run db:push` to re-sync |
| Seed fails mid-way | Check for data integrity issues; run `npm run db:push` first |

---

## Adding a New Model (checklist)

1. Add model to `schema.prisma`
2. Run `npm run db:push` (dev) or create a migration
3. Run `npx prisma generate` to update the Prisma Client
4. Create `src/routes/yourModel.js` — copy pattern from `rawMaterials.js`
5. Register the route in `server.js`
6. Add TypeScript interface to `frontend/types/index.ts`
7. Add API functions to `frontend/lib/api.ts`
8. Create the frontend page under `frontend/app/your-model/page.tsx`

---

*© Civitas Atlas Technologies Pvt. Ltd., Pune, India*
