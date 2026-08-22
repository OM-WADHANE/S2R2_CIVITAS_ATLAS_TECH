// src/routes/dashboard.js
"use strict";

const express        = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    const prisma = req.prisma;

    const now           = new Date();
    const startOfToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      rawMaterials,
      finishedProducts,
      clients,
      iotDevices,
      recentActivity,
      manufactureCountTotal,
      producedToday,
      producedThisMonth,
      outwardThisMonth,
      recentTransactions,
    ] = await Promise.all([
      prisma.rawMaterial.findMany(),
      prisma.finishedProduct.findMany(),
      prisma.client.findMany(),
      prisma.ioTDevice.findMany(),
      prisma.activityLog.findMany({ orderBy: { eventTime: "desc" }, take: 9 }),

      // Total manufacture transactions
      prisma.inventoryTransaction.count({ where: { transactionType: "MANUFACTURE" } }),

      // Units produced today (FINISHED_PRODUCT MANUFACTURE with positive qty)
      prisma.inventoryTransaction.aggregate({
        where: {
          transactionType: "MANUFACTURE",
          itemType:        "FINISHED_PRODUCT",
          createdAt:       { gte: startOfToday },
          quantity:        { gt: 0 },
        },
        _sum: { quantity: true },
      }),

      // Units produced this month
      prisma.inventoryTransaction.aggregate({
        where: {
          transactionType: "MANUFACTURE",
          itemType:        "FINISHED_PRODUCT",
          createdAt:       { gte: startOfMonth },
          quantity:        { gt: 0 },
        },
        _sum: { quantity: true },
      }),

      // Outward dispatches this month
      prisma.inventoryTransaction.aggregate({
        where: {
          transactionType: "OUTWARD",
          createdAt:       { gte: startOfMonth },
        },
        _sum: { quantity: true },
      }),

      // 10 most recent transactions
      prisma.inventoryTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take:    10,
      }),
    ]);

    // ── Raw Materials stats ──────────────────────────────────
    const lowRM   = rawMaterials.filter(i => i.quantity > 0 && i.quantity <= i.minStock);
    const outRM   = rawMaterials.filter(i => i.quantity === 0);
    const rawVal  = rawMaterials.reduce((s, i) => s + i.quantity * i.price, 0);

    // ── Finished Products stats ──────────────────────────────
    const fpLow   = finishedProducts.filter(p => p.qty > 0 && p.minStock > 0 && p.qty <= p.minStock);
    const fpOut   = finishedProducts.filter(p => p.qty === 0 && p.minStock > 0);
    const fpVal   = finishedProducts.reduce((s, p) => s + p.qty * (p.price ?? 0), 0);
    const ready   = finishedProducts.filter(p => p.status === "ACTIVE");

    // ── Clients ──────────────────────────────────────────────
    const newThisMonth = clients.filter(c => new Date(c.createdAt) >= startOfMonth);

    // ── Stock movement chart ─────────────────────────────────
    const stockMovement = {
      labels: ["Raw Materials", "Finished Products", "Clients", "IoT Devices"],
      values: [rawMaterials.length, finishedProducts.length, clients.length, iotDevices.length],
    };

    // ── Cost / Price analysis ────────────────────────────────
    const topRaw = [...rawMaterials]
      .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
      .slice(0, 5)
      .map(i => ({
        id: i.id, name: i.name, quantity: i.quantity,
        price: i.price, total_value: i.quantity * i.price, unit: i.unit,
      }));

    const topFp = [...finishedProducts]
      .sort((a, b) => (b.qty * b.price) - (a.qty * a.price))
      .slice(0, 5)
      .map(p => ({
        id: p.id, name: p.name, qty: p.qty,
        price: p.price, total_value: p.qty * p.price, unit: p.unit,
      }));

    const potentialRevenue = finishedProducts.reduce((s, p) => s + p.qty * (p.price ?? 0), 0);

    res.json({
      raw_materials: {
        total_items:       rawMaterials.length,
        total_qty:         rawMaterials.reduce((s, i) => s + i.quantity, 0),
        total_stock_value: rawVal,
        low_stock_count:   lowRM.length,
        out_of_stock:      outRM.length,
      },
      finished_products: {
        total_products:    finishedProducts.length,
        total_qty:         finishedProducts.reduce((s, p) => s + p.qty, 0),
        total_stock_value: fpVal,
        ready_stock:       ready.length,
        low_stock_count:   fpLow.length,
        out_of_stock:      fpOut.length,
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
      low_stock_alerts: [
        ...lowRM.map(i => ({
          id: i.id, name: i.name, quantity: i.quantity,
          unit: i.unit, min_stock: i.minStock, module: "raw_material",
        })),
        ...[...fpLow, ...fpOut].map(p => ({
          id: p.id, name: p.name, quantity: p.qty,
          unit: p.unit, min_stock: p.minStock, module: "finished_product",
        })),
      ],
      recent_activity: recentActivity.map(log => ({
        module:     log.module,
        label:      log.label,
        action:     log.action,
        username:   log.username,
        event_time: log.eventTime,
      })),
      stock_movement: stockMovement,

      // ── Manufacture stats ────────────────────────────────
      manufacture: {
        total_transactions:  manufactureCountTotal,
        produced_today:      producedToday._sum.quantity      ?? 0,
        produced_this_month: producedThisMonth._sum.quantity  ?? 0,
        outward_this_month:  outwardThisMonth._sum.quantity   ?? 0,
      },

      // ── Cost / Price analysis ────────────────────────────
      cost_analysis: {
        raw_material_total_value:     rawVal,
        finished_product_total_value: fpVal,
        potential_revenue:            potentialRevenue,
        top_raw_materials:            topRaw,
        top_finished_products:        topFp,
      },

      // ── Recent transactions ──────────────────────────────
      recent_transactions: recentTransactions,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
