// src/routes/users.js — User management (ADMIN only)
"use strict";

const express = require("express");
const bcrypt  = require("bcryptjs");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// All routes require auth. Write routes also require ADMIN role.

// GET /api/users — list all users (admins only)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const users = await req.prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ users });
  } catch (err) { next(err); }
});

// GET /api/users/me — current logged-in user info
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUniqueOrThrow({
      where:  { id: req.user.sub },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/users — create a new user (ADMIN only)
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password are required" });

    const VALID_ROLES = ["ADMIN", "EDITOR", "VIEWER"];
    const assignedRole = VALID_ROLES.includes(role) ? role : "VIEWER";

    const hash = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: { username, password: hash, role: assignedRole },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    // Unique constraint violation (duplicate username)
    if (err.code === "P2002")
      return res.status(409).json({ error: "Username already exists" });
    next(err);
  }
});

// PUT /api/users/:id — update username / role (ADMIN only)
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id   = Number(req.params.id);
    const data = {};

    if (req.body.username !== undefined) data.username = req.body.username;
    if (req.body.role     !== undefined) {
      const VALID = ["ADMIN", "EDITOR", "VIEWER"];
      if (!VALID.includes(req.body.role))
        return res.status(400).json({ error: `role must be one of: ${VALID.join(", ")}` });
      data.role = req.body.role;
    }
    if (req.body.password) {
      data.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await req.prisma.user.update({
      where:  { id },
      data,
      select: { id: true, username: true, role: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Username already exists" });
    next(err);
  }
});

// DELETE /api/users/:id — delete a user (ADMIN only, cannot delete yourself)
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.sub)
      return res.status(400).json({ error: "You cannot delete your own account" });
    await req.prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted", id });
  } catch (err) { next(err); }
});

module.exports = router;
