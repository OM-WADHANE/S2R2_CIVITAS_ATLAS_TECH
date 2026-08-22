// src/routes/trial.js
// POST /api/trial/activate  — validate a license key, update in-memory expiry.
// Registered BEFORE checkTrial in server.js so it is NEVER blocked.
"use strict";

const express                    = require("express");
const router                     = express.Router();
const { activateLicense }        = require("../middleware/trial");
const CONTACT                    = "civitasatlasco@gmail.com";

/**
 * POST /api/trial/activate
 * Body: { key: string }
 *
 * Correct key  → 200 { valid: true, label, expiredOn, daysRemaining }
 * Wrong key    → 403 { valid: false, error, contact }
 *
 * No data is reset. All PostgreSQL records remain intact.
 */
router.post("/activate", (req, res) => {
  const { key } = req.body || {};

  const result = activateLicense((key || "").trim());

  if (!result.valid) {
    return res.status(403).json({
      valid:   false,
      error:   result.error,
      contact: CONTACT,
    });
  }

  return res.json({
    valid:         true,
    label:         result.label,
    expiredOn:     result.expiredOn,
    daysRemaining: result.daysRemaining,
  });
});

module.exports = router;
