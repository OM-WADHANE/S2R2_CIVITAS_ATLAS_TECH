// src/routes/auth.js
"use strict";

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

const router  = express.Router();
const SECRET  = process.env.JWT_SECRET || "s2r2-change-me-in-production";

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });

    const user = await req.prisma.user.findUnique({ where: { username } });
    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
