"use client";
export const dynamic = "force-dynamic";
// app/intelligence/page.tsx
// Civi AI — Decision Intelligence
// Powered by Civitas Atlas Technologies Pvt. Ltd., Pune
//
// LAYOUT (order):
//   1. Page header (purple-themed)
//   2. KPI cards
//   3. Logic & Metrics grid (4 sections: Reorder, Manufacture, Replenishment, Velocity)
//      ↳ inline bar-chart for velocity & manufacture readiness
//   4. Civi AI Report section (purple card, AI narrative, disclaimer)
//   5. Floating "Ask Civi AI" icon button (bottom-right)

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getIntelligence, exportIntelligencePdf } from "@/lib/api";
import {
  IntelligenceData, ReorderAlert,
  ManufactureReadiness, ReplenishmentItem, VelocityItem,
} from "@/types";
import {
  Brain, AlertTriangle, Factory, ShoppingCart,
  TrendingUp, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Package,
  Zap, BarChart2, AlertCircle, FileDown,
  Sparkles, Loader2, MessageSquare, ArrowRight,
  Info,
} from "lucide-react";
import CiviAIIcon from "@/components/CiviAIIcon";

// ── Purple theme constants ─────────────────────────────────────
const P = {
  badge:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  border:     "border-purple-200 dark:border-purple-800",
  bg:         "bg-purple-50 dark:bg-purple-900/20",
  text:       "text-purple-700 dark:text-purple-300",
  textBold:   "text-purple-800 dark:text-purple-200",
  dot:        "bg-purple-500",
  heading:    "text-purple-700 dark:text-purple-400",
  icon_bg:    "bg-purple-100 dark:bg-purple-900/30",
  card_border:"border-l-4 border-purple-500",
};

const URGENCY_STYLE: Record<string, string> = {
  CRITICAL: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400    border-red-200    dark:border-red-800",
  HIGH:     "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  MEDIUM:   "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400  border-amber-200  dark:border-amber-800",
};
const URGENCY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH:     "bg-orange-500",
  MEDIUM:   "bg-amber-400",
};
const ACTION_STYLE: Record<string, string> = {
  MANUFACTURE_NOW:   "bg-red-100    text-red-700    dark:bg-red-900/30  dark:text-red-400",
  MANUFACTURE_SOON:  "bg-amber-100  text-amber-700  dark:bg-amber-900/30 dark:text-amber-400",
  RESTOCK_MATERIALS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SUFFICIENT:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
const RISK_COLOR: Record<string, string> = {
  HIGH:   "#ef4444",
  MEDIUM: "#f59e0b",
  LOW:    "#3b82f6",
  STABLE: "#10b981",
};
const RISK_TEXT: Record<string, string> = {
  HIGH:   "text-red-600 dark:text-red-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  LOW:    "text-blue-600 dark:text-blue-400",
  STABLE: "text-emerald-600 dark:text-emerald-400",
};

// ── Inline bar chart (CSS-based, no extra library) ────────────
function MiniBarChart({ items, valueKey, labelKey, colorFn, unit = "" }: {
  items: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  colorFn:  (item: Record<string, unknown>) => string;
  unit?:    string;
}) {
  const values = items.map(i => Number(i[valueKey]) || 0);
  const max    = Math.max(...values, 1);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.max(3, (val / max) * 100);
        return (
          <div key={idx}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60%]">
                {String(item[labelKey])}
              </span>
              <span className="font-bold text-gray-800 dark:text-white shrink-0 ml-2">
                {val}{unit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: colorFn(item) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline pie/donut (SVG-based) ──────────────────────────────
function PieChart({ slices, size = 80 }: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center text-xs text-gray-400" style={{ width: size, height: size }}>
      No data
    </div>
  );

  const r   = size / 2 - 4;
  const cx  = size / 2;
  const cy  = size / 2;
  let angle = -Math.PI / 2;
  const paths: { d: string; color: string }[] = [];

  slices.forEach(sl => {
    if (sl.value === 0) return;
    const sweep = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    paths.push({
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: sl.color,
    });
    angle += sweep;
  });

  return (
    <svg width={size} height={size}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ── Manufacture readiness card ─────────────────────────────────
function ManufactureCard({ item }: { item: ManufactureReadiness }) {
  const [open, setOpen] = useState(false);
  const actionLabel: Record<string, string> = {
    MANUFACTURE_NOW:   "Manufacture now",
    MANUFACTURE_SOON:  "Manufacture soon",
    RESTOCK_MATERIALS: "Restock materials",
    SUFFICIENT:        "Sufficient",
  };
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${item.feasible ? "bg-emerald-500" : "bg-red-500"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.product_name}</p>
          <p className="text-xs text-gray-500">Max: <strong>{item.max_producible}</strong> units</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ACTION_STYLE[item.action_suggested]}`}>
          {actionLabel[item.action_suggested]}
        </span>
        {open ? <ChevronUp size={13} className="text-gray-400 shrink-0"/> : <ChevronDown size={13} className="text-gray-400 shrink-0"/>}
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3 pt-2 space-y-1.5">
          {item.materials.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {m.sufficient
                ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0"/>
                : <XCircle      size={12} className="text-red-500 shrink-0"/>}
              <span className="flex-1 text-gray-700 dark:text-gray-300">{m.name}</span>
              <span className="text-gray-500">
                Need {m.required_per_unit} · Have{" "}
                <strong className={m.sufficient ? "text-emerald-600" : "text-red-600"}>{m.available}</strong>{" "}
                {m.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI narrative renderer ─────────────────────────────────────
function AINarrative({ narrative }: { narrative: string }) {
  const lines = narrative.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  const tableRows: string[][] = [];

  function flushTable(key: number) {
    if (tableRows.length < 2) return;
    const header = tableRows[0];
    const body   = tableRows.slice(2); // skip separator row
    elements.push(
      <div key={`tbl-${key}`} className="overflow-x-auto my-3">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-purple-50/30 dark:bg-purple-900/10"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows.length = 0;
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Detect markdown table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cells = trimmed.split("|").slice(1, -1);
      tableRows.push(cells);
      return;
    }

    // End of table
    if (inTable && !trimmed.startsWith("|")) {
      flushTable(idx);
      inTable = false;
    }

    if (!trimmed) { elements.push(<div key={idx} className="h-2" />); return; }

    // Section heading
    const headingMatch = trimmed.match(/^(\d+\.\s*)?\*\*(.+?)\*\*\s*$/);
    if (headingMatch) {
      elements.push(
        <p key={idx} className="text-sm font-bold text-purple-700 dark:text-purple-400 mt-4 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-sm bg-purple-500 inline-block shrink-0" />
          {headingMatch[2]}
        </p>
      );
      return;
    }

    // Bullet point
    if (/^[-•*]\s/.test(trimmed)) {
      const clean = trimmed.replace(/^[-•*]\s/, "").replace(/\*\*(.*?)\*\*/g, "$1");
      elements.push(
        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed ml-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>{clean}</span>
        </div>
      );
      return;
    }

    // Normal paragraph
    const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
    elements.push(
      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {clean}
      </p>
    );
  });

  // Flush any trailing table
  if (inTable) flushTable(9999);

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Main page ─────────────────────────────────────────────────
export default function IntelligencePage() {
  const router = useRouter();
  const [data,       setData]       = useState<IntelligenceData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("s2r2_token") || "" : "";

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await getIntelligence()); }
    catch (e: unknown) { setError((e as Error).message || "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleExportPdf() {
    setPdfLoading(true);
    exportIntelligencePdf(token);
    setTimeout(() => setPdfLoading(false), 3500);
  }

  const s  = data?.summary;
  const ai = data?.ai_narrative;

  // Donut chart slices for urgency distribution
  const urgencySlices = data ? [
    { value: s!.critical_reorder, color: "#ef4444", label: "Critical" },
    { value: s!.high_reorder,     color: "#f97316", label: "High"     },
    { value: s!.medium_reorder,   color: "#f59e0b", label: "Medium"   },
  ] : [];

  return (
    <AppShell>
      <div className="space-y-5 max-w-7xl mx-auto pb-12">

        {/* ══ 1. PAGE HEADER — purple themed ════════════════ */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #581c87 0%, #7c3aed 60%, #a855f7 100%)" }}>
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                              bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-2">
                <CiviAIIcon size={11} animated /> Civi AI
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                Decision Support Dashboard
              </h2>
              <p className="text-purple-200 text-xs mt-1">
                AI-powered inventory intelligence
              </p>
              {data && (
                <p className="text-purple-300 text-[10px] mt-1.5">
                  Generated: {new Date(data.generated_at).toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={fetchData} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25
                           text-white text-xs font-semibold transition">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button onClick={handleExportPdf} disabled={pdfLoading || !data}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-purple-800
                           hover:bg-purple-50 text-xs font-bold transition disabled:opacity-50">
                {pdfLoading ? <Loader2 size={13} className="animate-spin"/> : <FileDown size={13}/>}
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-3 flex items-center gap-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
            <AlertCircle size={14} className="text-red-500 shrink-0"/>
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button onClick={fetchData} className="text-xs text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse"/>)}
          </div>
        )}

        {data && (
          <>
            {/* ══ 2. KPI CARDS ══════════════════════════════ */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Critical Alerts",       value: s!.critical_reorder,               sub: `${s!.high_reorder} high · ${s!.medium_reorder} medium`, icon: <AlertTriangle size={18} className="text-red-500"/>,    bg: "bg-red-50   dark:bg-red-900/10",    vc: s!.critical_reorder > 0 ? "text-red-600" : "text-emerald-600" },
                { label: "Ready to Manufacture",  value: s!.products_ready_to_manufacture,  sub: `${s!.products_need_restock} need restock`,               icon: <Factory       size={18} className="text-purple-500"/>, bg: "bg-purple-50 dark:bg-purple-900/10", vc: "text-purple-700" },
                { label: "Replenishment Items",   value: s!.replenishment_items,            sub: `Est. ₹${s!.replenishment_est_cost.toLocaleString("en-IN")}`, icon: <ShoppingCart size={18} className="text-amber-500"/>,  bg: "bg-amber-50  dark:bg-amber-900/10", vc: s!.replenishment_items > 0 ? "text-amber-600" : "text-emerald-600" },
                { label: "Total Alerts",          value: s!.total_alerts,                   sub: s!.total_alerts === 0 ? "All stock healthy" : "Items need attention", icon: <Zap size={18} className="text-purple-500"/>, bg: "bg-purple-50 dark:bg-purple-900/10", vc: s!.total_alerts > 0 ? "text-purple-700" : "text-emerald-600" },
              ].map((kpi, i) => (
                <div key={i} className={`card p-4 ${kpi.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                    {kpi.icon}
                  </div>
                  <p className={`text-2xl font-black ${kpi.vc}`}>{kpi.value}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* ══ 3. LOGIC & METRICS GRID ═══════════════════
                Order: Reorder → Manufacture → Replenishment → Velocity
            ══════════════════════════════════════════════════ */}

            {/* ── Section label ── */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/50" />
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2">
                Live Intelligence
              </span>
              <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/50" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* ── A: Reorder Alerts + urgency pie ── */}
              <section className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-500"/>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white flex-1">Reorder Alerts</h3>
                  {data.reorder_alerts.length > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {data.reorder_alerts.length}
                    </span>
                  )}
                </div>

                {data.reorder_alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                    <CheckCircle2 size={36} className="text-emerald-400 opacity-60"/>
                    <p className="text-sm">All materials above minimum thresholds</p>
                  </div>
                ) : (
                  <div className="flex gap-5 items-start">
                    {/* Pie chart */}
                    <div className="shrink-0">
                      <PieChart slices={urgencySlices} size={88}/>
                      <div className="mt-2 space-y-0.5">
                        {[
                          { label: "Critical", color: "#ef4444", val: s!.critical_reorder },
                          { label: "High",     color: "#f97316", val: s!.high_reorder     },
                          { label: "Medium",   color: "#f59e0b", val: s!.medium_reorder   },
                        ].filter(sl => sl.val > 0).map((sl, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sl.color }}/>
                            {sl.label}: {sl.val}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Alert list */}
                    <div className="flex-1 space-y-1.5 max-h-64 overflow-y-auto pr-1 min-w-0">
                      {data.reorder_alerts.map((a: ReorderAlert) => (
                        <div key={a.id} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${URGENCY_STYLE[a.urgency]}`}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${URGENCY_DOT[a.urgency]}`}/>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{a.name}</p>
                            <p className="opacity-70">{a.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold">{a.current_qty} {a.unit}</p>
                            <p className="opacity-60">min {a.min_stock}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── B: Manufacture Readiness + bar chart ── */}
              <section className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <Factory size={18} className="text-purple-600"/>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white flex-1">Manufacture Readiness</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    {data.manufacture_readiness.length}
                  </span>
                </div>

                {data.manufacture_readiness.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                    <Package size={36} className="opacity-30"/>
                    <p className="text-sm">No BOM defined — add BOM entries to enable</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bar chart — max producible per product */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Max producible units</p>
                      <MiniBarChart
                        items={data.manufacture_readiness as unknown as Record<string, unknown>[]}
                        valueKey="max_producible"
                        labelKey="product_name"
                        colorFn={item => (item as unknown as ManufactureReadiness).feasible ? "#7c3aed" : "#ef4444"}
                      />
                    </div>
                    {/* Detail cards */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {data.manufacture_readiness.map((item: ManufactureReadiness) => (
                        <ManufactureCard key={item.product_id} item={item}/>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── C: Replenishment Plan + cost table ── */}
              <section className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <ShoppingCart size={18} className="text-amber-500"/>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white flex-1">Replenishment Plan</h3>
                  {data.replenishment_plan.length > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {data.replenishment_plan.length}
                    </span>
                  )}
                </div>

                {data.replenishment_plan.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                    <CheckCircle2 size={36} className="text-emerald-400 opacity-60"/>
                    <p className="text-sm">No replenishment required</p>
                  </div>
                ) : (
                  <>
                    {/* Cost bar chart */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Estimated cost per item (₹)</p>
                      <MiniBarChart
                        items={data.replenishment_plan as unknown as Record<string, unknown>[]}
                        valueKey="estimated_cost"
                        labelKey="name"
                        colorFn={item => {
                          const u = (item as unknown as ReplenishmentItem).urgency;
                          return u === "CRITICAL" ? "#ef4444" : u === "HIGH" ? "#f97316" : "#f59e0b";
                        }}
                      />
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-amber-50 dark:bg-amber-900/20">
                            <th className="text-left px-3 py-2 font-bold text-amber-700 dark:text-amber-400">Material</th>
                            <th className="text-center px-3 py-2 font-bold text-amber-700 dark:text-amber-400">Order Qty</th>
                            <th className="text-right px-3 py-2 font-bold text-amber-700 dark:text-amber-400">Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {data.replenishment_plan.map((item: ReplenishmentItem, i) => (
                            <tr key={item.id} className={i % 2 === 0 ? "" : "bg-amber-50/30 dark:bg-amber-900/5"}>
                              <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{item.name}</td>
                              <td className="px-3 py-2 text-center text-purple-600 dark:text-purple-400 font-bold">
                                {item.suggested_qty} {item.unit}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-white">
                                ₹{item.estimated_cost.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                            <td colSpan={2} className="px-3 py-2 text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wide">Total</td>
                            <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-400">
                              ₹{s!.replenishment_est_cost.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </section>

              {/* ── D: Inventory Velocity + bar chart ── */}
              <section className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <TrendingUp size={18} className="text-purple-600"/>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white flex-1">Inventory Velocity <span className="text-xs font-normal text-gray-400">(30-day)</span></h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2">Days of stock remaining at current consumption rate</p>

                {data.velocity.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                    <BarChart2 size={36} className="opacity-30"/>
                    <p className="text-sm">No transaction data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bar chart — days remaining */}
                    <MiniBarChart
                      items={data.velocity as unknown as Record<string, unknown>[]}
                      valueKey="days_remaining"
                      labelKey="name"
                      colorFn={item => RISK_COLOR[(item as unknown as VelocityItem).risk] ?? "#10b981"}
                      unit="d"
                    />
                    {/* Risk legend */}
                    <div className="flex flex-wrap gap-3 text-[10px]">
                      {[
                        { risk: "HIGH",   color: "#ef4444", label: "High Risk (≤7d)"  },
                        { risk: "MEDIUM", color: "#f59e0b", label: "Medium (≤14d)"    },
                        { risk: "LOW",    color: "#3b82f6", label: "Low (≤30d)"       },
                        { risk: "STABLE", color: "#10b981", label: "Stable"           },
                      ].map(r => (
                        <div key={r.risk} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}/>
                          <span className="text-gray-500">{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* ══ 4. CIVI AI REPORT — below the grid ═══════
                Purple-themed, with disclaimer, no model name
            ═══════════════════════════════════════════════ */}
            <div>
              {/* Section label */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/50" />
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2">
                  Civi AI Report
                </span>
                <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/50" />
              </div>

              <div className="rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm">
                {/* Report header */}
                <div className="px-6 py-4 flex items-center justify-between gap-4"
                  style={{ background: "linear-gradient(90deg, #581c87 0%, #7c3aed 100%)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <CiviAIIcon size={22} animated className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base leading-tight">Civi AI Analysis Report</p>
                      <p className="text-purple-200 text-xs mt-0.5">
                        By Civitas Atlas Technologies Pvt. Ltd., Pune
                      </p>
                    </div>
                  </div>
                  <button onClick={handleExportPdf} disabled={pdfLoading || !ai?.available}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-purple-800
                               hover:bg-purple-50 text-sm font-bold transition disabled:opacity-40 shrink-0">
                    {pdfLoading ? <Loader2 size={13} className="animate-spin"/> : <FileDown size={13}/>}
                    Export PDF
                  </button>
                </div>

                {/* Disclaimer banner */}
                <div className="flex items-start gap-3 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                  <Info size={14} className="text-purple-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                    <strong>Disclaimer:</strong> This AI-generated report is for study and evaluation purposes only.
                    Always verify recommendations against actual inventory data and consult your team before making
                    critical procurement or manufacturing decisions. Civi AI analyses data patterns — human judgment
                    remains essential.
                  </p>
                </div>

                {/* Report body */}
                <div className="p-6 bg-white dark:bg-gray-900">
                  {!ai ? (
                    <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
                      <Loader2 size={28} className="animate-spin text-purple-400"/>
                      <p className="text-sm">Generating AI analysis…</p>
                    </div>
                  ) : ai.available && ai.narrative ? (
                    <AINarrative narrative={ai.narrative} />
                  ) : (
                    <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
                      <CiviAIIcon size={40} animated={false} className="text-purple-300 opacity-60"/>
                      <p className="text-sm font-medium">AI narrative not available</p>
                      <p className="text-xs text-center text-gray-500 max-w-sm">
                        {ai.error
                          ? `Error: ${ai.error}`
                          : "Check that GROQ_API_KEY is set in backend/.env and the backend server is running."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Report footer */}
                <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800
                                flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400">
                  <span>© Civitas Atlas Technologies Pvt. Ltd., Pune, India</span>
                  <span>S2R2 Inventory Management System · Civi AI</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
