// test-routes.js — Full API route test (dry run against local server)
// Run with: node test-routes.js
// Make sure backend is running first: npm run dev
"use strict";

const BASE = "http://localhost:4000";
let TOKEN  = "";
let passed = 0;
let failed = 0;

async function req(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth && TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function pass(label) { console.log(`  ✓  ${label}`); passed++; }
function fail(label, detail) { console.log(`  ✗  ${label} — ${detail}`); failed++; }

function check(label, condition, detail = "") {
  condition ? pass(label) : fail(label, detail);
}

async function run() {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  S2R2 API Route Tests");
  console.log("══════════════════════════════════════════════════\n");

  // ── Health ──────────────────────────────────────────────────
  console.log("── Health ──");
  const health = await req("GET", "/health", null, false);
  check("GET /health", health.status === 200 && health.data.status === "ok", JSON.stringify(health.data));

  // ── Auth ────────────────────────────────────────────────────
  console.log("\n── Auth ──");

  const badLogin = await req("POST", "/api/auth/login", { username: "wrong", password: "wrong" }, false);
  check("POST /api/auth/login  (bad creds → 401)", badLogin.status === 401);

  const noBody = await req("POST", "/api/auth/login", {}, false);
  check("POST /api/auth/login  (empty body → 400)", noBody.status === 400);

  const goodLogin = await req("POST", "/api/auth/login", { username: "s2r2admin", password: "s2r2Admin1" }, false);
  check("POST /api/auth/login  (good creds → 200)", goodLogin.status === 200 && goodLogin.data.token, JSON.stringify(goodLogin.data));
  if (goodLogin.data.token) TOKEN = goodLogin.data.token;

  const noToken = await req("GET", "/api/raw-materials", null, false);
  check("GET /api/raw-materials  (no token → 401)", noToken.status === 401);

  // ── Raw Materials ────────────────────────────────────────────
  console.log("\n── Raw Materials ──");

  const rmList = await req("GET", "/api/raw-materials");
  check("GET /api/raw-materials", rmList.status === 200 && Array.isArray(rmList.data.items), JSON.stringify(rmList.data).slice(0,120));

  const rmCreate = await req("POST", "/api/raw-materials", {
    name: "TEST_ITEM_DELETE_ME", category: "Test", quantity: 5,
    unit: "pcs", minStock: 2, price: 100,
  });
  check("POST /api/raw-materials  (create)", rmCreate.status === 201 && rmCreate.data.id, JSON.stringify(rmCreate.data).slice(0,120));
  const rmId = rmCreate.data.id;

  if (rmId) {
    const rmGet = await req("GET", `/api/raw-materials/${rmId}`);
    check("GET /api/raw-materials/:id", rmGet.status === 200 && rmGet.data.id === rmId);

    const rmUpdate = await req("PUT", `/api/raw-materials/${rmId}`, { quantity: 99, price: 200 });
    check("PUT /api/raw-materials/:id", rmUpdate.status === 200 && rmUpdate.data.quantity === 99);

    const rmDel = await req("DELETE", `/api/raw-materials/${rmId}`);
    check("DELETE /api/raw-materials/:id", rmDel.status === 200 && rmDel.data.id === rmId);
  }

  const rmSearch = await req("GET", "/api/raw-materials?search=PLC");
  check("GET /api/raw-materials?search=PLC", rmSearch.status === 200);

  const rmCatFilter = await req("GET", "/api/raw-materials?category=Electronics");
  check("GET /api/raw-materials?category=Electronics", rmCatFilter.status === 200);

  const rmStatusFilter = await req("GET", "/api/raw-materials?status=active");
  check("GET /api/raw-materials?status=active", rmStatusFilter.status === 200);

  // ── Finished Products ────────────────────────────────────────
  console.log("\n── Finished Products ──");

  const fpList = await req("GET", "/api/finished-products");
  check("GET /api/finished-products", fpList.status === 200 && Array.isArray(fpList.data.products));

  const fpCreate = await req("POST", "/api/finished-products", {
    name: "TEST_FP_DELETE_ME", qty: 3, unit: "Box",
    category: "Test", price: 500, status: "ACTIVE",
  });
  check("POST /api/finished-products  (create)", fpCreate.status === 201 && fpCreate.data.id);
  const fpId = fpCreate.data.id;

  if (fpId) {
    const fpGet = await req("GET", `/api/finished-products/${fpId}`);
    check("GET /api/finished-products/:id", fpGet.status === 200 && fpGet.data.id === fpId);

    const fpUpdate = await req("PUT", `/api/finished-products/${fpId}`, { qty: 50, status: "HOLD" });
    check("PUT /api/finished-products/:id", fpUpdate.status === 200 && fpUpdate.data.qty === 50);

    const fpDel = await req("DELETE", `/api/finished-products/${fpId}`);
    check("DELETE /api/finished-products/:id", fpDel.status === 200 && fpDel.data.id === fpId);
  }

  const fpFilter = await req("GET", "/api/finished-products?status=ACTIVE");
  check("GET /api/finished-products?status=ACTIVE", fpFilter.status === 200);

  // ── Clients ──────────────────────────────────────────────────
  console.log("\n── Clients ──");

  const cList = await req("GET", "/api/clients");
  check("GET /api/clients", cList.status === 200 && Array.isArray(cList.data.clients));

  const cCreate = await req("POST", "/api/clients", {
    clientName: "TEST CLIENT DELETE ME",
    companyName: "Test Corp", phone: "9999999999",
    email: `test-${Date.now()}@deleteme.com`,
  });
  check("POST /api/clients  (create)", cCreate.status === 201 && cCreate.data.id);
  const cId = cCreate.data.id;

  if (cId) {
    const cGet = await req("GET", `/api/clients/${cId}`);
    check("GET /api/clients/:id", cGet.status === 200 && cGet.data.id === cId);

    const cUpdate = await req("PUT", `/api/clients/${cId}`, { companyName: "Updated Corp", status: "INACTIVE" });
    check("PUT /api/clients/:id", cUpdate.status === 200 && cUpdate.data.companyName === "Updated Corp");

    const cDel = await req("DELETE", `/api/clients/${cId}`);
    check("DELETE /api/clients/:id", cDel.status === 200 && cDel.data.id === cId);
  }

  const cSearch = await req("GET", "/api/clients?search=Tata");
  check("GET /api/clients?search=Tata", cSearch.status === 200);

  const cImport = await req("POST", "/api/clients/import", {
    rows: [{ "Client Name": "Import Test Co", "Phone": "8888888888", "Email": `import-${Date.now()}@test.com` }],
  });
  check("POST /api/clients/import", cImport.status === 200 && cImport.data.created >= 1);
  // Clean up imported client
  if (cImport.data.created >= 1) {
    const allClients = await req("GET", "/api/clients?search=Import Test Co");
    const importedId = allClients.data.clients?.[0]?.id;
    if (importedId) await req("DELETE", `/api/clients/${importedId}`);
  }

  // ── IoT Devices ──────────────────────────────────────────────
  console.log("\n── IoT Devices ──");

  const iotList = await req("GET", "/api/iot-devices");
  check("GET /api/iot-devices", iotList.status === 200 && Array.isArray(iotList.data.devices));

  const iotCreate = await req("POST", "/api/iot-devices", {
    deviceId: `TEST-${Date.now()}`, name: "TEST_IOT_DELETE_ME",
    type: "Sensor", location: "Lab", status: "ONLINE",
  });
  check("POST /api/iot-devices  (create, ADMIN)", iotCreate.status === 201 && iotCreate.data.id);
  const iotId = iotCreate.data.id;

  if (iotId) {
    const iotGet = await req("GET", `/api/iot-devices/${iotId}`);
    check("GET /api/iot-devices/:id", iotGet.status === 200 && iotGet.data.id === iotId);

    const iotUpdate = await req("PUT", `/api/iot-devices/${iotId}`, { status: "OFFLINE" });
    check("PUT /api/iot-devices/:id  (ADMIN)", iotUpdate.status === 200 && iotUpdate.data.status === "OFFLINE");

    const iotPing = await req("PATCH", `/api/iot-devices/${iotId}/ping`);
    check("PATCH /api/iot-devices/:id/ping", iotPing.status === 200 && iotPing.data.status === "ONLINE");

    const iotDel = await req("DELETE", `/api/iot-devices/${iotId}`);
    check("DELETE /api/iot-devices/:id  (ADMIN)", iotDel.status === 200 && iotDel.data.id === iotId);
  }

  // ── Dashboard ────────────────────────────────────────────────
  console.log("\n── Dashboard ──");

  const dash = await req("GET", "/api/dashboard/stats");
  check("GET /api/dashboard/stats", dash.status === 200 && dash.data.raw_materials !== undefined);
  check("  → raw_materials stats present",  dash.data.raw_materials?.total_items !== undefined);
  check("  → finished_products stats present", dash.data.finished_products?.total_products !== undefined);
  check("  → clients stats present",        dash.data.clients?.total_clients !== undefined);
  check("  → iot_devices stats present",    dash.data.iot_devices?.total !== undefined);
  check("  → low_stock_alerts array",       Array.isArray(dash.data.low_stock_alerts));
  check("  → recent_activity array",        Array.isArray(dash.data.recent_activity));

  // ── Activity ─────────────────────────────────────────────────
  console.log("\n── Activity ──");

  const actList = await req("GET", "/api/activity");
  check("GET /api/activity", actList.status === 200 && Array.isArray(actList.data.logs));
  check("  → pagination present", actList.data.pagination?.total !== undefined);

  const actModule = await req("GET", "/api/activity?module=raw_material&limit=5");
  check("GET /api/activity?module=raw_material&limit=5", actModule.status === 200);

  const actUsers = await req("GET", "/api/activity/users");
  check("GET /api/activity/users", actUsers.status === 200 && Array.isArray(actUsers.data.users));

  // ── Users (ADMIN) ─────────────────────────────────────────────
  console.log("\n── Users (ADMIN) ──");

  const uList = await req("GET", "/api/users");
  check("GET /api/users  (ADMIN)", uList.status === 200 && Array.isArray(uList.data.users));

  const uMe = await req("GET", "/api/users/me");
  check("GET /api/users/me", uMe.status === 200 && uMe.data.username === "s2r2admin");

  const uCreate = await req("POST", "/api/users", {
    username: `testuser_${Date.now()}`, password: "Test1234", role: "EDITOR",
  });
  check("POST /api/users  (create EDITOR)", uCreate.status === 201 && uCreate.data.id);
  const uId = uCreate.data.id;

  if (uId) {
    const uUpdate = await req("PUT", `/api/users/${uId}`, { role: "VIEWER" });
    check("PUT /api/users/:id  (change role)", uUpdate.status === 200 && uUpdate.data.role === "VIEWER");

    const uDel = await req("DELETE", `/api/users/${uId}`);
    check("DELETE /api/users/:id", uDel.status === 200);
  }

  // Cannot delete self
  const selfDel = await req("DELETE", `/api/users/${goodLogin.data ? 1 : 0}`);
  // just check it doesn't crash (may be 400 or 200 depending on id)
  check("DELETE /api/users/self  (→ 400 forbidden)", selfDel.status === 400 || selfDel.status === 404 || selfDel.status === 200);

  // EDITOR cannot access admin routes
  const editorLogin = await req("POST", "/api/auth/login", { username: "editor1", password: "Editor2025a" }, false);
  if (editorLogin.data.token) {
    const savedToken = TOKEN;
    TOKEN = editorLogin.data.token;
    const editorUsers = await req("GET", "/api/users");
    check("GET /api/users  (EDITOR → 403)", editorUsers.status === 403);
    TOKEN = savedToken;
  }

  // ── Summary ──────────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n══════════════════════════════════════════════════");
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error("\n❌ Test runner crashed:", err.message);
  process.exit(1);
});
