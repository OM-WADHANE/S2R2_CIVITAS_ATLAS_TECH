// src/routes/rawMaterials.js
"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function deriveStatus(item) {
  if (item.quantity === 0)            return "out";
  if (item.quantity <= item.minStock) return "low";
  return "active";
}

async function logActivity(prisma, username, module, label, action) {
  await prisma.activityLog.create({ data: { module, label, action, username } });
}

// ── Helpers shared by both PDF routes ─────────────────────────
function buildPdf(PDFDocument, items, generatedBy) {
  const doc    = new PDFDocument({ margin: 40, size: "A4" });
  const cols   = [
    { label: "ID",       key: "id",          w: 28  },
    { label: "Name",     key: "name",         w: 100 },
    { label: "Category", key: "category",     w: 75  },
    { label: "Qty",      key: "quantity",     w: 40  },
    { label: "Unit",     key: "unit",         w: 35  },
    { label: "Supplier", key: "supplier",     w: 80  },
    { label: "Location", key: "location",     w: 70  },
    { label: "Min",      key: "minStock",     w: 32  },
    { label: "Price ₹",  key: "price",        w: 55  },
    { label: "Status",   key: "status",       w: 50  },
  ];
  const ROW_H  = 18;
  const startX = doc.page.margins.left;
  const totalW = cols.reduce((s, c) => s + c.w, 0);

  doc.fontSize(18).font("Helvetica-Bold")
     .text("S2R2 — Raw Materials", { align: "center" });
  doc.fontSize(9).font("Helvetica").fillColor("#666")
     .text(`Generated: ${new Date().toLocaleString()}  |  By: ${generatedBy}`, { align: "center" });
  doc.moveDown(1.2);

  // Header row
  let x = startX;
  doc.rect(startX, doc.y, totalW, ROW_H).fill("#1d4ed8");
  doc.fontSize(7).font("Helvetica-Bold");
  cols.forEach(col => {
    doc.fillColor("#fff").text(col.label, x + 3, doc.y - ROW_H + 5, { width: col.w - 6, lineBreak: false });
    x += col.w;
  });
  doc.moveDown(0.2);

  doc.font("Helvetica").fontSize(6.5);
  items.forEach((item, idx) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - ROW_H) doc.addPage();
    const rowY  = doc.y;
    const shade = idx % 2 === 0 ? "#eff6ff" : "#ffffff";
    doc.rect(startX, rowY, totalW, ROW_H).fill(shade);
    x = startX;
    cols.forEach(col => {
      let val = item[col.key] ?? "—";
      if (col.key === "price")  val = `${Number(val).toLocaleString()}`;
      if (col.key === "status") val = String(val).toUpperCase();
      doc.fillColor("#111").text(String(val), x + 3, rowY + 5, { width: col.w - 6, lineBreak: false });
      x += col.w;
    });
    doc.y = rowY + ROW_H;
  });

  return doc;
}

// GET /api/raw-materials?search=&category=&status=
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const where = {};
    if (search)   where.OR = [
      { name:        { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { supplier:    { contains: search, mode: "insensitive" } },
    ];
    if (category) where.category = category;
    let items = await req.prisma.rawMaterial.findMany({ where, orderBy: { updatedAt: "desc" } });
    if (status)   items = items.filter(i => deriveStatus(i) === status);
    res.json({ items: items.map(i => ({ ...i, status: deriveStatus(i) })) });
  } catch (err) { next(err); }
});

// GET /api/raw-materials/export/pdf
router.get("/export/pdf", requireAuth, async (req, res, next) => {
  try {
    let PDFDocument;
    try { PDFDocument = require("pdfkit"); }
    catch { return res.status(501).json({ error: "Run `npm install pdfkit` in the backend folder." }); }

    const items = await req.prisma.rawMaterial.findMany({ orderBy: { name: "asc" } });
    const withStatus = items.map(i => ({ ...i, status: deriveStatus(i) }));

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="raw-materials.pdf"');
    const doc = buildPdf(PDFDocument, withStatus, req.user.username);
    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/raw-materials/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const item = await req.prisma.rawMaterial.findUniqueOrThrow({ where: { id: Number(req.params.id) } });
    res.json({ ...item, status: deriveStatus(item) });
  } catch (err) { next(err); }
});

// POST /api/raw-materials
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, category, description, quantity, unit, supplier, location, minStock, price } = req.body;
    const item = await req.prisma.rawMaterial.create({
      data: { name, category, description, quantity: Number(quantity), unit, supplier, location, minStock: Number(minStock), price: Number(price) },
    });
    await logActivity(req.prisma, req.user.username, "raw_material", item.name, "created");
    res.status(201).json({ ...item, status: deriveStatus(item) });
  } catch (err) { next(err); }
});

// PUT /api/raw-materials/:id
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id   = Number(req.params.id);
    const data = {};
    const fields = ["name","category","description","quantity","unit","supplier","location","minStock","price"];
    for (const f of fields) {
      if (req.body[f] !== undefined)
        data[f] = ["quantity","minStock","price"].includes(f) ? Number(req.body[f]) : req.body[f];
    }
    data.lastUpdated = new Date();
    const item = await req.prisma.rawMaterial.update({ where: { id }, data });
    await logActivity(req.prisma, req.user.username, "raw_material", item.name, "updated");
    res.json({ ...item, status: deriveStatus(item) });
  } catch (err) { next(err); }
});

// DELETE /api/raw-materials/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id   = Number(req.params.id);
    const item = await req.prisma.rawMaterial.delete({ where: { id } });
    await logActivity(req.prisma, req.user.username, "raw_material", item.name, "deleted");
    res.json({ message: "Deleted", id });
  } catch (err) { next(err); }
});

module.exports = router;
