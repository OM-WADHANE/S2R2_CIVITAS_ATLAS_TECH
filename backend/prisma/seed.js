// prisma/seed.js — Run with: npm run db:seed
"use strict";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database …");

  // ── Remove old/stale usernames that were replaced ──────────
  const staleUsernames = ["s2r2", "s2r2admin_old"];
  for (const u of staleUsernames) {
    await prisma.user.deleteMany({ where: { username: u } }).catch(() => {});
  }

  // ── Users ──────────────────────────────────────────────────
  // We always force-update passwords so a stale hash never blocks login.
  // 4 ADMINs + 2 EDITORs, no VIEWERs.
  // Passwords use only alphanumeric + simple symbols to avoid any encoding issues.
  const users = [
    { username: "s2r2admin",  password: "s2r2Admin1",   role: "ADMIN"  },
    { username: "admin",      password: "Admin2025",     role: "ADMIN"  },
    { username: "manager",    password: "Manager2025",   role: "ADMIN"  },
    { username: "superuser",  password: "Super2025s2",   role: "ADMIN"  },
    { username: "editor1",    password: "Editor2025a",   role: "EDITOR" },
    { username: "editor2",    password: "Editor2025b",   role: "EDITOR" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where:  { username: u.username },
      // Force-update password hash every time seed runs
      update: { password: hash, role: u.role },
      create: { username: u.username, password: hash, role: u.role },
    });
    console.log(`  ✓ user: ${u.username} (${u.role})`);
  }

  // ── Raw Materials ──────────────────────────────────────────
  const rawMaterials = [
    { name: "PLC Controller",     category: "Electronics", description: "Programmable Logic Controller",          quantity: 48,  unit: "pcs", supplier: "Siemens",   location: "Warehouse A", minStock: 10, price: 15000 },
    { name: "RFID Antenna",       category: "Sensors",     description: "Radio Frequency Identification antenna",  quantity: 12,  unit: "pcs", supplier: "Honeywell", location: "Warehouse A", minStock: 15, price: 2500  },
    { name: "ESP32 Module",       category: "Electronics", description: "WiFi and Bluetooth microcontroller",      quantity: 87,  unit: "pcs", supplier: "Espressif", location: "Warehouse B", minStock: 20, price: 450   },
    { name: "Power Supply 24V",   category: "Electronics", description: "24V DC power supply with regulation",     quantity: 5,   unit: "pcs", supplier: "Mean Well", location: "Production",  minStock: 8,  price: 3200  },
    { name: "Temperature Sensor", category: "Sensors",     description: "Digital temperature sensor I2C",         quantity: 156, unit: "pcs", supplier: "Adafruit",  location: "Warehouse A", minStock: 30, price: 180   },
    { name: "LED Strip RGB",      category: "Electronics", description: "RGB LED strip for lighting applications", quantity: 34,  unit: "m",   supplier: "Philips",   location: "Warehouse B", minStock: 20, price: 850   },
  ];
  for (const rm of rawMaterials) {
    await prisma.rawMaterial.upsert({
      where:  { id: rawMaterials.indexOf(rm) + 1 },
      update: rm,
      create: rm,
    });
  }
  console.log(`  ✓ ${rawMaterials.length} raw materials`);

  // ── Finished Products ──────────────────────────────────────
  const finishedProducts = [
    { name: "Iotzee",           qty: 16, unit: "Box",      status: "ACTIVE" },
    { name: "Display",          qty: 10, unit: "Box",      status: "ACTIVE" },
    { name: "Display Stand",    qty: 9,  unit: "Box",      status: "ACTIVE" },
    { name: "Hold-on Hold Kit", qty: 20, unit: "Complete", status: "ACTIVE" },
  ];
  for (const fp of finishedProducts) {
    await prisma.finishedProduct.create({ data: fp }).catch(() => {});
  }
  console.log(`  ✓ ${finishedProducts.length} finished products`);

  // ── Clients ────────────────────────────────────────────────
  const clients = [
    { clientName: "Tata Motors",                           companyName: "Tata Motors",                           phone: "8550937272", email: "SSG793525@tatamotors.com",                  address: "Chinchwad"      },
    { clientName: "Shirodkar Preci Comp",                  companyName: "Shirodkar Preci Comp",                  phone: "8956311247", email: "adinath.sonawane@spcindia.com",             address: "Chinchwad"      },
    { clientName: "Ask Engineers",                         companyName: "Ask Engineers",                         phone: "9689999900", email: "ajay.hegade@askgroupindia.com",             address: "Bhosari"        },
    { clientName: "Efficient Precision & System Pvt.Ltd.", companyName: "Efficient Precision & System Pvt.Ltd.", phone: "9850899930", email: "epsplefficient@gmail.com",                  address: "Pune"           },
    { clientName: "Calibit Systems Pvt. Ltd.",             companyName: "Calibit Systems Pvt. Ltd.",             phone: "9850959575", email: "neeraj.bannore@calibitsystems.com",         address: "Pune"           },
    { clientName: "KBL",                                   companyName: "KBL",                                   phone: "9209061184", email: "nikhil.nirukhekar@kbl.co.in",              address: "Kirloskar Wadi" },
    { clientName: "Prescient Technologies",                companyName: "Prescient Technologies",                phone: "8380017822", email: "vivekb@pre-scient.com",                    address: "Baner"          },
    { clientName: "Eagle Burgmann",                        companyName: "Eagle Burgmann",                        phone: "9766571150", email: "Apoorva.Dongaonkar@in.eagleburgmann.com",   address: "Hadapsar"       },
    { clientName: "Sansera Engineering Limited",           companyName: "Sansera Engineering Limited",           phone: "7387056042", email: "altaphusen_mujawar@sansera.in",             address: "Pune"           },
  ];
  for (const c of clients) {
    await prisma.client.upsert({
      where:  { email: c.email },
      update: {},
      create: { ...c, status: "ACTIVE" },
    });
  }
  console.log(`  ✓ ${clients.length} clients`);

  console.log("\n✅ Seed complete.\n");
  console.log("Login credentials:");
  console.log("─────────────────────────────────────────");
  users.forEach(u => console.log(`  ${u.username.padEnd(10)} │ ${u.password.padEnd(14)} │ ${u.role}`));
  console.log("─────────────────────────────────────────");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
