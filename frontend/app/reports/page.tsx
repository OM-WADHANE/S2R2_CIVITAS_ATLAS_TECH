"use client";
// app/reports/page.tsx
import { useEffect, useState, useCallback } from "react";
import Papa from "papaparse";
import AppShell from "@/components/AppShell";
import { getRawMaterials, getFinishedProducts, getClients, getActivity } from "@/lib/api";
import { RawMaterial, FinishedProduct, Client, ActivityLog } from "@/types";
import { FileText, FileSpreadsheet, Download, BarChart2, RefreshCw } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV export using papaparse.
 * Takes an array of plain objects; Papa.unparse handles quoting,
 * escaping, and header row generation automatically.
 */
function exportCsv(rows: Record<string, unknown>[], filename: string) {
  const csv  = Papa.unparse(rows, { header: true });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/**
 * Excel export using xlsx (SheetJS).
 * Dynamically imported so it doesn't bloat the initial bundle.
 */
async function exportXlsx(
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string
) {
  const XLSX = await import("xlsx");
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf  = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
}

// ─────────────────────────────────────────────────────────────
// Row-shape builders  (one per module — keeps export logic DRY)
// ─────────────────────────────────────────────────────────────

function rawRow(i: RawMaterial) {
  return {
    ID:         i.id,
    Name:       i.name,
    Category:   i.category,
    Quantity:   i.quantity,
    Unit:       i.unit,
    Supplier:   i.supplier   ?? "",
    Location:   i.location   ?? "",
    "Min Stock": i.minStock,
    "Price (₹)": i.price,
    Status:     i.status,
    "Last Updated": i.lastUpdated
      ? new Date(i.lastUpdated).toLocaleDateString()
      : "",
  };
}

function productRow(p: FinishedProduct) {
  return {
    ID:       p.id,
    Name:     p.name,
    Quantity: p.qty,
    Unit:     p.unit,
    Category: p.category,
    Status:   p.status,
  };
}

function clientRow(c: Client) {
  return {
    ID:           c.id,
    "Client Name": c.clientName,
    Company:      c.companyName ?? "",
    Phone:        c.phone       ?? "",
    Email:        c.email       ?? "",
    Address:      c.address     ?? "",
    "GST No":     c.gstNo       ?? "",
    Status:       c.status,
    Created:      new Date(c.createdAt).toLocaleDateString(),
  };
}

function activityRow(a: ActivityLog) {
  return {
    ID:       a.id,
    Module:   a.module.replace(/_/g, " "),
    Label:    a.label,
    Action:   a.action,
    "By":     a.username,
    Time:     new Date(a.eventTime).toLocaleString(),
  };
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Tab = "raw-materials" | "finished-products" | "clients" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "raw-materials",     label: "Raw Materials"     },
  { id: "finished-products", label: "Finished Products" },
  { id: "clients",           label: "Clients"           },
  { id: "activity",          label: "Activity Log"      },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab,     setTab]     = useState<Tab>("raw-materials");
  const [loading, setLoading] = useState(false);

  const [rawMats,  setRawMats]  = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [actLogs,  setActLogs]  = useState<ActivityLog[]>([]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // ── data fetching ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rm, fp, cl, ac] = await Promise.all([
        getRawMaterials(),
        getFinishedProducts(),
        getClients(),
        getActivity("limit=200"),
      ]);
      setRawMats(rm.items);
      setProducts(fp.products);
      setClients(cl.clients);
      setActLogs(ac.logs);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── date-range filter ──────────────────────────────────────
  function inRange(dateStr: string | undefined | null): boolean {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    const f = dateFrom ? new Date(dateFrom).getTime()              : -Infinity;
    const t = dateTo   ? new Date(dateTo + "T23:59:59").getTime()  :  Infinity;
    return d >= f && d <= t;
  }

  const visibleRaw      = rawMats.filter(i => inRange(i.lastUpdated));
  const visibleProducts = products; // FinishedProduct has no date field
  const visibleClients  = clients.filter(c => inRange(c.createdAt));
  const visibleActivity = actLogs.filter(a => inRange(a.eventTime));

  // ── CSV export via papaparse ───────────────────────────────
  function exportRawCsv()      { exportCsv(visibleRaw.map(rawRow),           "raw-materials.csv");   }
  function exportProductsCsv() { exportCsv(visibleProducts.map(productRow),  "finished-products.csv"); }
  function exportClientsCsv()  { exportCsv(visibleClients.map(clientRow),    "clients.csv");          }
  function exportActivityCsv() { exportCsv(visibleActivity.map(activityRow), "activity-log.csv");     }

  // ── Excel export via xlsx ──────────────────────────────────
  const exportRawXlsx      = () => exportXlsx(visibleRaw.map(rawRow),           "Raw Materials",     "raw-materials.xlsx");
  const exportProductsXlsx = () => exportXlsx(visibleProducts.map(productRow),  "Finished Products", "finished-products.xlsx");
  const exportClientsXlsx  = () => exportXlsx(visibleClients.map(clientRow),    "Clients",           "clients.xlsx");
  const exportActivityXlsx = () => exportXlsx(visibleActivity.map(activityRow), "Activity Log",      "activity-log.xlsx");

  // ── PDF — streamed from backend ────────────────────────────
  function streamPdf(endpoint: string, filename: string) {
    const token = localStorage.getItem("s2r2_token") || "";
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`PDF export failed: ${r.status}`); return r.blob(); })
      .then(blob => downloadBlob(blob, filename))
      .catch(err => console.error(err));
  }
  const exportRawPdf      = () => streamPdf("/api/raw-materials/export/pdf",      "raw-materials.pdf");
  const exportProductsPdf = () => streamPdf("/api/finished-products/export/pdf",  "finished-products.pdf");
  const exportClientsPdf  = () => streamPdf("/api/clients/export/pdf",            "clients.pdf");

  // ── summary counts ─────────────────────────────────────────
  const summaries = [
    { label: "Raw Materials",     value: visibleRaw.length,      color: "text-blue-600"    },
    { label: "Finished Products", value: visibleProducts.length, color: "text-emerald-600" },
    { label: "Clients",           value: visibleClients.length,  color: "text-purple-600"  },
    { label: "Activity Events",   value: visibleActivity.length, color: "text-amber-600"   },
  ];

  const actionBadge = (action: string) =>
    ({ created: "bg-green-100 text-green-700", updated: "bg-blue-100 text-blue-700", deleted: "bg-red-100 text-red-700" }[action]
      ?? "bg-gray-100 text-gray-600");

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart2 size={24} className="text-blue-600" />
              Reports &amp; Exports
            </h2>
            <p className="text-gray-500 text-sm">
              Export any module as CSV (papaparse), Excel (xlsx), or PDF
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading…" : "Refresh Data"}
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaries.map(s => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center"
            >
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Date-range filter ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Clear
          </button>
          <p className="text-xs text-gray-400 self-center">
            Filters Raw Materials (last updated), Clients (created), and Activity Log.
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            RAW MATERIALS TAB
        ════════════════════════════════════════════════════ */}
        {tab === "raw-materials" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <TableHeader
              title={`Raw Materials — ${visibleRaw.length} records`}
              onCsv={exportRawCsv}
              onXlsx={exportRawXlsx}
              onPdf={exportRawPdf}
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <THead cols={["ID","Name","Category","Qty","Unit","Supplier","Location","Min Stock","Price","Status"]} />
                <tbody>
                  {visibleRaw.length === 0
                    ? <EmptyRow cols={10} />
                    : visibleRaw.map(i => (
                      <tr key={i.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 text-gray-500">{i.id}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{i.name}</td>
                        <td className="px-3 py-2">{i.category}</td>
                        <td className="px-3 py-2">{i.quantity}</td>
                        <td className="px-3 py-2">{i.unit}</td>
                        <td className="px-3 py-2">{i.supplier ?? "—"}</td>
                        <td className="px-3 py-2">{i.location ?? "—"}</td>
                        <td className="px-3 py-2">{i.minStock}</td>
                        <td className="px-3 py-2 text-green-700 dark:text-green-400 font-medium">
                          ₹{i.price.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            i.status === "active" ? "bg-green-100 text-green-700" :
                            i.status === "low"    ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-red-100 text-red-700"
                          }`}>{i.status}</span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            FINISHED PRODUCTS TAB
        ════════════════════════════════════════════════════ */}
        {tab === "finished-products" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <TableHeader
              title={`Finished Products — ${visibleProducts.length} records`}
              onCsv={exportProductsCsv}
              onXlsx={exportProductsXlsx}
              onPdf={exportProductsPdf}
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <THead cols={["ID","Name","Qty","Unit","Category","Status"]} />
                <tbody>
                  {visibleProducts.length === 0
                    ? <EmptyRow cols={6} />
                    : visibleProducts.map(p => (
                      <tr key={p.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 text-gray-500">{p.id}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{p.name}</td>
                        <td className="px-3 py-2">{p.qty}</td>
                        <td className="px-3 py-2">{p.unit}</td>
                        <td className="px-3 py-2">{p.category}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            CLIENTS TAB
        ════════════════════════════════════════════════════ */}
        {tab === "clients" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <TableHeader
              title={`Clients — ${visibleClients.length} records`}
              onCsv={exportClientsCsv}
              onXlsx={exportClientsXlsx}
              onPdf={exportClientsPdf}
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <THead cols={["ID","Client Name","Company","Phone","Email","Address","GST No","Status","Created"]} />
                <tbody>
                  {visibleClients.length === 0
                    ? <EmptyRow cols={9} />
                    : visibleClients.map(c => (
                      <tr key={c.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 text-gray-500">{c.id}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{c.clientName}</td>
                        <td className="px-3 py-2">{c.companyName}</td>
                        <td className="px-3 py-2">{c.phone}</td>
                        <td className="px-3 py-2">{c.email}</td>
                        <td className="px-3 py-2">{c.address}</td>
                        <td className="px-3 py-2">{c.gstNo || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full ${
                            c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                          }`}>{c.status.toLowerCase()}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            ACTIVITY LOG TAB
        ════════════════════════════════════════════════════ */}
        {tab === "activity" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <TableHeader
              title={`Activity Log — ${visibleActivity.length} events`}
              onCsv={exportActivityCsv}
              onXlsx={exportActivityXlsx}
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <THead cols={["ID","Module","Label","Action","By","Time"]} />
                <tbody>
                  {visibleActivity.length === 0
                    ? <EmptyRow cols={6} />
                    : visibleActivity.map(a => (
                      <tr key={a.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 text-gray-500">{a.id}</td>
                        <td className="px-3 py-2 capitalize">{a.module.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{a.label}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${actionBadge(a.action)}`}>
                            {a.action}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            {a.username}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(a.eventTime).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Small sub-components kept in the same file for locality
// ─────────────────────────────────────────────────────────────

function TableHeader({
  title,
  onCsv,
  onXlsx,
  onPdf,
}: {
  title:   string;
  onCsv:   () => void;
  onXlsx:  () => void;
  onPdf?:  () => void;
}) {
  return (
    <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-wrap items-center justify-between gap-2">
      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</span>
      <div className="flex gap-2">
        <button
          onClick={onCsv}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs hover:bg-sky-700 transition"
        >
          <FileText size={12} /> CSV
        </button>
        <button
          onClick={onXlsx}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 transition"
        >
          <FileSpreadsheet size={12} /> Excel
        </button>
        {onPdf && (
          <button
            onClick={onPdf}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 transition"
          >
            <Download size={12} /> PDF
          </button>
        )}
      </div>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
      <tr>
        {cols.map(h => (
          <th key={h} className="text-left px-3 py-2 whitespace-nowrap font-semibold">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-8 text-center text-gray-400">
        No records found
      </td>
    </tr>
  );
}
