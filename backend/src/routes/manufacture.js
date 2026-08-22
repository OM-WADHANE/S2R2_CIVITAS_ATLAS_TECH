// src/routes/manufacture.js
// ─────────────────────────────────────────────────────────────
// Handles all stock movement operations:
//
//   POST /api/manufacture/inward      — receive raw materials or finished products
//   POST /api/manufacture/outward     — dispatch finished products to clients
//   POST /api/manufacture/produce     — convert raw materials → finished products via BOM
//   GET  /api/manufacture/bom/:id     — get BOM for a finished product
//   POST /api/manufacture/bom/:id     — set/update BOM entries for a finished product
//   GET  /api/manufacture/feasibility/:id?qty=N — check if manufacture is possible
//   GET  /api/manufacture/transactions — paginated transaction history
// ─────────────────────────────────────────────────────────────
"use strict";

const express        = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── helpers ───────────────────────────────────────────────────
function deriveStatus(item) {
  if (item.quantity === 0)            return "out";
  if (item.quantity <= item.minStock) return "low";
  return "active";
}

async function logActivity(prisma, username, module, label, action) {
  await prisma.activityLog.create({ data: { module, label, action, username } });
}

async function logTransaction(prisma, { type, itemType, itemId, itemName, quantity, note, performedBy }) {
  return prisma.inventoryTransaction.create({
    data: {
      transactionType: type,
      itemType,
      itemId,
      itemName,
      quantity,
      note:        note || null,
      performedBy,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// GET /api/manufacture/bom/all
// Returns BOM for every finished product in one call.
// Used by the BOM management page.
// ─────────────────────────────────────────────────────────────
router.get("/bom/all", requireAuth, async (req, res, next) => {
  try {
    const products = await req.prisma.finishedProduct.findMany({
      orderBy: { name: "asc" },
      include: {
        bomEntries: {
          include: { rawMaterial: true },
          orderBy: { rawMaterial: { name: "asc" } },
        },
      },
    });

    res.json({
      products: products.map(p => ({
        id:       p.id,
        name:     p.name,
        unit:     p.unit,
        category: p.category,
        entries:  p.bomEntries.map(e => ({
          id:               e.id,
          rawMaterialId:    e.rawMaterialId,
          rawMaterialName:  e.rawMaterial.name,
          unit:             e.rawMaterial.unit,
          currentStock:     e.rawMaterial.quantity,
          unitPrice:        e.rawMaterial.price,
          quantityRequired: e.quantityRequired,
        })),
      })),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/manufacture/bom/:finishedProductId
// Returns the BOM (with raw material details) for a product.
// ─────────────────────────────────────────────────────────────
router.get("/bom/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const entries = await req.prisma.billOfMaterials.findMany({
      where:   { finishedProductId: id },
      include: { rawMaterial: true },
      orderBy: { rawMaterial: { name: "asc" } },
    });
    res.json({
      finishedProductId: id,
      entries: entries.map(e => ({
        id:               e.id,
        rawMaterialId:    e.rawMaterialId,
        rawMaterialName:  e.rawMaterial.name,
        unit:             e.rawMaterial.unit,
        currentStock:     e.rawMaterial.quantity,
        unitPrice:        e.rawMaterial.price,
        quantityRequired: e.quantityRequired,
      })),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/manufacture/bom/:finishedProductId
// Body: { entries: [{ rawMaterialId, quantityRequired }] }
// Replaces all BOM entries for the product.
// ─────────────────────────────────────────────────────────────
router.post("/bom/:id", requireAuth, async (req, res, next) => {
  try {
    const id      = Number(req.params.id);
    const entries = req.body.entries || [];

    // Validate product exists
    await req.prisma.finishedProduct.findUniqueOrThrow({ where: { id } });

    // Replace all entries atomically
    await req.prisma.$transaction([
      req.prisma.billOfMaterials.deleteMany({ where: { finishedProductId: id } }),
      ...entries.map(e =>
        req.prisma.billOfMaterials.create({
          data: {
            finishedProductId: id,
            rawMaterialId:     Number(e.rawMaterialId),
            quantityRequired:  Number(e.quantityRequired) || 1,
          },
        })
      ),
    ]);

    await logActivity(req.prisma, req.user.username, "finished_product", `BOM updated`, "updated");
    res.json({ message: "BOM updated", finishedProductId: id, count: entries.length });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/manufacture/feasibility/:finishedProductId?qty=N
// Returns whether manufacture of qty units is possible,
// with per-material breakdown (available, required, shortfall).
// ─────────────────────────────────────────────────────────────
router.get("/feasibility/:id", requireAuth, async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const qty = Math.max(1, Number(req.query.qty) || 1);

    const bom = await req.prisma.billOfMaterials.findMany({
      where:   { finishedProductId: id },
      include: { rawMaterial: true },
    });

    if (bom.length === 0) {
      return res.json({ feasible: false, reason: "No BOM defined for this product.", materials: [] });
    }

    let feasible = true;
    const materials = bom.map(entry => {
      const required  = entry.quantityRequired * qty;
      const available = entry.rawMaterial.quantity;
      const shortfall = Math.max(0, required - available);
      if (shortfall > 0) feasible = false;
      return {
        rawMaterialId:   entry.rawMaterialId,
        name:            entry.rawMaterial.name,
        unit:            entry.rawMaterial.unit,
        available,
        required,
        shortfall,
        sufficient:      shortfall === 0,
      };
    });

    res.json({ feasible, qty, materials });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/manufacture/inward
// Body: { itemType: "RAW_MATERIAL"|"FINISHED_PRODUCT", itemId, quantity, note? }
// Adds stock — used when receiving raw materials or restocking finished goods.
// ─────────────────────────────────────────────────────────────
router.post("/inward", requireAuth, async (req, res, next) => {
  try {
    const { itemType, itemId, quantity, note } = req.body;
    const qty = Number(quantity);
    const id  = Number(itemId);

    if (!["RAW_MATERIAL", "FINISHED_PRODUCT"].includes(itemType))
      return res.status(400).json({ error: "itemType must be RAW_MATERIAL or FINISHED_PRODUCT" });
    if (!qty || qty <= 0)
      return res.status(400).json({ error: "quantity must be a positive number" });

    let item, itemName, updated;

    if (itemType === "RAW_MATERIAL") {
      item = await req.prisma.rawMaterial.findUniqueOrThrow({ where: { id } });
      updated = await req.prisma.rawMaterial.update({
        where: { id },
        data:  { quantity: { increment: qty }, lastUpdated: new Date() },
      });
      itemName = item.name;
      await logActivity(req.prisma, req.user.username, "raw_material", `${item.name} +${qty} (INWARD)`, "updated");
    } else {
      item = await req.prisma.finishedProduct.findUniqueOrThrow({ where: { id } });
      updated = await req.prisma.finishedProduct.update({
        where: { id },
        data:  { qty: { increment: qty } },
      });
      itemName = item.name;
      await logActivity(req.prisma, req.user.username, "finished_product", `${item.name} +${qty} (INWARD)`, "updated");
    }

    await logTransaction(req.prisma, {
      type: "INWARD", itemType, itemId: id, itemName, quantity: qty,
      note, performedBy: req.user.username,
    });

    res.json({ message: "Inward recorded", item: updated, transactionType: "INWARD" });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/manufacture/outward
// Body: { itemId, quantity, note? }
// Dispatches finished products — reduces finished product stock.
// ─────────────────────────────────────────────────────────────
router.post("/outward", requireAuth, async (req, res, next) => {
  try {
    const { itemId, quantity, note } = req.body;
    const qty = Number(quantity);
    const id  = Number(itemId);

    if (!qty || qty <= 0)
      return res.status(400).json({ error: "quantity must be a positive number" });

    const product = await req.prisma.finishedProduct.findUniqueOrThrow({ where: { id } });

    if (product.qty < qty)
      return res.status(422).json({
        error:     `Insufficient stock. Available: ${product.qty}, Requested: ${qty}`,
        available: product.qty,
        requested: qty,
      });

    const updated = await req.prisma.finishedProduct.update({
      where: { id },
      data:  { qty: { decrement: qty } },
    });

    await logActivity(req.prisma, req.user.username, "finished_product", `${product.name} -${qty} (OUTWARD)`, "updated");
    await logTransaction(req.prisma, {
      type: "OUTWARD", itemType: "FINISHED_PRODUCT", itemId: id,
      itemName: product.name, quantity: qty, note, performedBy: req.user.username,
    });

    res.json({ message: "Outward recorded", item: updated, transactionType: "OUTWARD" });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/manufacture/produce
// Body: { finishedProductId, quantity, note? }
//
// Core BOM logic:
//  1. Load BOM for finished product
//  2. Calculate raw material requirements × quantity
//  3. Validate all raw materials have sufficient stock
//  4. Deduct raw materials atomically
//  5. Increment finished product stock
//  6. Log one MANUFACTURE transaction per deducted material + one for the output
// ─────────────────────────────────────────────────────────────
router.post("/produce", requireAuth, async (req, res, next) => {
  try {
    const { finishedProductId, quantity, note } = req.body;
    const qty = Number(quantity);
    const id  = Number(finishedProductId);

    if (!qty || qty <= 0)
      return res.status(400).json({ error: "quantity must be a positive number" });

    // Step 1 — load BOM
    const bom = await req.prisma.billOfMaterials.findMany({
      where:   { finishedProductId: id },
      include: { rawMaterial: true },
    });

    if (bom.length === 0)
      return res.status(422).json({
        error: "No Bill of Materials defined for this product. Add BOM entries first.",
      });

    // Step 2 — calculate requirements
    const requirements = bom.map(entry => ({
      rawMaterialId: entry.rawMaterialId,
      name:          entry.rawMaterial.name,
      unit:          entry.rawMaterial.unit,
      required:      entry.quantityRequired * qty,
      available:     entry.rawMaterial.quantity,
      shortfall:     Math.max(0, (entry.quantityRequired * qty) - entry.rawMaterial.quantity),
    }));

    // Step 3 — validate sufficiency
    const insufficient = requirements.filter(r => r.shortfall > 0);
    if (insufficient.length > 0) {
      return res.status(422).json({
        error:        "Insufficient raw material stock to manufacture requested quantity.",
        insufficient: insufficient.map(r => ({
          name:      r.name,
          required:  r.required,
          available: r.available,
          shortfall: r.shortfall,
          unit:      r.unit,
        })),
      });
    }

    // Step 4+5 — atomic deduction + increment
    const product = await req.prisma.finishedProduct.findUniqueOrThrow({ where: { id } });

    await req.prisma.$transaction([
      // Deduct each raw material
      ...requirements.map(r =>
        req.prisma.rawMaterial.update({
          where: { id: r.rawMaterialId },
          data:  { quantity: { decrement: r.required }, lastUpdated: new Date() },
        })
      ),
      // Increment finished product
      req.prisma.finishedProduct.update({
        where: { id },
        data:  { qty: { increment: qty } },
      }),
    ]);

    // Step 6 — log transactions for each deduction + the output
    await Promise.all([
      ...requirements.map(r =>
        logTransaction(req.prisma, {
          type: "MANUFACTURE", itemType: "RAW_MATERIAL",
          itemId: r.rawMaterialId, itemName: r.name,
          quantity: -r.required,
          note: `Used in manufacture of ${qty}x ${product.name}`,
          performedBy: req.user.username,
        })
      ),
      logTransaction(req.prisma, {
        type: "MANUFACTURE", itemType: "FINISHED_PRODUCT",
        itemId: id, itemName: product.name,
        quantity: qty,
        note: note || `Manufactured ${qty} unit(s)`,
        performedBy: req.user.username,
      }),
    ]);

    await logActivity(req.prisma, req.user.username, "finished_product",
      `Manufactured ${qty}x ${product.name}`, "updated");

    // Check for low-stock alerts after deduction
    const updatedMaterials = await req.prisma.rawMaterial.findMany({
      where: { id: { in: requirements.map(r => r.rawMaterialId) } },
    });
    const lowStockAlerts = updatedMaterials
      .filter(m => m.quantity <= m.minStock)
      .map(m => ({ id: m.id, name: m.name, quantity: m.quantity, minStock: m.minStock, unit: m.unit }));

    res.json({
      message:        `Successfully manufactured ${qty} unit(s) of ${product.name}`,
      produced:       qty,
      product:        product.name,
      deductions:     requirements.map(r => ({ name: r.name, deducted: r.required, unit: r.unit })),
      lowStockAlerts,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/manufacture/transactions?page=1&limit=20&type=&itemType=
// Paginated transaction history
// ─────────────────────────────────────────────────────────────
router.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const where = {};
    if (req.query.type)     where.transactionType = req.query.type.toUpperCase();
    if (req.query.itemType) where.itemType        = req.query.itemType.toUpperCase();
    if (req.query.search)   where.itemName        = { contains: req.query.search, mode: "insensitive" };

    const [transactions, total] = await Promise.all([
      req.prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      req.prisma.inventoryTransaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

module.exports = router;
