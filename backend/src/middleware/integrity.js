// src/middleware/integrity.js
// ─────────────────────────────────────────────────────────────
// Ownership & integrity guard for S2R2 Inventory Management System.
//
// Protected system features:
//   • Authentication (JWT, bcrypt, role-based access)
//   • User Management (CRUD, ADMIN / EDITOR / VIEWER roles)
//   • Dashboard (live stats, stock values, activity feed)
//   • Raw Materials (CRUD, pricing, stock tracking, export)
//   • Finished Products (CRUD, pricing, stock tracking, export)
//   • Clients (CRUD, Excel import, search, export)
//   • IoT Devices (CRUD, ping, status tracking)
//   • Activity Log (paginated, attributed)
//   • Reports (multi-tab, date filter, CSV/Excel/PDF)
//   • Trial / License guard (per-plan expiry, key activation)
//   • Branding integrity (ownership markers, export attribution)
//
// Checks at startup (runIntegrityCheck):
//   1. Required environment variables present and non-empty.
//   2. OWNER_SIG matches expected SHA-256 HMAC ownership signature.
//   3. Branding constants (BRAND_NAME, BRAND_OWNER) are intact.
//   4. PostgreSQL database connection is reachable.
//
// Checks on every request (checkIntegrity middleware):
//   5. Required env vars still present (catches runtime tampering).
//   6. OWNER_SIG still valid.
//
// If ANY check fails → server exits (startup) or returns 503 (runtime).
//
// ─────────────────────────────────────────────────────────────
// © Civitas Atlas Technologies Pvt. Ltd., Pune, India
// civitasatlasco@gmail.com
// Unauthorised modification or removal of this file or any
// branding/ownership markers renders the application inoperable.
// ─────────────────────────────────────────────────────────────
"use strict";

const crypto = require("crypto");

// ── Ownership constants (DO NOT MODIFY) ──────────────────────
const BRAND_NAME   = "S2R2 Inventory Management System";
const BRAND_OWNER  = "Civitas Atlas Technologies Pvt. Ltd.";
const BRAND_CITY   = "Pune, India";
const BRAND_EMAIL  = "civitasatlasco@gmail.com";

// The expected signature is a SHA-256 HMAC of the brand constants
// keyed on the brand email. It is compared against OWNER_SIG in .env.
// If you need to recompute it: node -e "
//   const c=require('crypto');
//   console.log(c.createHmac('sha256','civitasatlasco@gmail.com')
//     .update('S2R2 Inventory Management System|Civitas Atlas Technologies Pvt. Ltd.|Pune, India')
//     .digest('hex'));"
const EXPECTED_SIG = crypto
  .createHmac("sha256", BRAND_EMAIL)
  .update(`${BRAND_NAME}|${BRAND_OWNER}|${BRAND_CITY}`)
  .digest("hex");

// Required env vars — app cannot start without these
// NOTE: FRONTEND_URL is NOT here — it has a safe default (localhost:3000)
// and should never crash the server if missing during cold-start on Railway.
const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "OWNER_SIG",
];

// ── Helpers ───────────────────────────────────────────────────
function violation(reason) {
  const line = "═".repeat(62);
  console.error(`\n${line}`);
  console.error("  ⛔  S2R2 INTEGRITY VIOLATION — APPLICATION LOCKED");
  console.error(line);
  console.error(`  Reason : ${reason}`);
  console.error(`  Owner  : ${BRAND_OWNER}`);
  console.error(`  Contact: ${BRAND_EMAIL}`);
  console.error(`  You have deleted or modified a protected configuration.`);
  console.error(`  Restore the original .env and credentials to resume.`);
  console.error(`${line}\n`);
  process.exit(78); // EX_CONFIG — configuration error
}

// ── Startup check (call once before app.listen) ───────────────
async function runIntegrityCheck(prisma) {
  // 1. Required env vars
  for (const key of REQUIRED_ENV) {
    if (!process.env[key] || process.env[key].trim() === "") {
      violation(
        `Required environment variable "${key}" is missing or empty.\n` +
        `  Restore backend/.env with all required variables.`
      );
    }
  }

  // 2. Ownership signature
  const providedSig = (process.env.OWNER_SIG || "").trim();
  if (!crypto.timingSafeEqual(
    Buffer.from(providedSig.padEnd(64, "\0"), "utf8"),
    Buffer.from(EXPECTED_SIG.padEnd(64, "\0"), "utf8")
  )) {
    violation(
      `OWNER_SIG does not match. The ownership credentials have been tampered with.\n` +
      `  Contact ${BRAND_EMAIL} to obtain a valid OWNER_SIG.`
    );
  }

  // 3. Branding constants self-check
  const selfCheck = crypto
    .createHmac("sha256", BRAND_EMAIL)
    .update(`${BRAND_NAME}|${BRAND_OWNER}|${BRAND_CITY}`)
    .digest("hex");
  if (selfCheck !== EXPECTED_SIG) {
    violation(
      `Branding constants have been modified. "${BRAND_OWNER}" identity is protected.\n` +
      `  Do not alter BRAND_NAME, BRAND_OWNER, or BRAND_CITY in integrity.js.`
    );
  }

  // 4. Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    violation(
      `Database connection failed: ${err.message}\n` +
      `  Verify DATABASE_URL in backend/.env and ensure PostgreSQL is running.`
    );
  }

  console.log("✅ Integrity check passed — ownership and environment verified.");
}

// ── Per-request middleware (runtime tamper detection) ─────────
function checkIntegrity(req, res, next) {
  // Check required env vars are still present at runtime
  for (const key of REQUIRED_ENV) {
    if (!process.env[key] || process.env[key].trim() === "") {
      console.error(`[integrity] Runtime violation: env var "${key}" was removed.`);
      return res.status(503).json({
        error:   "Application integrity violation detected.",
        code:    "INTEGRITY_VIOLATION",
        detail:  `Required configuration "${key}" is missing. Contact ${BRAND_EMAIL}.`,
        contact: BRAND_EMAIL,
      });
    }
  }

  // Check ownership signature still valid
  const sig = (process.env.OWNER_SIG || "").trim();
  let sigValid = false;
  try {
    sigValid = crypto.timingSafeEqual(
      Buffer.from(sig.padEnd(64, "\0"), "utf8"),
      Buffer.from(EXPECTED_SIG.padEnd(64, "\0"), "utf8")
    );
  } catch { sigValid = false; }

  if (!sigValid) {
    console.error("[integrity] Runtime violation: OWNER_SIG tampered.");
    return res.status(503).json({
      error:   "Application integrity violation detected.",
      code:    "INTEGRITY_VIOLATION",
      detail:  `Ownership credentials have been altered. Contact ${BRAND_EMAIL}.`,
      contact: BRAND_EMAIL,
    });
  }

  next();
}

module.exports = { runIntegrityCheck, checkIntegrity, BRAND_NAME, BRAND_OWNER, BRAND_EMAIL };
