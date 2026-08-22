"use strict";
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();
const creds = [
  { username: "sandeep", password: "Sandeep@2025" },
  { username: "rohan",   password: "Rohan@2025"   },
  { username: "akshay",  password: "Akshay@2025"  },
  { username: "emp1",    password: "Emp1@2025"     },
];
async function main() {
  for (const c of creds) {
    const u = await p.user.findUnique({ where: { username: c.username } });
    if (!u) { console.log(`❌ ${c.username} — NOT FOUND`); continue; }
    const ok = await bcrypt.compare(c.password, u.password);
    console.log(`${ok ? "✅" : "❌"} ${c.username.padEnd(10)} | ${c.password.padEnd(15)} | ${u.role}`);
  }
}
main().catch(console.error).finally(() => p.$disconnect());
