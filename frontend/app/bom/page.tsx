"use client";
export const dynamic = "force-dynamic";
// app/bom/page.tsx — Bill of Materials management
// Visible to ADMIN and EDITOR only — hidden from VIEWER via Sidebar.
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { getBom, setBom, getRawMaterials, getFinishedProducts } from "@/lib/api";
import { BomEntry, RawMaterial, FinishedProduct } from "@/types";
import {
  GitBranch, Plus, Trash2, RefreshCw, Save,
  X, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Loader2, Package, Box,
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";

// ── types ──────────────────────────────────────────────────────
interface ProductWithBom {
  id:       number;
  name:     string;
  unit:     string;
  category: string;
  entries:  BomEntry[];
}

export default function BomPage() {
  const { isAdmin, role } = usePermissions("raw-material");
  const canEdit = isAdmin || role === "EDITOR";

  const [products,    setProducts]    = useState<ProductWithBom[]>([]);
  const [rawMats,     setRawMats]     = useState<RawMaterial[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);

  // edit state per product
  const [editEntries, setEditEntries] = useState<{ rawMaterialId: number; quantityRequired: number }[]>([]);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState<string | null>(null);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ products: fps }, { items: rms }] = await Promise.all([
        getFinishedProducts(),
        getRawMaterials(),
      ]);
      setRawMats(rms);

      // Load BOM for each finished product
      const withBom = await Promise.all(
        fps.map(async fp => {
          try {
            const bom = await getBom(fp.id);
            return { id: fp.id, name: fp.name, unit: fp.unit, category: fp.category, entries: bom.entries };
          } catch {
            return { id: fp.id, name: fp.name, unit: fp.unit, category: fp.category, entries: [] };
          }
        })
      );
      setProducts(withBom);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function startEdit(product: ProductWithBom) {
    setEditingId(product.id);
    setExpandedId(product.id);
    setEditEntries(product.entries.map(e => ({ rawMaterialId: e.rawMaterialId, quantityRequired: e.quantityRequired })));
    setSaveMsg(null);
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditEntries([]);
    setSaveMsg(null);
    setSaveError(null);
  }

  function addEntry() {
    setEditEntries(prev => [...prev, { rawMaterialId: rawMats[0]?.id ?? 0, quantityRequired: 1 }]);
  }

  function removeEntry(idx: number) {
    setEditEntries(prev => prev.filter((_, i) => i !== idx));
  }

  function updateEntry(idx: number, field: "rawMaterialId" | "quantityRequired", val: number) {
    setEditEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  }

  async function handleSave(productId: number) {
    setSaving(true); setSaveMsg(null); setSaveError(null);
    try {
      // Deduplicate — keep last occurrence per rawMaterialId
      const seen = new Map<number, number>();
      editEntries.forEach(e => seen.set(e.rawMaterialId, e.quantityRequired));
      const deduped = Array.from(seen.entries()).map(([rawMaterialId, quantityRequired]) => ({ rawMaterialId, quantityRequired }));

      await setBom(productId, deduped);
      setSaveMsg("BOM saved successfully.");
      setEditingId(null);
      await loadAll();
    } catch (err: unknown) {
      setSaveError((err as Error).message || "Failed to save BOM");
    } finally {
      setSaving(false);
    }
  }

  // Total BOM cost for one unit
  function bomCost(entries: BomEntry[]) {
    return entries.reduce((s, e) => s + e.unitPrice * e.quantityRequired, 0);
  }

  return (
    <AppShell>
      <div className="space-y-5 max-w-5xl mx-auto">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <GitBranch size={22} className="text-blue-600" /> Bill of Materials
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Define which raw materials are needed to produce each finished product.
              {!canEdit && <span className="ml-2 text-amber-600 font-medium">(View only)</span>}
            </p>
          </div>
          <button onClick={loadAll} className="btn-secondary self-start gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* ── Info banner ─────────────────────────────────── */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
          <strong>How it works:</strong> When you use <em>Manufacture</em> on a finished product,
          the system automatically deducts the raw material quantities defined here from stock.
          Each entry below = one unit of the finished product.
        </div>

        {/* ── Product BOM cards ─────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => {
              const isExpanded = expandedId === product.id;
              const isEditing  = editingId  === product.id;
              const cost       = bomCost(product.entries);

              return (
                <div key={product.id} className="card overflow-hidden">
                  {/* ── Product header row ── */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                      <Box size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Components</p>
                        <p className={`font-bold ${product.entries.length === 0 ? "text-amber-600" : "text-gray-800 dark:text-white"}`}>
                          {product.entries.length === 0 ? "No BOM" : product.entries.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Material Cost / unit</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {cost > 0 ? `₹${cost.toLocaleString("en-IN")}` : "—"}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0"/> : <ChevronDown size={16} className="text-gray-400 shrink-0"/>}
                  </div>

                  {/* ── Expanded BOM content ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">

                      {/* Save / error messages */}
                      {saveMsg && editingId !== product.id && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                          <CheckCircle2 size={14}/>{saveMsg}
                        </div>
                      )}
                      {saveError && isEditing && (
                        <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                          <AlertTriangle size={14}/>{saveError}
                        </div>
                      )}

                      {isEditing ? (
                        /* ── Edit mode ── */
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Editing BOM — 1 entry = 1 unit of {product.name}
                          </p>

                          {editEntries.map((entry, idx) => {
                            const rm = rawMats.find(r => r.id === entry.rawMaterialId);
                            return (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </div>
                                <select
                                  value={entry.rawMaterialId}
                                  onChange={e => updateEntry(idx, "rawMaterialId", Number(e.target.value))}
                                  className="form-select flex-1 min-w-0"
                                >
                                  {rawMats.map(r => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({r.quantity} {r.unit} available)
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    type="number" min={0.1} step="any"
                                    value={entry.quantityRequired}
                                    onChange={e => updateEntry(idx, "quantityRequired", Number(e.target.value))}
                                    className="form-input w-20 text-center"
                                  />
                                  <span className="text-xs text-gray-400 shrink-0">{rm?.unit ?? "pcs"}</span>
                                </div>
                                <button onClick={() => removeEntry(idx)}
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100 transition shrink-0">
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            );
                          })}

                          <button onClick={addEntry}
                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold transition">
                            <Plus size={15}/> Add component
                          </button>

                          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={cancelEdit} className="btn-secondary">
                              <X size={14}/> Cancel
                            </button>
                            <button onClick={() => handleSave(product.id)} disabled={saving}
                              className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                              {saving ? <><Loader2 size={14} className="animate-spin"/> Saving…</> : <><Save size={14}/> Save BOM</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <div className="space-y-3">
                          {product.entries.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                              <AlertTriangle size={15} className="shrink-0"/>
                              No Bill of Materials defined. {canEdit ? "Click Edit to add components." : "Contact an admin or editor."}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-left pb-2">#</th>
                                    <th className="text-left pb-2">Raw Material</th>
                                    <th className="text-right pb-2">Qty Required</th>
                                    <th className="text-right pb-2">Available</th>
                                    <th className="text-right pb-2">Unit Price</th>
                                    <th className="text-right pb-2">Cost / unit</th>
                                    <th className="text-center pb-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                  {product.entries.map((e, idx) => {
                                    const sufficient = e.currentStock >= e.quantityRequired;
                                    return (
                                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <td className="py-2.5 text-gray-400">{idx + 1}</td>
                                        <td className="py-2.5 font-medium text-gray-800 dark:text-white">
                                          <div className="flex items-center gap-2">
                                            <Package size={13} className="text-gray-400 shrink-0"/>
                                            {e.rawMaterialName}
                                          </div>
                                        </td>
                                        <td className="py-2.5 text-right font-semibold">{e.quantityRequired} {e.unit}</td>
                                        <td className={`py-2.5 text-right font-semibold ${sufficient ? "text-emerald-600" : "text-red-600"}`}>
                                          {e.currentStock} {e.unit}
                                        </td>
                                        <td className="py-2.5 text-right text-gray-500">₹{e.unitPrice.toLocaleString("en-IN")}</td>
                                        <td className="py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                                          ₹{(e.unitPrice * e.quantityRequired).toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-2.5 text-center">
                                          {sufficient
                                            ? <span className="badge-green text-xs">OK</span>
                                            : <span className="badge-red text-xs">Low</span>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-gray-100 dark:border-gray-700 font-bold">
                                    <td colSpan={5} className="pt-2.5 text-xs text-gray-500 uppercase tracking-wide">Total material cost per unit</td>
                                    <td className="pt-2.5 text-right text-blue-700 dark:text-blue-400">₹{cost.toLocaleString("en-IN")}</td>
                                    <td/>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}

                          {canEdit && (
                            <div className="flex justify-end pt-1">
                              <button onClick={() => startEdit(product)}
                                className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                                <GitBranch size={13}/> {product.entries.length === 0 ? "Create BOM" : "Edit BOM"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
