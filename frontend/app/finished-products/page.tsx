"use client";
// app/finished-products/page.tsx — Full CRUD + Excel + PDF + polished UI
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import {
  getFinishedProducts, createFinishedProduct,
  updateFinishedProduct, deleteFinishedProduct,
} from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { FinishedProduct } from "@/types";
import {
  Search, Plus, X, FileSpreadsheet, FileText,
  Download, Pencil, Trash2, Box, RefreshCw,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function xlsxExport(rows: Record<string, unknown>[], sheet: string, file: string) {
  const XLSX = await import("xlsx");
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  downloadBlob(
    new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    file,
  );
}

function pdfExport(token: string) {
  fetch("/api/finished-products/export/pdf", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => { if (!r.ok) throw new Error("PDF failed"); return r.blob(); })
    .then(blob => downloadBlob(blob, "finished-products.pdf"))
    .catch(console.error);
}

// ── status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: FinishedProduct["status"] }) {
  return status === "ACTIVE"
    ? <span className="badge-green">Active</span>
    : <span className="badge-amber">Hold</span>;
}

// ── empty form ────────────────────────────────────────────────────────────
const EMPTY: Omit<FinishedProduct, "id"> = {
  name: "", qty: 0, unit: "Box", category: "Finished Products", price: 0, status: "ACTIVE",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function FinishedProductsPage() {
  const { canAdd, canEdit, canDelete } = usePermissions("finished-product");
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [filtered, setFiltered] = useState<FinishedProduct[]>([]);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [view,     setView]     = useState<"grid" | "table">("grid");
  const [modal,    setModal]    = useState<Partial<FinishedProduct> | null>(null);
  const [isNew,    setIsNew]    = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("s2r2_token") || "" : "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products } = await getFinishedProducts();
      setProducts(products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    setFiltered(products.filter(p => {
      const q = search.toLowerCase();
      const matchText = !q || `${p.name} ${p.unit} ${p.category}`.toLowerCase().includes(q);
      const matchStat = !status || p.status === status;
      return matchText && matchStat;
    }));
  }, [products, search, status]);

  function openAdd()                    { setIsNew(true);  setModal({ ...EMPTY }); }
  function openEdit(p: FinishedProduct) { setIsNew(false); setModal({ ...p }); }
  function closeModal()                 { setModal(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      if (isNew) {
        await createFinishedProduct(modal);
      } else {
        await updateFinishedProduct(modal.id!, modal);
      }
      closeModal();
      fetchProducts();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteFinishedProduct(id);
    fetchProducts();
  }

  // exports
  const rows = () => filtered.map(p => ({
    ID: p.id, Name: p.name, Qty: p.qty, Unit: p.unit, Category: p.category, Status: p.status,
  }));

  function exportCsv() {
    import("papaparse").then(({ default: Papa }) =>
      downloadBlob(new Blob([Papa.unparse(rows())], { type: "text/csv;charset=utf-8;" }), "finished-products.csv")
    );
  }

  // summary
  const totalQty        = products.reduce((s, p) => s + p.qty, 0);
  const readyCount      = products.filter(p => p.status === "ACTIVE").length;
  const totalStockValue = products.reduce((s, p) => s + p.qty * (p.price ?? 0), 0);

  return (
    <AppShell>
      <div className="space-y-5 max-w-7xl mx-auto">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Box size={22} className="text-emerald-600" /> Finished Products
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage finished inventory — add, edit, delete, export</p>
          </div>
          {canAdd && (
            <button onClick={openAdd} className="btn-success self-start gap-2">
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* ── Summary chips ───────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total Products", value: products.length, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
            { label: "Total Qty",      value: totalQty,        cls: "bg-blue-50   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300"   },
            { label: "Ready (Active)", value: readyCount,      cls: "bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300"  },
            { label: "On Hold",        value: products.length - readyCount, cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
            { label: "Stock Value",    value: `₹${totalStockValue.toLocaleString()}`, cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
          ].map(s => (
            <div key={s.label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${s.cls}`}>
              {s.label}: <strong>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, unit, category…"
                className="form-input pl-9"
              />
            </div>

            <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-36">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="HOLD">Hold</option>
            </select>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              {(["grid","table"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-2 text-xs font-semibold transition capitalize ${
                    view === v ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>{v}</button>
              ))}
            </div>

            <button onClick={fetchProducts} className="btn-secondary btn-sm"><RefreshCw size={13} className={loading ? "animate-spin" : ""} /></button>
            <button onClick={exportCsv}                   className="btn btn-sm bg-sky-600 text-white hover:bg-sky-700 gap-1"><FileText size={12}/>CSV</button>
            <button onClick={() => xlsxExport(rows(), "Finished Products", "finished-products.xlsx")} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 gap-1"><FileSpreadsheet size={12}/>Excel</button>
            <button onClick={() => pdfExport(token)}      className="btn btn-sm bg-red-600 text-white hover:bg-red-700 gap-1"><Download size={12}/>PDF</button>

            {(search || status) && (
              <button onClick={() => { setSearch(""); setStatus(""); }} className="btn-secondary btn-sm">
                <X size={12}/> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-44 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center text-gray-400">
            <Box size={56} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">
              <button onClick={openAdd} className="text-emerald-600 hover:underline">Add the first product</button>
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="card p-5 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 dark:text-white truncate">{p.name}</h3>
                    <span className="text-xs text-gray-400 mt-0.5">FP-{p.id} · {p.category}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Quantity</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{p.qty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Unit</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{p.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Unit Price</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{(p.price ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Stock Value</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">₹{(p.qty * (p.price ?? 0)).toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress bar qty indicator */}
                <div className="mb-4">
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <div
                      className={`h-1.5 rounded-full ${p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"}`}
                      style={{ width: `${Math.min(100, (p.qty / Math.max(...filtered.map(x => x.qty), 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold transition"
                    >
                      <Pencil size={12}/> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition"
                    >
                      <Trash2 size={12}/> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {["ID","Name","Qty","Unit","Category","Price","Stock Value","Status","Actions"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td className="text-gray-400">{p.id}</td>
                      <td className="font-semibold text-gray-800 dark:text-white">{p.name}</td>
                      <td className="font-bold text-blue-600 dark:text-blue-400">{p.qty}</td>
                      <td>{p.unit}</td>
                      <td><span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{p.category}</span></td>
                      <td className="font-semibold text-emerald-600 dark:text-emerald-400">₹{(p.price ?? 0).toLocaleString()}</td>
                      <td className="font-semibold text-purple-600 dark:text-purple-400">₹{(p.qty * (p.price ?? 0)).toLocaleString()}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          {canEdit && <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition" title="Edit"><Pencil size={13}/></button>}
                          {canDelete && <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100 transition" title="Delete"><Trash2 size={13}/></button>}
                          {!canEdit && !canDelete && <span className="text-xs text-gray-400 italic">View only</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {isNew ? "Add Finished Product" : "Edit Product"}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <Field label="Name *">
                <input
                  value={modal.name ?? ""} onChange={e => setModal({ ...modal, name: e.target.value })}
                  required className="form-input" placeholder="e.g. Iotzee"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantity *">
                  <input
                    type="number" min={0} value={modal.qty ?? 0}
                    onChange={e => setModal({ ...modal, qty: Number(e.target.value) })}
                    required className="form-input"
                  />
                </Field>
                <Field label="Unit *">
                  <input
                    list="fp-units" value={modal.unit ?? ""}
                    onChange={e => setModal({ ...modal, unit: e.target.value })}
                    required className="form-input" placeholder="Box, pcs…"
                  />
                  <datalist id="fp-units">
                    <option value="Box" /><option value="pcs" /><option value="Complete" /><option value="Set" />
                  </datalist>
                </Field>
              </div>

              <Field label="Category">
                <input
                  value={modal.category ?? ""}
                  onChange={e => setModal({ ...modal, category: e.target.value })}
                  className="form-input" placeholder="Finished Products"
                />
              </Field>

              <Field label="Unit Price (₹)">
                <input
                  type="number" min={0} step="any"
                  value={modal.price ?? 0}
                  onChange={e => setModal({ ...modal, price: Number(e.target.value) })}
                  className="form-input"
                />
              </Field>

              <Field label="Status">
                <select
                  value={modal.status ?? "ACTIVE"}
                  onChange={e => setModal({ ...modal, status: e.target.value as FinishedProduct["status"] })}
                  className="form-select"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="HOLD">Hold</option>
                </select>
              </Field>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-success">
                  {saving
                    ? <><RefreshCw size={14} className="animate-spin" />{isNew ? "Creating…" : "Saving…"}</>
                    : isNew ? "Create Product" : "Save Changes"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
