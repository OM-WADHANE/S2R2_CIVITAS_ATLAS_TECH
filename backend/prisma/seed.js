// prisma/seed.js — Run with: npm run db:seed
// ─────────────────────────────────────────────────────────────
// Safe to run multiple times — all upserts are keyed by name/email/username.
// Never wipes existing inventory transactions or activity logs.
// ─────────────────────────────────────────────────────────────
"use strict";

const { PrismaClient } = require("@prisma/client");
const bcrypt           = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding S2R2 database …\n");

  // ════════════════════════════════════════════════════════════
  // 1. USERS
  //    Upsert by username — safe to re-run, passwords re-hashed.
  // ════════════════════════════════════════════════════════════
  const users = [
    { username: "sandeep", password: "Sandeep@2025", role: "ADMIN"  },
    { username: "rohan",   password: "Rohan@2025",   role: "ADMIN"  },
    { username: "akshay",  password: "Akshay@2025",  role: "ADMIN"  },
    { username: "emp1",    password: "Emp1@2025",     role: "EDITOR" },
    { username: "emp2",    password: "Emp2@2025",     role: "EDITOR" },
    { username: "emp3",    password: "Emp3@2025",     role: "EDITOR" },
    { username: "emp4",    password: "Emp4@2025",     role: "EDITOR" },
    { username: "emp5",    password: "Emp5@2025",     role: "EDITOR" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where:  { username: u.username },
      update: { password: hash, role: u.role },
      create: { username: u.username, password: hash, role: u.role },
    });
    console.log(`  ✓ user: ${u.username.padEnd(10)} (${u.role})`);
  }

  // ════════════════════════════════════════════════════════════
  // 2. CORE RAW MATERIALS
  //    6 general materials used across the facility.
  //    Upsert by name — quantities only set on create, never
  //    overwritten so live stock isn't reset on re-seed.
  // ════════════════════════════════════════════════════════════
  const coreMaterials = [
    { name: "PLC Controller",     category: "Electronics", description: "Programmable Logic Controller",           quantity: 48,  unit: "pcs", supplier: "Siemens",       location: "Warehouse A", minStock: 10, price: 15000 },
    { name: "RFID Antenna",       category: "Sensors",     description: "Radio Frequency Identification antenna",  quantity: 12,  unit: "pcs", supplier: "Honeywell",     location: "Warehouse A", minStock: 15, price: 2500  },
    { name: "ESP32 Module",       category: "Electronics", description: "WiFi and Bluetooth microcontroller",      quantity: 87,  unit: "pcs", supplier: "Espressif",     location: "Warehouse B", minStock: 20, price: 450   },
    { name: "Power Supply 24V",   category: "Electronics", description: "24V DC power supply with regulation",     quantity: 5,   unit: "pcs", supplier: "Mean Well",     location: "Production",  minStock: 8,  price: 3200  },
    { name: "Temperature Sensor", category: "Sensors",     description: "Digital temperature sensor I2C",         quantity: 156, unit: "pcs", supplier: "Adafruit",      location: "Warehouse A", minStock: 30, price: 180   },
    { name: "LED Strip RGB",      category: "Electronics", description: "RGB LED strip for lighting applications", quantity: 34,  unit: "m",   supplier: "Philips",       location: "Warehouse B", minStock: 20, price: 850   },
  ];

  for (const rm of coreMaterials) {
    const { quantity, ...meta } = rm;
    await prisma.rawMaterial.upsert({
      where:  { name: rm.name },
      // on update: refresh metadata but DO NOT reset live stock quantity
      update: { ...meta },
      create: { ...meta, quantity },
    });
  }
  console.log(`\n  ✓ ${coreMaterials.length} core raw materials`);

  // ════════════════════════════════════════════════════════════
  // 3. BOM RAW MATERIALS
  //    18 specific components used in finished product BOMs.
  //    Same upsert strategy — quantity only set on first create.
  // ════════════════════════════════════════════════════════════
  const bomMaterials = [
    // ── Iotzee components ─────────────────────────────────────
    { name: "PCB Board",           category: "Electronics", description: "Custom S2R2 4-layer PCB for Iotzee",           quantity: 200, unit: "pcs", supplier: "PCBWay",             location: "Warehouse A", minStock: 30, price: 550  },
    { name: "Microcontroller",     category: "Electronics", description: "STM32 ARM Cortex microcontroller",             quantity: 500, unit: "pcs", supplier: "Texas Instruments",  location: "Warehouse A", minStock: 50, price: 150  },
    { name: "LoRa Radio Module",   category: "Wireless",    description: "LoRa SX1276 long-range radio module",          quantity: 150, unit: "pcs", supplier: "Semtech",            location: "Warehouse A", minStock: 20, price: 750  },
    { name: "Li-Po Battery",       category: "Power",       description: "3.7V 2000mAh lithium polymer battery",         quantity: 180, unit: "pcs", supplier: "Amara Raja",         location: "Warehouse A", minStock: 25, price: 280  },
    { name: "Antenna 868MHz",      category: "Wireless",    description: "External 868MHz helical antenna SMA",          quantity: 160, unit: "pcs", supplier: "Taoglas",            location: "Warehouse A", minStock: 20, price: 120  },
    { name: "Plastic Casing",      category: "Packaging",   description: "ABS plastic enclosure casing",                 quantity: 400, unit: "pcs", supplier: "PolyPack India",     location: "Warehouse B", minStock: 40, price: 200  },
    // ── Display unit components ───────────────────────────────
    { name: "LCD Display Panel",   category: "Electronics", description: "7-inch TFT LCD touch panel",                   quantity: 80,  unit: "pcs", supplier: "Innolux",            location: "Warehouse A", minStock: 15, price: 1800 },
    { name: "Display Driver Board",category: "Electronics", description: "HDMI / LVDS display driver PCB",               quantity: 90,  unit: "pcs", supplier: "S2R2 Production",    location: "Warehouse A", minStock: 15, price: 600  },
    { name: "Display Bezel",       category: "Mechanical",  description: "Aluminium bezel frame for display",            quantity: 80,  unit: "pcs", supplier: "MetalWorks Pune",    location: "Warehouse B", minStock: 15, price: 320  },
    { name: "Connecting Cable",    category: "Electrical",  description: "Flat ribbon data cable 30-pin",                quantity: 200, unit: "pcs", supplier: "Molex",              location: "Warehouse B", minStock: 30, price: 80   },
    // ── Display Stand components ──────────────────────────────
    { name: "Steel Base Plate",    category: "Mechanical",  description: "Heavy-duty steel base plate 200×200mm",        quantity: 60,  unit: "pcs", supplier: "MetalWorks Pune",    location: "Warehouse B", minStock: 10, price: 450  },
    { name: "Mounting Bracket",    category: "Mechanical",  description: "Adjustable tilt mounting arm bracket",         quantity: 70,  unit: "pcs", supplier: "MetalWorks Pune",    location: "Warehouse B", minStock: 10, price: 280  },
    { name: "Fastener Set",        category: "Hardware",    description: "M4/M6 bolt & nut assortment pack",             quantity: 500, unit: "set", supplier: "Tata Steel",         location: "Warehouse B", minStock: 50, price: 45   },
    // ── Hold-on Hold Kit components ───────────────────────────
    { name: "Hold Clamp Assembly", category: "Mechanical",  description: "Heavy-duty pipe hold clamp — stainless steel", quantity: 150, unit: "pcs", supplier: "Graco India",        location: "Warehouse A", minStock: 20, price: 380  },
    { name: "Rubber Gasket",       category: "Sealing",     description: "EPDM rubber sealing gasket 25mm",              quantity: 300, unit: "pcs", supplier: "Phoenix Rubber",     location: "Warehouse A", minStock: 30, price: 55   },
    { name: "Hex Bolt M8",         category: "Hardware",    description: "Stainless steel M8×50mm hex bolt",             quantity: 600, unit: "pcs", supplier: "Tata Steel",         location: "Warehouse B", minStock: 60, price: 18   },
    // ── Shared across multiple products ───────────────────────
    { name: "Sensor Module",       category: "Sensors",     description: "Multi-function sensor (temp/humidity/motion)",  quantity: 300, unit: "pcs", supplier: "Bosch",              location: "Warehouse A", minStock: 30, price: 450  },
    { name: "Instruction Card",    category: "Packaging",   description: "Printed instruction card — laminated A5",      quantity: 500, unit: "pcs", supplier: "PrintHouse Pune",    location: "Warehouse B", minStock: 50, price: 12   },
  ];

  for (const rm of bomMaterials) {
    const { quantity, ...meta } = rm;
    await prisma.rawMaterial.upsert({
      where:  { name: rm.name },
      update: { ...meta },
      create: { ...meta, quantity },
    });
  }
  console.log(`  ✓ ${bomMaterials.length} BOM raw materials`);

  // ════════════════════════════════════════════════════════════
  // 4. FINISHED PRODUCTS
  //    Upsert by name — qty only set on first create.
  // ════════════════════════════════════════════════════════════
  const finishedProducts = [
    { name: "Iotzee",              qty: 16, unit: "Box",      category: "Finished Products", location: "Warehouse A", supplier: "S2R2 Production", minStock: 5,  price: 4500,  status: "ACTIVE" },
    { name: "Display",             qty: 10, unit: "Box",      category: "Finished Products", location: "Warehouse A", supplier: "S2R2 Production", minStock: 8,  price: 2200,  status: "ACTIVE" },
    { name: "Display Stand",       qty: 9,  unit: "Box",      category: "Finished Products", location: "Warehouse B", supplier: "S2R2 Production", minStock: 10, price: 1800,  status: "ACTIVE" },
    { name: "Hold-on Hold Kit",    qty: 20, unit: "Complete", category: "Kits",              location: "Warehouse B", supplier: "S2R2 Production", minStock: 6,  price: 3200,  status: "ACTIVE" },
    { name: "IoT Tracking Device", qty: 0,  unit: "pcs",      category: "IoT Devices",       location: "Warehouse A", supplier: "S2R2 Production", minStock: 10, price: 2500,  status: "ACTIVE" },
  ];

  for (const fp of finishedProducts) {
    const { qty, ...meta } = fp;
    await prisma.finishedProduct.upsert({
      where:  { name: fp.name },
      update: { ...meta },          // never reset live qty on re-seed
      create: { ...meta, qty },
    });
    console.log(`  ✓ finished product: ${fp.name}`);
  }

  // ════════════════════════════════════════════════════════════
  // 5. CLIENTS
  //    Upsert by email — metadata updated if already exists.
  // ════════════════════════════════════════════════════════════
  const clients = [
    { clientName: "Tata Motors",                            companyName: "Tata Motors",                            phone: "8550937272", email: "SSG793525@tatamotors.com",                  address: "Chinchwad"      },
    { clientName: "Shirodkar Preci Comp",                   companyName: "Shirodkar Preci Comp",                   phone: "8956311247", email: "adinath.sonawane@spcindia.com",             address: "Chinchwad"      },
    { clientName: "Ask Engineers",                          companyName: "Ask Engineers",                          phone: "9689999900", email: "ajay.hegade@askgroupindia.com",             address: "Bhosari"        },
    { clientName: "Efficient Precision & System Pvt. Ltd.", companyName: "Efficient Precision & System Pvt. Ltd.", phone: "9850899930", email: "epsplefficient@gmail.com",                  address: "Pune"           },
    { clientName: "Calibit Systems Pvt. Ltd.",              companyName: "Calibit Systems Pvt. Ltd.",              phone: "9850959575", email: "neeraj.bannore@calibitsystems.com",         address: "Pune"           },
    { clientName: "KBL",                                    companyName: "KBL",                                    phone: "9209061184", email: "nikhil.nirukhekar@kbl.co.in",              address: "Kirloskar Wadi" },
    { clientName: "Prescient Technologies",                 companyName: "Prescient Technologies",                 phone: "8380017822", email: "vivekb@pre-scient.com",                    address: "Baner"          },
    { clientName: "Eagle Burgmann",                         companyName: "Eagle Burgmann",                         phone: "9766571150", email: "Apoorva.Dongaonkar@in.eagleburgmann.com",  address: "Hadapsar"       },
    { clientName: "Sansera Engineering Limited",            companyName: "Sansera Engineering Limited",            phone: "7387056042", email: "altaphusen_mujawar@sansera.in",             address: "Pune"           },
  ];

  for (const c of clients) {
    await prisma.client.upsert({
      where:  { email: c.email },
      update: { clientName: c.clientName, companyName: c.companyName, phone: c.phone, address: c.address },
      create: { ...c, status: "ACTIVE" },
    });
  }
  console.log(`\n  ✓ ${clients.length} clients`);

  // ════════════════════════════════════════════════════════════
  // 6. BILL OF MATERIALS
  //    Helper: fetch a raw material record by exact name.
  //    BOM entries are fully replaced each time seed runs so the
  //    component list stays in sync with the definitions above.
  // ════════════════════════════════════════════════════════════
  const getRM = (name) => prisma.rawMaterial.findUnique({ where: { name } });
  const getFP = (name) => prisma.finishedProduct.findUnique({ where: { name } });

  // ── BOM definitions ──────────────────────────────────────────
  // format: { product: "<FP name>", parts: [{ name, qty }] }
  const bomDefs = [
    {
      product: "Iotzee",
      parts: [
        { name: "PCB Board",         qty: 1 },
        { name: "Microcontroller",   qty: 1 },
        { name: "LoRa Radio Module", qty: 1 },
        { name: "Li-Po Battery",     qty: 1 },
        { name: "Antenna 868MHz",    qty: 1 },
        { name: "Plastic Casing",    qty: 1 },
        { name: "Instruction Card",  qty: 1 },
      ],
    },
    {
      product: "Display",
      parts: [
        { name: "LCD Display Panel",    qty: 1 },
        { name: "Display Driver Board", qty: 1 },
        { name: "Microcontroller",      qty: 1 },
        { name: "Connecting Cable",     qty: 2 },
        { name: "Display Bezel",        qty: 1 },
        { name: "Plastic Casing",       qty: 1 },
        { name: "Instruction Card",     qty: 1 },
      ],
    },
    {
      product: "Display Stand",
      parts: [
        { name: "Steel Base Plate", qty: 1 },
        { name: "Mounting Bracket", qty: 1 },
        { name: "Fastener Set",     qty: 1 },
        { name: "Instruction Card", qty: 1 },
      ],
    },
    {
      product: "Hold-on Hold Kit",
      parts: [
        { name: "Hold Clamp Assembly", qty: 2 },
        { name: "Rubber Gasket",       qty: 4 },
        { name: "Hex Bolt M8",         qty: 4 },
        { name: "Fastener Set",        qty: 1 },
        { name: "Instruction Card",    qty: 1 },
      ],
    },
    {
      product: "IoT Tracking Device",
      parts: [
        { name: "Microcontroller", qty: 1 },
        { name: "Sensor Module",   qty: 1 },
        { name: "Plastic Casing",  qty: 1 },
      ],
    },
  ];

  console.log("");
  for (const def of bomDefs) {
    const fp = await getFP(def.product);
    if (!fp) {
      console.warn(`  ⚠  Finished product "${def.product}" not found — skipping BOM.`);
      continue;
    }

    // Resolve all raw material IDs first; warn on any missing names
    const entries = [];
    for (const part of def.parts) {
      const rm = await getRM(part.name);
      if (!rm) {
        console.warn(`  ⚠  Raw material "${part.name}" not found — skipping BOM entry for ${def.product}.`);
        continue;
      }
      entries.push({ finishedProductId: fp.id, rawMaterialId: rm.id, quantityRequired: part.qty });
    }

    // Atomically replace all BOM entries for this product
    await prisma.$transaction([
      prisma.billOfMaterials.deleteMany({ where: { finishedProductId: fp.id } }),
      prisma.billOfMaterials.createMany({ data: entries }),
    ]);

    console.log(`  ✓ BOM: ${def.product.padEnd(22)} (${entries.length} component${entries.length !== 1 ? "s" : ""})`);
  }

  // ════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════
  console.log("\n✅ Seed complete.\n");
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│                 LOGIN CREDENTIALS                   │");
  console.log("├──────────────┬────────────────┬────────────────────┤");
  console.log("│ Username     │ Password       │ Role               │");
  console.log("├──────────────┼────────────────┼────────────────────┤");
  for (const u of users) {
    console.log(`│ ${u.username.padEnd(12)} │ ${u.password.padEnd(14)} │ ${u.role.padEnd(18)} │`);
  }
  console.log("└──────────────┴────────────────┴────────────────────┘");
}

main()
  .catch(e => { console.error("❌ Seed failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
