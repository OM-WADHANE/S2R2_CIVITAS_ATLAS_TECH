"use client";
// app/raw-materials/page.tsx — Full CRUD + Excel + PDF + polished UI
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import {
  getRawMaterials, createRawMaterial,
  updateRawMaterial, deleteRawMaterial,
} from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { RawMaterial } from "@/types";
import {
  Search, Plus, X, FileSpreadsheet, FileText,
  Download, Pencil, Trash2, Package, RefreshCw,
  ChevronDown, ChevronUp,
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
  fetch("/api/raw-materials/export/pdf", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => { if (!r.ok) throw new Error("PDF failed"); return r.blob(); })
    .then(blob => downloadBlob(blob, "raw-materials.pdf"))
    .catch(console.error);
}

// ── empty form ────────────────────────────────────────────────────────────
const EMPTY: Omit<RawMaterial, "id" | "status" | "lastUpdated"> = {
  name: "", category: "Electronics", description: "", quantity: 0,
  unit: "pcs", supplier: "", location: "", minStock: 0, price: 0,
};

// ── status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RawMaterial["status"] }) {
  const styles = {
    active: "badge-green",
    low:    "badge-yellow",
    out:    "badge-red",
  } as const;
  const labels = { active: "In Stock", low: "Low Stock", out: "Out of Stock" } as const;
  return <span className={styles[status]}>{labels[status]}</span>;
}

// ── input / label helpers ─────────────────────────────────────────────────
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

export default function RawMaterialsPage() {
  const { canAdd, canEdit, canDelete } = usePermissions("raw-material");
  const [items,    setItems]    = useState<RawMaterial[]>([]);
  const [filtered, setFiltered] = useState<RawMaterial[]>([]);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [view,     setView]     = useState<"grid" | "table">("grid");

  // modal
  const [modal,  setModal]  = useState<Partial<typeof EMPTY & { id?: number; status?: string }> | null>(null);
  const [isNew,  setIsNew]  = useState(false);

  // sort
  const [sortCol, setSortCol] = useState<keyof RawMaterial>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const token = typeof window !== "undefined" ? localStorage.getItem("s2r2_token") || "" : "";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await getRawMaterials();
      setItems(items);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // filter + sort
  useEffect(() => {
    let result = items.filter(item => {
      const q = search.toLowerCase();
      const matchText = !q || `${item.name} ${item.description ?? ""} ${item.supplier ?? ""}`.toLowerCase().includes(q);
      const matchCat  = !category || item.category === category;
      const matchStat = !status   || item.status === status;
      return matchText && matchCat && matchStat;
    });
    result = [...result].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    setFiltered(result);
  }, [items, search, category, status, sortCol, sortDir]);

  function openAdd()              { setIsNew(true);  setModal({ ...EMPTY }); }
  function openEdit(i: RawMaterial) { setIsNew(false); setModal({ ...i }); }
  function closeModal()           { setModal(null); }

  function toggleSort(col: keyof RawMaterial) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      if (isNew) {
        await createRawMaterial(modal as Partial<RawMaterial>);
      } else {
        await updateRawMaterial(modal.id!, modal as Partial<RawMaterial>);
      }
      closeModal();
      fetchItems();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteRawMaterial(id);
    fetchItems();
  }

  // exports
  function exportCsv() {
    import("papaparse").then(({ default: Papa }) => {
      const rows = filtered.map(i => ({
        ID: i.id, Name: i.name, Category: i.category, Qty: i.quantity,
        Unit: i.unit, Supplier: i.supplier ?? "", Location: i.location ?? "",
        "Min Stock": i.minStock, "Price (₹)": i.price,
        "Stock Value (₹)": i.quantity * i.price, Status: i.status,
      }));
      downloadBlob(new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8;" }), "raw-materials.csv");
    });
  }

  function exportExcel() {
    xlsxExport(
      filtered.map(i => ({
        ID: i.id, Name: i.name, Category: i.category, Qty: i.quantity,
        Unit: i.unit, Supplier: i.supplier ?? "", Location: i.location ?? "",
        "Min Stock": i.minStock, "Price (₹)": i.price,
        "Stock Value (₹)": i.quantity * i.price, Status: i.status,
      })),
      "Raw Materials", "raw-materials.xlsx",
    );
  }

  // summary
  const totalQty        = items.reduce((s, i) => s + i.quantity, 0);
  const lowCount        = items.filter(i => i.status === "low" || i.status === "out").length;
  const totalStockValue = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const categories = Array.from(new Set(items.map(i => i.category))).sort();

  function SortIcon({ col }: { col: keyof RawMaterial }) {
    if (sortCol !== col) return <ChevronDown size={10} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  }

  const TH = ({ col, label }: { col: keyof RawMaterial; label: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
    >
      <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
    </th>
  );

  return (
    <AppShell>
      <div className="space-y-5 max-w-7xl mx-auto">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Package size={22} className="text-blue-600" /> Raw Materials
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Add, edit, delete and export inventory items</p>
          </div>
          {canAdd && (
            <button onClick={openAdd} className="btn-primary gap-2 self-start">
              <Plus size={16} /> Add Material
            </button>
          )}
        </div>

        {/* ── Summary chips ───────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total Items",   value: items.length,    cls: "bg-blue-50   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300"   },
            { label: "Total Qty",     value: totalQty,        cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
            { label: "Low / Out",     value: lowCount,        cls: "bg-red-50    text-red-700    dark:bg-red-900/30    dark:text-red-300"    },
            { label: "Stock Value",   value: `₹${totalStockValue.toLocaleString()}`, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
            { label: "Showing",       value: filtered.length, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"          },
          ].map(s => (
            <div key={s.label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${s.cls}`}>
              {s.label}: <strong>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, description, supplier…"
                className="form-input pl-9"
              />
            </div>

            {/* Category filter */}
            <select value={category} onChange={e => setCategory(e.target.value)} className="form-select w-40">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Status filter */}
            <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-36">
              <option value="">All Status</option>
              <option value="active">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              {(["grid","table"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 text-xs font-semibold transition capitalize ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={fetchItems} className="btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Export buttons */}
            <button onClick={exportCsv}             className="btn btn-sm bg-sky-600 text-white hover:bg-sky-700 gap-1"><FileText size={12}/>CSV</button>
            <button onClick={exportExcel}            className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 gap-1"><FileSpreadsheet size={12}/>Excel</button>
            <button onClick={() => pdfExport(token)} className="btn btn-sm bg-red-600 text-white hover:bg-red-700 gap-1"><Download size={12}/>PDF</button>

            {/* Reset filters */}
            {(search || category || status) && (
              <button onClick={() => { setSearch(""); setCategory(""); setStatus(""); }} className="btn-secondary btn-sm">
                <X size={12}/> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center text-gray-400">
            <Package size={56} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No materials found</p>
            <p className="text-sm mt-1">Try adjusting filters or <button onClick={openAdd} className="text-blue-600 hover:underline">add a new item</button></p>
          </div>
        ) : view === "grid" ? (
          /* ── Card Grid ── */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="card p-5 hover:shadow-md transition-all group">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 dark:text-white truncate">{item.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {item.category}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Quantity</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Min Stock</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{item.minStock} <span className="text-xs font-normal text-gray-400">{item.unit}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Supplier</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{item.supplier || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Location</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{item.location || "—"}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Unit Price</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Stock Value</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">₹{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                    {canEdit && (
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Table ── */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <TH col="name"     label="Name"        />
                    <TH col="category" label="Category"    />
                    <TH col="quantity" label="Qty"         />
                    <TH col="unit"     label="Unit"        />
                    <TH col="supplier" label="Supplier"    />
                    <TH col="location" label="Location"    />
                    <TH col="minStock" label="Min Stock"   />
                    <TH col="price"    label="Price"       />
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Stock Value</th>
                    <TH col="status"   label="Status"      />
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td className="font-semibold text-gray-800 dark:text-white">{item.name}</td>
                      <td>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{item.category}</span>
                      </td>
                      <td className="font-semibold text-blue-600 dark:text-blue-400">{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>{item.supplier || "—"}</td>
                      <td>{item.location || "—"}</td>
                      <td>{item.minStock}</td>
                      <td className="font-semibold text-emerald-600 dark:text-emerald-400">₹{item.price.toLocaleString()}</td>
                      <td className="font-semibold text-purple-600 dark:text-purple-400">₹{(item.quantity * item.price).toLocaleString()}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          {canEdit && <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition" title="Edit"><Pencil size={13}/></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100 transition" title="Delete"><Trash2 size={13}/></button>}
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

      {/* ── Add / Edit Modal ──────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {isNew ? "Add Raw Material" : "Edit Raw Material"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isNew ? "Fill in the details to create a new item" : `Editing: ${modal.name}`}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 grid md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <Field label="Name *">
                  <input
                    value={modal.name ?? ""}
                    onChange={e => setModal({ ...modal, name: e.target.value })}
                    required className="form-input"
                    placeholder="e.g. PLC Controller"
                  />
                </Field>
              </div>

              {/* Category */}
              <Field label="Category *">
                <input
                  list="cats"
                  value={modal.category ?? ""}
                  onChange={e => setModal({ ...modal, category: e.target.value })}
                  required className="form-input"
                  placeholder="Electronics, Sensors…"
                />
                <datalist id="cats">
                  {categories.map(c => <option key={c} value={c} />)}
                  <option value="Electronics" /><option value="Sensors" /><option value="Components" />
                </datalist>
              </Field>

              {/* Unit */}
              <Field label="Unit *">
                <input
                  list="units"
                  value={modal.unit ?? ""}
                  onChange={e => setModal({ ...modal, unit: e.target.value })}
                  required className="form-input"
                  placeholder="pcs, m, kg…"
                />
                <datalist id="units">
                  <option value="pcs" /><option value="m" /><option value="kg" />
                  <option value="L" /><option value="box" />
                </datalist>
              </Field>

              {/* Quantity */}
              <Field label="Quantity *">
                <input
                  type="number" min={0} step="any"
                  value={modal.quantity ?? 0}
                  onChange={e => setModal({ ...modal, quantity: Number(e.target.value) })}
                  required className="form-input"
                />
              </Field>

              {/* Min Stock */}
              <Field label="Min Stock *">
                <input
                  type="number" min={0} step="any"
                  value={modal.minStock ?? 0}
                  onChange={e => setModal({ ...modal, minStock: Number(e.target.value) })}
                  required className="form-input"
                />
              </Field>

              {/* Price */}
              <Field label="Unit Price (₹) *">
                <input
                  type="number" min={0} step="any"
                  value={modal.price ?? 0}
                  onChange={e => setModal({ ...modal, price: Number(e.target.value) })}
                  required className="form-input"
                />
              </Field>

              {/* Supplier */}
              <Field label="Supplier">
                <input
                  value={modal.supplier ?? ""}
                  onChange={e => setModal({ ...modal, supplier: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Siemens"
                />
              </Field>

              {/* Location */}
              <Field label="Location">
                <input
                  value={modal.location ?? ""}
                  onChange={e => setModal({ ...modal, location: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Warehouse A"
                />
              </Field>

              {/* Description */}
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={3}
                    value={modal.description ?? ""}
                    onChange={e => setModal({ ...modal, description: e.target.value })}
                    className="form-input resize-none"
                    placeholder="Optional description…"
                  />
                </Field>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (
                    <><RefreshCw size={14} className="animate-spin" />{isNew ? "Creating…" : "Saving…"}</>
                  ) : (
                    isNew ? "Create Material" : "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
