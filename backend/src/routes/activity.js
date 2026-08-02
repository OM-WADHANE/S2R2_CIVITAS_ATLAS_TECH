// src/routes/activity.js
"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/activity
 * Query params:
 *   module   — raw_material | finished_product | client | iot_device
 *   action   — created | updated | deleted
 *   username — filter by who performed the action
 *   limit    — max rows (default 50, max 200)
 *   page     — page number (default 1)
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { module, action, username } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page  = Math.max(Number(req.query.page)  || 1,  1);
    const skip  = (page - 1) * limit;

    const where = {};
    if (module)   where.module   = module;
    if (action)   where.action   = action;
    if (username) where.username = { contains: username, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      req.prisma.activityLog.findMany({
        where,
        orderBy: { eventTime: "desc" },
        take:    limit,
        skip,
      }),
      req.prisma.activityLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/activity/users
 * Returns distinct usernames that have activity — for filter dropdowns.
 */
router.get("/users", requireAuth, async (req, res, next) => {
  try {
    const rows = await req.prisma.activityLog.findMany({
      select:   { username: true },
      distinct: ["username"],
      orderBy:  { username: "asc" },
    });
    res.json({ users: rows.map(r => r.username) });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/activity — ADMIN only, clears all logs
 */
router.delete("/", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden — ADMIN only" });
    }
    await req.prisma.activityLog.deleteMany({});
    res.json({ message: "Activity log cleared" });
  } catch (err) { next(err); }
});

module.exports = router;
