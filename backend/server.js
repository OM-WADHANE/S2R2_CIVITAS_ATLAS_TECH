// ============================================================
// S2R2 Inventory — Express API Server  (server.js)
// ============================================================
"use strict";

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const { PrismaClient } = require("@prisma/client");

// ── Route modules ─────────────────────────────────────────────
const rawMaterialsRouter     = require("./src/routes/rawMaterials");
const finishedProductsRouter = require("./src/routes/finishedProducts");
const clientsRouter          = require("./src/routes/clients");
const dashboardRouter        = require("./src/routes/dashboard");
const authRouter             = require("./src/routes/auth");
const activityRouter         = require("./src/routes/activity");
const iotDevicesRouter       = require("./src/routes/iotDevices");
const usersRouter            = require("./src/routes/users");

// ── App setup ─────────────────────────────────────────────────
const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// Attach Prisma to every request so routes can use req.prisma
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",              authRouter);
app.use("/api/raw-materials",     rawMaterialsRouter);
app.use("/api/finished-products", finishedProductsRouter);
app.use("/api/clients",           clientsRouter);
app.use("/api/dashboard",         dashboardRouter);
app.use("/api/activity",          activityRouter);
app.use("/api/iot-devices",       iotDevicesRouter);
app.use("/api/users",             usersRouter);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma");
    app.listen(PORT, () =>
      console.log(`🚀 S2R2 API running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT",  async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });

start();
