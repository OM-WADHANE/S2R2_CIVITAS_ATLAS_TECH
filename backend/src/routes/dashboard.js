// src/routes/dashboard.js
"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats
// Returns aggregated stats for all modules
router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    const prisma = req.prisma;

    // Run all queries in parallel for performance
    const [
      rawMaterials,
      finishedProducts,
      clients,
      iotDevices,
      recentActivity,
    ] = await Promise.all([
      prisma.rawMaterial.findMany(),
      prisma.finishedProduct.findMany(),
      prisma.client.findMany(),
      prisma.ioTDevice.findMany(),
      prisma.activityLog.findMany({
        orderBy: { eventTime: "desc" },
        take: 9,
      }),
    ]);

    // ── Raw Materials stats ──────────────────────────────────
    const lowStockItems   = rawMaterials.filter(i => i.quantity > 0 && i.quantity <= i.minStock);
    const outOfStockItems = rawMaterials.filter(i => i.quantity === 0);
    const rawStockValue   = rawMaterials.reduce((s, i) => s + i.quantity * i.price, 0);

    // ── Finished Products stats ──────────────────────────────
    const readyStock         = finishedProducts.filter(p => p.status === "ACTIVE");
    const finishedStockValue = finishedProducts.reduce((s, p) => s + p.qty * (p.price ?? 0), 0);

    // ── Clients stats ────────────────────────────────────────
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = clients.filter(c => new Date(c.createdAt) >= startOfMonth);

    // ── Stock movement chart ──────────────────────────────────
    const stockMovement = {
      labels: ["Raw Materials", "Finished Products", "Clients", "IoT Devices"],
      values: [rawMaterials.length, finishedProducts.length, clients.length, iotDevices.length],
    };

    res.json({
      raw_materials: {
        total_items:       rawMaterials.length,
        total_qty:         rawMaterials.reduce((s, i) => s + i.quantity, 0),
        total_stock_value: rawStockValue,
        low_stock_count:   lowStockItems.length,
        out_of_stock:      outOfStockItems.length,
      },
      finished_products: {
        total_products:    finishedProducts.length,
        total_qty:         finishedProducts.reduce((s, p) => s + p.qty, 0),
        total_stock_value: finishedStockValue,
        ready_stock:       readyStock.length,
      },
      clients: {
        total_clients:  clients.length,
        new_this_month: newThisMonth.length,
      },
      iot_devices: {
        total:       iotDevices.length,
        online:      iotDevices.filter(d => d.status === "ONLINE").length,
        offline:     iotDevices.filter(d => d.status === "OFFLINE").length,
        maintenance: iotDevices.filter(d => d.status === "MAINTENANCE").length,
      },
      low_stock_alerts: lowStockItems.map(item => ({
        id:        item.id,
        name:      item.name,
        quantity:  item.quantity,
        unit:      item.unit,
        min_stock: item.minStock,
      })),
      recent_activity: recentActivity.map(log => ({
        module:     log.module,
        label:      log.label,
        action:     log.action,
        username:   log.username,
        event_time: log.eventTime,
      })),
      stock_movement: stockMovement,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
