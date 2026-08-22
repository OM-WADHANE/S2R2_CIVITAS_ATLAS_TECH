// src/routes/intelligence.js
// ─────────────────────────────────────────────────────────────
// Civi AI — Decision Support Intelligence Engine
// Powered by Civitas Atlas Technologies Pvt. Ltd.
//
// GET  /api/intelligence          — full intelligence data + Groq AI narrative
// GET  /api/intelligence/export/pdf — streams a detailed PDF report
// ─────────────────────────────────────────────────────────────
"use strict";

const express         = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── Groq AI client (lazy-init so startup never fails if key missing) ──
let _groq = null;
function getGroq() {
  if (_groq) return _groq;
  try {
    const { Groq } = require("groq-sdk");
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
  } catch {
    return null;
  }
}

// ── Shared intelligence computation ──────────────────────────
async function computeIntelligence(prisma) {
  const now        = new Date();
  const thirty_ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [rawMaterials, finishedProducts, bomEntries, txLast30] = await Promise.all([
    prisma.rawMaterial.findMany(),
    prisma.finishedProduct.findMany(),
    prisma.billOfMaterials.findMany({ include: { rawMaterial: true } }),
    prisma.inventoryTransaction.findMany({
      where: {
        createdAt: { gte: thirty_ago },
        transactionType: { in: ["OUTWARD", "MANUFACTURE"] },
      },
    }),
  ]);

  // ── 1. Reorder alerts ────────────────────────────────────────
  const reorder_alerts = rawMaterials
    .map(item => {
      const ratio   = item.minStock > 0 ? item.quantity / item.minStock : 99;
      let urgency   = "OK";
      if (item.quantity === 0)  urgency = "CRITICAL";
      else if (ratio <= 1)      urgency = "HIGH";
      else if (ratio <= 1.5)    urgency = "MEDIUM";
      return {
        id: item.id, name: item.name, category: item.category,
        current_qty: item.quantity, min_stock: item.minStock,
        unit: item.unit, unit_price: item.price,
        urgency, ratio: Math.round(ratio * 100) / 100,
        supplier: item.supplier || null,
      };
    })
    .filter(a => a.urgency !== "OK")
    .sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2 }[a.urgency] ?? 3) - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2 }[b.urgency] ?? 3));

  // ── 2. Manufacture readiness ─────────────────────────────────
  const bomByProduct = {};
  for (const e of bomEntries) {
    if (!bomByProduct[e.finishedProductId]) bomByProduct[e.finishedProductId] = [];
    bomByProduct[e.finishedProductId].push(e);
  }

  const manufacture_readiness = finishedProducts
    .filter(p => bomByProduct[p.id]?.length > 0)
    .map(product => {
      const bom = bomByProduct[product.id];
      let maxProducible = Infinity;
      const materials = bom.map(entry => {
        const rm      = entry.rawMaterial;
        const canMake = entry.quantityRequired > 0 ? Math.floor(rm.quantity / entry.quantityRequired) : Infinity;
        if (canMake < maxProducible) maxProducible = canMake;
        return {
          raw_material_id: rm.id, name: rm.name,
          required_per_unit: entry.quantityRequired,
          available: rm.quantity, unit: rm.unit,
          can_produce: canMake, sufficient: rm.quantity >= entry.quantityRequired,
        };
      });
      if (maxProducible === Infinity) maxProducible = 0;
      const feasible = materials.every(m => m.sufficient);
      return {
        product_id: product.id, product_name: product.name,
        current_stock: product.qty, min_stock: product.minStock, unit: product.unit,
        feasible, max_producible: maxProducible, material_count: bom.length, materials,
        action_suggested:
          product.qty === 0 && maxProducible > 0 ? "MANUFACTURE_NOW"
          : product.qty <= product.minStock && maxProducible > 0 ? "MANUFACTURE_SOON"
          : !feasible ? "RESTOCK_MATERIALS"
          : "SUFFICIENT",
      };
    })
    .sort((a, b) => (
      ({ MANUFACTURE_NOW: 0, MANUFACTURE_SOON: 1, RESTOCK_MATERIALS: 2, SUFFICIENT: 3 }[a.action_suggested] ?? 4) -
      ({ MANUFACTURE_NOW: 0, MANUFACTURE_SOON: 1, RESTOCK_MATERIALS: 2, SUFFICIENT: 3 }[b.action_suggested] ?? 4)
    ));

  // ── 3. Replenishment plan ────────────────────────────────────
  const replenishment_plan = reorder_alerts.map(a => {
    const suggested_qty = Math.max(Math.round(a.min_stock * 2 - a.current_qty), a.min_stock);
    return {
      id: a.id, name: a.name, category: a.category, urgency: a.urgency,
      current_qty: a.current_qty, min_stock: a.min_stock,
      suggested_qty, unit: a.unit, unit_price: a.unit_price,
      estimated_cost: suggested_qty * a.unit_price, supplier: a.supplier,
    };
  });
  const replenishment_total_cost = replenishment_plan.reduce((s, r) => s + r.estimated_cost, 0);

  // ── 4. Velocity ──────────────────────────────────────────────
  const velocityMap = {};
  for (const tx of txLast30) {
    if (tx.itemType === "RAW_MATERIAL") {
      if (!velocityMap[tx.itemId]) velocityMap[tx.itemId] = { consumed: 0 };
      velocityMap[tx.itemId].consumed += Math.abs(tx.quantity);
    }
  }
  const velocity = rawMaterials
    .map(item => {
      const consumed       = velocityMap[item.id]?.consumed ?? 0;
      const daily_avg      = Math.round((consumed / 30) * 100) / 100;
      const days_remaining = daily_avg > 0 ? Math.round(item.quantity / daily_avg) : null;
      return {
        id: item.id, name: item.name, unit: item.unit,
        current_qty: item.quantity, consumed_30d: consumed, daily_avg, days_remaining,
        risk: days_remaining !== null && days_remaining <= 7  ? "HIGH"
            : days_remaining !== null && days_remaining <= 14 ? "MEDIUM"
            : days_remaining !== null && days_remaining <= 30 ? "LOW"
            : "STABLE",
      };
    })
    .filter(v => v.consumed_30d > 0 || v.current_qty <= v.daily_avg * 14)
    .sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999));

  // ── 5. Summary ───────────────────────────────────────────────
  const summary = {
    critical_reorder: reorder_alerts.filter(a => a.urgency === "CRITICAL").length,
    high_reorder:     reorder_alerts.filter(a => a.urgency === "HIGH").length,
    medium_reorder:   reorder_alerts.filter(a => a.urgency === "MEDIUM").length,
    products_ready_to_manufacture: manufacture_readiness.filter(r => r.feasible).length,
    products_need_restock:         manufacture_readiness.filter(r => !r.feasible).length,
    replenishment_items:    replenishment_plan.length,
    replenishment_est_cost: replenishment_total_cost,
    total_alerts:           reorder_alerts.length,
  };

  return { now, rawMaterials, finishedProducts, reorder_alerts, manufacture_readiness, replenishment_plan, velocity, summary, replenishment_total_cost };
}

// ── Groq AI narrative generation ─────────────────────────────
async function generateAINarrative(intel) {
  const groq = getGroq();
  if (!groq || !process.env.GROQ_API_KEY) {
    return { available: false, narrative: null };
  }

  const prompt = `You are Civi AI, an inventory decision support assistant for S2R2 Technologies, Pune — an IoT product manufacturer. Analyze the following inventory intelligence data and generate a concise, actionable executive summary.

INVENTORY INTELLIGENCE DATA:
- Total raw materials: ${intel.rawMaterials.length}
- Critical reorder alerts: ${intel.summary.critical_reorder}
- High reorder alerts: ${intel.summary.high_reorder}
- Medium reorder alerts: ${intel.summary.medium_reorder}
- Products ready to manufacture: ${intel.summary.products_ready_to_manufacture}
- Products needing material restock: ${intel.summary.products_need_restock}
- Replenishment items: ${intel.summary.replenishment_items}
- Estimated replenishment cost: ₹${intel.summary.replenishment_est_cost.toLocaleString("en-IN")}

TOP CRITICAL/HIGH ALERTS:
${intel.reorder_alerts.slice(0, 5).map(a => `- ${a.name} (${a.urgency}): ${a.current_qty} ${a.unit} remaining, min ${a.min_stock} ${a.unit}`).join("\n")}

MANUFACTURE READINESS:
${intel.manufacture_readiness.slice(0, 5).map(p => `- ${p.product_name}: ${p.feasible ? "READY" : "NOT READY"} — can produce ${p.max_producible} units`).join("\n")}

REPLENISHMENT TOP ITEMS:
${intel.replenishment_plan.slice(0, 5).map(r => `- ${r.name}: order ${r.suggested_qty} ${r.unit} @ ₹${r.estimated_cost.toLocaleString("en-IN")} (supplier: ${r.supplier || "unspecified"})`).join("\n")}

VELOCITY RISK:
${intel.velocity.slice(0, 5).map(v => `- ${v.name}: ${v.days_remaining !== null ? v.days_remaining + " days remaining" : "stable"} (${v.risk} risk)`).join("\n")}

Generate a structured response with these exact sections:
1. **Executive Summary** (2-3 sentences — overall inventory health)
2. **Immediate Actions Required** (bullet points — what needs to be done TODAY)
3. **Manufacture Recommendations** (which products to manufacture and how many)
4. **Replenishment Priority** (ordered list of items to reorder with business rationale)
5. **Risk Assessment** (velocity-based risks over next 30 days)
6. **Strategic Recommendation** (1 paragraph — longer-term inventory strategy)

Keep the tone professional, direct, and actionable. Use ₹ for currency. Mention S2R2 Technologies where appropriate.`;

  try {
    const completion = await groq.chat.completions.create({
      model:       "openai/gpt-oss-120b",
      messages:    [{ role: "user", content: prompt }],
      max_tokens:  1200,
      temperature: 0.3,
    });
    return {
      available:  true,
      model:      completion.model,
      narrative:  completion.choices[0]?.message?.content || null,
      tokens_used: completion.usage?.total_tokens || 0,
    };
  } catch (err) {
    console.warn("[Groq AI] Failed to generate narrative:", err.message);
    return { available: false, narrative: null, error: err.message };
  }
}

// ── POST /api/intelligence/chat ──────────────────────────────
// Body: { message: string, history: { role, content }[] }
router.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message is required" });

    const groq = getGroq();
    if (!groq) return res.status(503).json({ error: "Civi AI is unavailable — GROQ_API_KEY not configured" });

    // Build system prompt with live inventory context
    const intel = await computeIntelligence(req.prisma);

    const systemPrompt = `You are Civi AI, an expert inventory management assistant for S2R2 Technologies, Pune — an IoT product manufacturer. You are powered by Civitas Atlas Technologies Pvt. Ltd.

CURRENT INVENTORY CONTEXT (live data):
- Raw materials: ${intel.rawMaterials.length} items
- Critical reorder alerts: ${intel.summary.critical_reorder}
- High reorder alerts: ${intel.summary.high_reorder}
- Products ready to manufacture: ${intel.summary.products_ready_to_manufacture}
- Replenishment needed: ${intel.summary.replenishment_items} items (est. ₹${intel.summary.replenishment_est_cost.toLocaleString("en-IN")})

TOP ALERTS: ${intel.reorder_alerts.slice(0, 3).map(a => `${a.name} (${a.urgency}: ${a.current_qty}/${a.min_stock} ${a.unit})`).join(", ")}

MANUFACTURE READINESS: ${intel.manufacture_readiness.slice(0, 3).map(p => `${p.product_name}: ${p.feasible ? "READY" : "NOT READY"} (${p.max_producible} units)`).join(", ")}

Guidelines:
- Be concise, direct, and actionable
- Use ₹ for Indian Rupee amounts
- Format numbers in Indian style (lakhs/crores where appropriate)
- If asked about specific data not in context, acknowledge the limitation
- Always end with a clear, actionable recommendation
- Refer to yourself as "Civi AI"`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map(m => ({
        role:    m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model:       "openai/gpt-oss-120b",
      messages,
      max_tokens:  600,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    res.json({ reply, tokens_used: completion.usage?.total_tokens ?? 0 });
  } catch (err) {
    console.warn("[Civi AI Chat] Error:", err.message);
    res.status(500).json({ error: `Civi AI error: ${err.message}` });
  }
});

// ── GET /api/intelligence ─────────────────────────────────────
router.get("/", requireAuth, async (req, res, next) => {  try {
    const intel = await computeIntelligence(req.prisma);
    const ai    = await generateAINarrative(intel);

    res.json({
      generated_at: intel.now.toISOString(),
      powered_by:   "Civi AI — Civitas Atlas Technologies Pvt. Ltd.",
      summary:              intel.summary,
      reorder_alerts:       intel.reorder_alerts,
      manufacture_readiness: intel.manufacture_readiness,
      replenishment_plan:   intel.replenishment_plan,
      velocity:             intel.velocity,
      ai_narrative:         ai,
    });
  } catch (err) { next(err); }
});

// ── GET /api/intelligence/export/pdf ─────────────────────────
router.get("/export/pdf", requireAuth, async (req, res, next) => {
  try {
    let PDFDocument;
    try { PDFDocument = require("pdfkit"); }
    catch { return res.status(501).json({ error: "pdfkit not installed" }); }

    const intel = await computeIntelligence(req.prisma);
    const ai    = await generateAINarrative(intel);

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="civi-ai-intelligence-report.pdf"');

    const doc = new PDFDocument({ margin: 45, size: "A4" });
    doc.pipe(res);

    const PAGE_W    = doc.page.width  - 90;  // usable width
    const L         = doc.page.margins.left;
    const BLUE      = "#2563eb";
    const RED       = "#dc2626";
    const AMBER     = "#d97706";
    const GREEN     = "#059669";
    const GRAY_DARK = "#111827";
    const GRAY_MID  = "#6b7280";

    function sectionTitle(text, color = BLUE) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 80) doc.addPage();
      doc.moveDown(0.8);
      doc.rect(L, doc.y, PAGE_W, 1).fill(color);
      doc.moveDown(0.2);
      doc.fontSize(13).font("Helvetica-Bold").fillColor(color).text(text, L);
      doc.moveDown(0.4);
      doc.font("Helvetica").fillColor(GRAY_DARK);
    }

    function row(label, value, color = GRAY_DARK) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 20) doc.addPage();
      const rowY = doc.y;
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY_MID).text(label, L, rowY, { width: 180, continued: false });
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(color).text(String(value), L + 185, rowY, { width: PAGE_W - 185 });
      doc.moveDown(0.35);
    }

    // ── Cover header ──────────────────────────────────────────
    doc.rect(L - 45, 0, doc.page.width, 90).fill("#1e40af");
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#ffffff")
       .text("Civi AI — Decision Intelligence Report", L, 28, { width: PAGE_W });
    doc.fontSize(9).font("Helvetica").fillColor("#bfdbfe")
       .text(`S2R2 Technologies · Generated ${intel.now.toLocaleString("en-IN")} · By: ${req.user.username}`, L, 58, { width: PAGE_W });

    doc.y = 105;

    // ── 1. Executive Summary (AI Narrative) ───────────────────
    sectionTitle("1. AI Executive Summary", BLUE);
    if (ai.available && ai.narrative) {
      // Render markdown-ish bold lines
      const lines = ai.narrative.split("\n");
      for (const line of lines) {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 18) doc.addPage();
        const trimmed = line.trim();
        if (!trimmed) { doc.moveDown(0.3); continue; }
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          doc.fontSize(10).font("Helvetica-Bold").fillColor(BLUE).text(trimmed.replace(/\*\*/g, ""), L);
        } else if (trimmed.startsWith("**")) {
          const clean = trimmed.replace(/\*\*/g, "");
          doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY_DARK).text(clean, L, doc.y, { width: PAGE_W });
        } else {
          doc.fontSize(8.5).font("Helvetica").fillColor(GRAY_DARK).text(trimmed, L, doc.y, { width: PAGE_W });
        }
        doc.moveDown(0.2);
      }
      if (ai.model) {
        doc.moveDown(0.3);
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_MID)
           .text(`AI Model: ${ai.model} · Tokens used: ${ai.tokens_used}`, L);
      }
    } else {
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY_MID)
         .text("AI narrative unavailable (Groq API key not configured or rate limited).", L);
    }

    // ── 2. Summary KPIs ───────────────────────────────────────
    sectionTitle("2. Inventory Health KPIs", BLUE);
    row("Critical reorder alerts",        intel.summary.critical_reorder,        intel.summary.critical_reorder > 0 ? RED : GREEN);
    row("High reorder alerts",            intel.summary.high_reorder,            intel.summary.high_reorder > 0 ? AMBER : GREEN);
    row("Medium reorder alerts",          intel.summary.medium_reorder,          GRAY_DARK);
    row("Products ready to manufacture",  intel.summary.products_ready_to_manufacture, GREEN);
    row("Products needing restock",       intel.summary.products_need_restock,   intel.summary.products_need_restock > 0 ? RED : GREEN);
    row("Replenishment items",            intel.summary.replenishment_items,     intel.summary.replenishment_items > 0 ? AMBER : GREEN);
    row("Est. replenishment cost",        `₹${intel.summary.replenishment_est_cost.toLocaleString("en-IN")}`, BLUE);

    // ── 3. Reorder Alerts ─────────────────────────────────────
    sectionTitle("3. Reorder Alerts", RED);
    if (intel.reorder_alerts.length === 0) {
      doc.fontSize(8.5).font("Helvetica").fillColor(GREEN).text("✓ All raw materials are above minimum thresholds.", L);
    } else {
      // Table header
      const cols3 = [L, L+145, L+215, L+265, L+335, L+385];
      const hY3   = doc.y;
      doc.rect(L, hY3, PAGE_W, 16).fill("#fee2e2");
      ["Material", "Category", "Current", "Min", "Urgency", "Supplier"].forEach((h, i) => {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(RED).text(h, cols3[i], hY3 + 4, { width: 85, lineBreak: false });
      });
      doc.y = hY3 + 18;
      intel.reorder_alerts.forEach((a, idx) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 16) doc.addPage();
        const rY = doc.y;
        doc.rect(L, rY, PAGE_W, 14).fill(idx % 2 === 0 ? "#fff7f7" : "#ffffff");
        const color = a.urgency === "CRITICAL" ? RED : a.urgency === "HIGH" ? AMBER : "#b45309";
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(GRAY_DARK).text(a.name, cols3[0], rY + 3, { width: 140, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_MID).text(a.category,     cols3[1], rY + 3, { width: 65,  lineBreak: false });
        doc.text(`${a.current_qty} ${a.unit}`,  cols3[2], rY + 3, { width: 45,  lineBreak: false });
        doc.text(`${a.min_stock} ${a.unit}`,    cols3[3], rY + 3, { width: 65,  lineBreak: false });
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(color).text(a.urgency,    cols3[4], rY + 3, { width: 50,  lineBreak: false });
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_MID).text(a.supplier || "—", cols3[5], rY + 3, { width: 100, lineBreak: false });
        doc.y = rY + 14;
      });
    }

    // ── 4. Manufacture Readiness ──────────────────────────────
    sectionTitle("4. Manufacture Readiness", "#2563eb");
    if (intel.manufacture_readiness.length === 0) {
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY_MID).text("No BOM defined for any product.", L);
    } else {
      intel.manufacture_readiness.forEach(p => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 60) doc.addPage();
        const pColor = p.feasible ? GREEN : RED;
        doc.fontSize(9.5).font("Helvetica-Bold").fillColor(pColor)
           .text(`${p.feasible ? "✓" : "✗"} ${p.product_name}`, L);
        doc.fontSize(8).font("Helvetica").fillColor(GRAY_MID)
           .text(`Current stock: ${p.current_stock} ${p.unit}  ·  Can produce: ${p.max_producible} unit(s)  ·  Action: ${p.action_suggested.replace(/_/g," ")}`, L + 12);
        doc.moveDown(0.2);
        p.materials.forEach(m => {
          if (doc.y > doc.page.height - doc.page.margins.bottom - 14) doc.addPage();
          doc.fontSize(7.5).font("Helvetica").fillColor(m.sufficient ? GREEN : RED)
             .text(`    ${m.sufficient ? "✓" : "✗"}  ${m.name} — Need: ${m.required_per_unit} ${m.unit}  |  Have: ${m.available} ${m.unit}`, L + 12);
          doc.moveDown(0.15);
        });
        doc.moveDown(0.4);
      });
    }

    // ── 5. Replenishment Plan ─────────────────────────────────
    sectionTitle("5. Replenishment Plan", AMBER);
    if (intel.replenishment_plan.length === 0) {
      doc.fontSize(8.5).font("Helvetica").fillColor(GREEN).text("✓ No replenishment required.", L);
    } else {
      const cols5 = [L, L+140, L+195, L+250, L+320];
      const hY5   = doc.y;
      doc.rect(L, hY5, PAGE_W, 16).fill("#fef3c7");
      ["Material", "Urgency", "Order Qty", "Est. Cost (₹)", "Supplier"].forEach((h, i) => {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(AMBER).text(h, cols5[i], hY5 + 4, { width: 100, lineBreak: false });
      });
      doc.y = hY5 + 18;
      intel.replenishment_plan.forEach((r, idx) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 14) doc.addPage();
        const rY  = doc.y;
        const clr = r.urgency === "CRITICAL" ? RED : r.urgency === "HIGH" ? AMBER : "#b45309";
        doc.rect(L, rY, PAGE_W, 13).fill(idx % 2 === 0 ? "#fffbeb" : "#ffffff");
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(GRAY_DARK).text(r.name,      cols5[0], rY + 2.5, { width: 135, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(clr).text(r.urgency,         cols5[1], rY + 2.5, { width: 50,  lineBreak: false });
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_DARK).text(`${r.suggested_qty} ${r.unit}`, cols5[2], rY + 2.5, { width: 55, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(BLUE).text(`₹${r.estimated_cost.toLocaleString("en-IN")}`, cols5[3], rY + 2.5, { width: 80, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_MID).text(r.supplier || "—", cols5[4], rY + 2.5, { width: 120, lineBreak: false });
        doc.y = rY + 13;
      });
      // Total
      doc.moveDown(0.4);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BLUE)
         .text(`Total Estimated Replenishment Cost: ₹${intel.replenishment_total_cost.toLocaleString("en-IN")}`, L, doc.y, { align: "right", width: PAGE_W });
    }

    // ── 6. Inventory Velocity ─────────────────────────────────
    sectionTitle("6. Inventory Velocity (30-day Consumption)", "#7c3aed");
    if (intel.velocity.length === 0) {
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY_MID).text("No transaction data available yet.", L);
    } else {
      const cols6 = [L, L+155, L+215, L+275, L+335];
      const hY6   = doc.y;
      doc.rect(L, hY6, PAGE_W, 16).fill("#ede9fe");
      ["Material", "Consumed (30d)", "Daily Avg", "Days Left", "Risk"].forEach((h, i) => {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#7c3aed").text(h, cols6[i], hY6 + 4, { width: 100, lineBreak: false });
      });
      doc.y = hY6 + 18;
      intel.velocity.forEach((v, idx) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 14) doc.addPage();
        const rY  = doc.y;
        const rc  = v.risk === "HIGH" ? RED : v.risk === "MEDIUM" ? AMBER : v.risk === "LOW" ? BLUE : GREEN;
        doc.rect(L, rY, PAGE_W, 13).fill(idx % 2 === 0 ? "#f5f3ff" : "#ffffff");
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(GRAY_DARK).text(v.name,       cols6[0], rY + 2.5, { width: 150, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica").fillColor(GRAY_DARK).text(`${v.consumed_30d} ${v.unit}`, cols6[1], rY + 2.5, { width: 55, lineBreak: false });
        doc.text(`${v.daily_avg}/day`,             cols6[2], rY + 2.5, { width: 55, lineBreak: false });
        doc.text(v.days_remaining !== null ? `${v.days_remaining}d` : "N/A", cols6[3], rY + 2.5, { width: 55, lineBreak: false });
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(rc).text(v.risk, cols6[4], rY + 2.5, { width: 60, lineBreak: false });
        doc.y = rY + 13;
      });
    }

    // ── Footer on every page ──────────────────────────────────
    const BRAND = "Generated using Civi AI  |  By Civitas Atlas Technologies Pvt. Ltd., Pune";
    const range = doc.bufferedPageRange ? doc.bufferedPageRange() : { start: 0, count: 1 };
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).font("Helvetica").fillColor(GRAY_MID)
         .text(BRAND, L, doc.page.height - 32, { align: "center", width: PAGE_W });
      doc.fontSize(7).fillColor(GRAY_MID)
         .text(`Page ${i - range.start + 1} of ${range.count}`, L, doc.page.height - 22, { align: "right", width: PAGE_W });
    }

    doc.end();
  } catch (err) { next(err); }
});

module.exports = router;
