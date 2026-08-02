// src/middleware/auth.js
"use strict";

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "s2r2-change-me-in-production";

/**
 * requireAuth — verifies Bearer JWT token.
 * Attaches decoded payload to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * requireRole(...roles) — role-based access control guard.
 * Must be used AFTER requireAuth so that req.user is populated.
 *
 * Usage:
 *   router.delete("/:id", requireAuth, requireRole("ADMIN"), handler);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden — requires role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
