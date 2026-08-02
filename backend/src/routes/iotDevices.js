// src/routes/iotDevices.js
"use strict";

const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

async function logActivity(prisma, username, module, label, action) {
  await prisma.activityLog.create({
    data: { module, label, action, username },
  });
}

// GET /api/iot-devices?search=&status=&type=
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    const where = {};
    if (search) where.OR = [
      { name:     { contains: search, mode: "insensitive" } },
      { deviceId: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
    if (status) where.status = status.toUpperCase();
    if (type)   where.type   = { contains: type, mode: "insensitive" };

    const devices = await req.prisma.ioTDevice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ devices });
  } catch (err) { next(err); }
});

// GET /api/iot-devices/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const device = await req.prisma.ioTDevice.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
    });
    res.json(device);
  } catch (err) { next(err); }
});

// POST /api/iot-devices — ADMIN only
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { deviceId, name, type, location, status, metadata } = req.body;
    const device = await req.prisma.ioTDevice.create({
      data: {
        deviceId, name,
        type:     type     || null,
        location: location || null,
        status:   (status  || "ONLINE").toUpperCase(),
        metadata: metadata || null,
      },
    });
    await logActivity(req.prisma, req.user.username, "iot_device", device.name, "created");
    res.status(201).json(device);
  } catch (err) { next(err); }
});

// PUT /api/iot-devices/:id — ADMIN only
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id   = Number(req.params.id);
    const data = {};
    const fields = ["name","type","location","status","metadata"];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        data[f] = f === "status" ? req.body[f].toUpperCase() : req.body[f];
      }
    }
    const device = await req.prisma.ioTDevice.update({ where: { id }, data });
    await logActivity(req.prisma, req.user.username, "iot_device", device.name, "updated");
    res.json(device);
  } catch (err) { next(err); }
});

// PATCH /api/iot-devices/:id/ping — update lastPing
router.patch("/:id/ping", requireAuth, async (req, res, next) => {
  try {
    const id     = Number(req.params.id);
    const device = await req.prisma.ioTDevice.update({
      where: { id },
      data:  { lastPing: new Date(), status: "ONLINE" },
    });
    res.json(device);
  } catch (err) { next(err); }
});

// DELETE /api/iot-devices/:id — ADMIN only
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id     = Number(req.params.id);
    const device = await req.prisma.ioTDevice.delete({ where: { id } });
    await logActivity(req.prisma, req.user.username, "iot_device", device.name, "deleted");
    res.json({ message: "Deleted", id });
  } catch (err) { next(err); }
});

module.exports = router;
