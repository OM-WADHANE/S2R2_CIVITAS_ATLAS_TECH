// src/middleware/trial.js
// ─────────────────────────────────────────────────────────────
// Trial / License expiration guard.
//
// HOW IT WORKS
// ────────────
// Each license key encodes a fixed expiry date in the format:
//
//   Civitas@admin<ddmm>
//
// where <ddmm> is the expiry day+month in lowercase (e.g. 1809 = 18 Sep).
//
// LICENSE KEYS (start date: 19 Aug 2026)
// ─────────────────────────────────────
//   Civitas@admin1809  →  30-day trial   → expires 18 Sep 2026
//   Civitas@admin1909  →  1-month plan   → expires 19 Sep 2026
//   Civitas@admin1902  →  6-month plan   → expires 19 Feb 2027
//   Civitas@admin1908  →  1-year plan    → expires 19 Aug 2027
//
// KEY ACTIVATION (runtime — no restart, no data reset)
// ─────────────────────────────────────────────────────
//   POST /api/trial/activate { key }
//   → validates key, sets in-memory expiry to the key's fixed date.
//   → all PostgreSQL data is completely untouched.
//
// STARTUP CONFIG (backend/.env)
// ──────────────────────────────
//   TRIAL_LICENSE_KEY=<one of the keys above>   sets the active key at boot.
//   TRIAL_ENABLED=false                          fully licensed, no expiry.
//
// RESPONSE WHEN EXPIRED OR KEY MISSING
// ─────────────────────────────────────
//   HTTP 402  { error, code: "TRIAL_EXPIRED", expiredOn, contact }
//
// EXEMPTED PATHS (never blocked)
// ──────────────────────────────
//   POST /api/auth/login
//   POST /api/trial/activate
//   GET  /health
// ─────────────────────────────────────────────────────────────
"use strict";

const CONTACT = "civitasatlasco@gmail.com";

// ── License key → { label, expiry ISO string } ───────────────
// Key format: Civitas@admin<mmdd>  (month first, then day)
// Start date: 19 Aug 2026
//
//   Civitas@admin0919  →  1-month plan  →  expires 19 Sep 2026
//   Civitas@admin0219  →  6-month plan  →  expires 19 Feb 2027
//   Civitas@admin0819  →  1-year plan   →  expires 19 Aug 2027
const LICENSE_KEYS = {
  "Civitas@admin0919": { label: "1-month plan", expiry: "2026-09-19" },
  "Civitas@admin0219": { label: "6-month plan", expiry: "2027-02-19" },
  "Civitas@admin0819": { label: "1-year plan",  expiry: "2027-08-19" },
};

// Exempt paths — never blocked regardless of trial state
const EXEMPT_PATHS = ["/api/auth/login", "/api/trial/activate", "/health"];

// ── Mutable runtime state ─────────────────────────────────────
let _expiryDate   = null;   // null = licensed (no expiry)
let _activePlan   = null;   // human-readable plan label
let _keyVerified  = false;

/**
 * Look up a key in the license table.
 * Returns { label, expiryDate } or null if not found.
 */
function lookupKey(key) {
  const entry = LICENSE_KEYS[(key || "").trim()];
  if (!entry) return null;
  const d = new Date(entry.expiry);
  if (entry.expiryTime) {
    const [hh, mm] = entry.expiryTime.split(":").map(Number);
    d.setHours(hh, mm, 0, 0);
  } else {
    // End of day in LOCAL time so users don't expire mid-day due to UTC offset
    d.setHours(23, 59, 59, 999);
  }
  return { label: entry.label, expiryDate: d };
}

/**
 * Resolve initial expiry from env vars at startup.
 */
function resolveExpiryDate() {
  // TRIAL_ENABLED=false → fully licensed, skip all checks
  const enabled = (process.env.TRIAL_ENABLED ?? "true").toLowerCase();
  if (enabled === "false" || enabled === "0") {
    _keyVerified = true;
    _activePlan  = "licensed";
    console.log("[trial] TRIAL_ENABLED=false — running as fully licensed.");
    return null;
  }

  // Check env key
  const envKey = (process.env.TRIAL_LICENSE_KEY || "").trim();
  if (!envKey) {
    console.warn("[trial] TRIAL_LICENSE_KEY not set — app is unlicensed.");
    return new Date(0);
  }

  const match = lookupKey(envKey);
  if (!match) {
    console.warn(`[trial] TRIAL_LICENSE_KEY "${envKey}" is not a recognised key — app is unlicensed.`);
    return new Date(0);
  }

  _keyVerified = true;
  _activePlan  = match.label;
  return match.expiryDate;
}

// Initialise at startup
_expiryDate = resolveExpiryDate();

if (_expiryDate && _expiryDate.getTime() === new Date(0).getTime()) {
  console.log("[trial] ⚠️  No valid license key — all protected routes are blocked.");
} else if (_expiryDate) {
  console.log(`[trial] Plan "${_activePlan}" — expires on ${_expiryDate.toISOString().slice(0, 10)}`);
} else {
  console.log("[trial] Running as fully licensed — no expiry.");
}

/**
 * activateLicense — called by POST /api/trial/activate.
 * Validates the submitted key and updates the in-memory expiry.
 * Zero data is touched — all PostgreSQL records remain exactly as-is.
 *
 * @param   {string} key
 * @returns {{ valid: boolean, label?: string, expiredOn?: string, daysRemaining?: number, error?: string }}
 */
function activateLicense(key) {
  const match = lookupKey(key);

  if (!match) {
    return {
      valid: false,
      error: "Invalid license key. Please contact Civitas Atlas for a valid key.",
    };
  }

  // Update runtime state
  _expiryDate  = match.expiryDate;
  _activePlan  = match.label;
  _keyVerified = true;

  const now           = new Date();
  const msRemaining   = _expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  console.log(`[trial] Key "${key}" accepted — plan "${_activePlan}", expires ${_expiryDate.toISOString().slice(0, 10)} (${daysRemaining} days).`);

  return {
    valid:        true,
    label:        match.label,
    expiredOn:    _expiryDate.toISOString().slice(0, 10),
    daysRemaining,
  };
}

/**
 * checkTrial — Express middleware.
 * Blocks with 402 when trial is expired or no valid key is set.
 */
function checkTrial(req, res, next) {
  // null = licensed mode
  if (_expiryDate === null) return next();

  // Exempt paths always pass
  const fullPath = req.originalUrl.split("?")[0];
  if (EXEMPT_PATHS.some(p => fullPath === p || fullPath.startsWith(p))) return next();

  const now = new Date();
  if (now > _expiryDate) {
    return res.status(402).json({
      error:     "Trial period has ended",
      code:      "TRIAL_EXPIRED",
      expiredOn: _expiryDate.getTime() === new Date(0).getTime()
                   ? "unlicensed"
                   : _expiryDate.toISOString().slice(0, 10),
      contact:   CONTACT,
    });
  }

  req.trialDaysLeft = Math.ceil((_expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  next();
}

/**
 * getTrialStatus — used by /health.
 */
function getTrialStatus() {
  if (!_keyVerified) {
    return { mode: "unlicensed", enabled: true, expired: true, contact: CONTACT };
  }
  if (_expiryDate === null) {
    return { mode: "licensed", enabled: false };
  }
  const now           = new Date();
  const msRemaining   = _expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return {
    mode:          _activePlan || "custom",
    enabled:       true,
    expiredOn:     _expiryDate.toISOString().slice(0, 10),
    expired:       now > _expiryDate,
    daysRemaining: Math.max(0, daysRemaining),
    contact:       CONTACT,
  };
}

module.exports = { checkTrial, getTrialStatus, activateLicense, LICENSE_KEYS };
