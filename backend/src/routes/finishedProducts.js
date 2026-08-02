// src/routes/finishedProducts.js
"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function logActivity(prisma, username, module, label, action) {
  await prisma.activityLog.create({ data: { module, label, action, username } });
}

// GET /api/finished-products?search=&status=
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status) where.status = status.toUpperCase();
    const products = await req.prisma.finishedProduct.findMany({ where, orderBy: { updatedAt: "desc" } });
    res.json({ products });
  } catch (err) { next(err); }
});

// GET /api/finished-products/export/pdf
router.get("/export/pdf", requireAuth, async (req, res, next) => {
  try {
    let PDFDocument;
    try { PDFDocument = require("pdfkit"); }
    catch { return res.status(501).json({ error: "Run `npm install pdfkit` in the backend folder." }); }

    const products = await req.prisma.finishedProduct.findMany({ orderBy: { name: "asc" } });

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="finished-products.pdf"');

    const doc    = new PDFDocument({ margin: 40, size: "A4" });
    const cols   = [
      { label: "ID",       key: "id",       w: 40  },
      { label: "Name",     key: "name",     w: 160 },
      { label: "Qty",      key: "qty",      w: 60  },
      { label: "Unit",     key: "unit",     w: 80  },
      { label: "Category", key: "category", w: 120 },
      { label: "Status",   key: "status",   w: 75  },
    ];
    const ROW_H  = 18;
    const startX = doc.page.margins.left;
    const totalW = cols.reduce((s, c) => s + c.w, 0);

    doc.fontSize(18).font("Helvetica-Bold")
       .text("S2R2 — Finished Products", { align: "center" });
    doc.fontSize(9).font("Helvetica").fillColor("#666")
       .text(`Generated: ${new Date().toLocaleString()}  |  By: ${req.user.username}`, { align: "center" });
    doc.moveDown(1.2);

    let x = startX;
    doc.rect(startX, doc.y, totalW, ROW_H).fill("#059669");
    doc.fontSize(8).font("Helvetica-Bold");
    cols.forEach(col => {
      doc.fillColor("#fff").text(col.label, x + 4, doc.y - ROW_H + 4, { width: col.w - 8, lineBreak: false });
      x += col.w;
    });
    doc.moveDown(0.2);

    doc.font("Helvetica").fontSize(7);
    products.forEach((p, idx) => {
      if (doc.y > doc.page.height - doc.page.margins.bottom - ROW_H) doc.addPage();
      const rowY  = doc.y;
      const shade = idx % 2 === 0 ? "#ecfdf5" : "#ffffff";
      doc.rect(startX, rowY, totalW, ROW_H).fill(shade);
      x = startX;
      cols.forEach(col => {
        doc.fillColor("#111").text(String(p[col.key] ?? "—"), x + 4, rowY + 5, { width: col.w - 8, lineBreak: false });
        x += col.w;
      });
      doc.y = rowY + ROW_H;
    });

    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/finished-products/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const product = await req.prisma.finishedProduct.findUniqueOrThrow({ where: { id: Number(req.params.id) } });
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/finished-products
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, qty, unit, category, price, status } = req.body;
    const product = await req.prisma.finishedProduct.create({
      data: { name, qty: Number(qty), unit, category, price: Number(price ?? 0), status: (status || "ACTIVE").toUpperCase() },
    });
    await logActivity(req.prisma, req.user.username, "finished_product", product.name, "created");
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// PUT /api/finished-products/:id
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id   = Number(req.params.id);
    const data = {};
    if (req.body.name     !== undefined) data.name     = req.body.name;
    if (req.body.qty      !== undefined) data.qty      = Number(req.body.qty);
    if (req.body.unit     !== undefined) data.unit     = req.body.unit;
    if (req.body.category !== undefined) data.category = req.body.category;
    if (req.body.price    !== undefined) data.price    = Number(req.body.price);
    if (req.body.status   !== undefined) data.status   = req.body.status.toUpperCase();
    const product = await req.prisma.finishedProduct.update({ where: { id }, data });
    await logActivity(req.prisma, req.user.username, "finished_product", product.name, "updated");
    res.json(product);
  } catch (err) { next(err); }
});

// DELETE /api/finished-products/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id      = Number(req.params.id);
    const product = await req.prisma.finishedProduct.delete({ where: { id } });
    await logActivity(req.prisma, req.user.username, "finished_product", product.name, "deleted");
    res.json({ message: "Deleted", id });
  } catch (err) { next(err); }
});

module.exports = router;
