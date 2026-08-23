"use client";
export const dynamic = "force-dynamic";
// app/page.tsx — Dashboard with 4 tabs
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import StatCard  from "@/components/ui/StatCard";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats, InventoryTransaction } from "@/types";
import {
  Truck, Box, Users, AlertTriangle, Activity, User,
  BarChart2, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Factory, ShoppingCart, Layers, CheckCircle2, XCircle,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────
const ACTION_STYLES: Record<string, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  updated: "bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400",
  deleted: "bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400",
};
const MODULE_BORDER: Record<string, string> = {
  raw_material:     "border-blue-500",
  finished_product: "border-emerald-500",
  client:           "border-purple-500",
  iot_device:       "border-amber-500",
};
const TX_ICON: Record<string, React.ReactNode> = {
  INWARD:      <ArrowDownCircle size={14} className="text-emerald-500" />,
  OUTWARD:     <ArrowUpCircle   size={14} className="text-red-500"     />,
  MANUFACTURE: <Factory         size={14} className="text-blue-500"    />,
};
const TX_COLOR: Record<string, string> = {
  INWARD:      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  OUTWARD:     "bg-red-50     dark:bg-red-900/20     border-red-200     dark:border-red-800",
  MANUFACTURE: "bg-blue-50    dark:bg-blue-900/20    border-blue-200    dark:border-blue-800",
};

type Tab = "realtime" | "alerts" | "cost" | "issuances";

export default function DashboardPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("realtime");
  const [role,    setRole]    = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("s2r2_role") || "");
  }, []);

  const fetchStats = useCallback(async () => {
    try   { setStats(await getDashboardStats()); }
    catch (err) { console.error("Dashboard stats error:", err); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const raw      = stats?.raw_materials;
  const finished = stats?.finished_products;
  const clients  = stats?.clients;
  const iot      = stats?.iot_devices;
  const mfg      = stats?.manufacture;
  const cost     = stats?.cost_analysis;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "realtime",  label: "Real-Time Stock",    icon: <Layers   size={14} /> },
    { id: "alerts",    label: "Low Stock Alerts",   icon: <AlertTriangle size={14} /> },
    ...(role !== "VIEWER" ? [{ id: "cost" as Tab, label: "Cost / Price", icon: <BarChart2 size={14} /> }] : []),
    { id: "issuances", label: "Recent Issuances",   icon: <Activity  size={14} /> },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ── Page heading ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-0.5">Live stats · auto-refreshes every 15 s</p>
          </div>
          {/* Manufacture quick-stats */}
          {mfg && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold">
                <Factory size={12} /> {mfg.produced_today} produced today
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                <TrendingUp size={12} /> {mfg.produced_this_month} this month
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold">
                <ShoppingCart size={12} /> {mfg.outward_this_month} dispatched
              </span>
            </div>
          )}
        </div>

        {/* ── Stat Cards ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard href="/raw-materials"
              label="Raw Materials"
              value={raw?.total_items ?? 0}
              sub={`Stock Value: ₹${(raw?.total_stock_value ?? 0).toLocaleString("en-IN")}`}
              subColor="text-emerald-600"
              icon={Truck}
              iconBg="bg-amber-50 dark:bg-amber-900/20"
              iconColor="text-amber-600 dark:text-amber-400" />
            <StatCard href="/finished-products"
              label="Finished Products"
              value={finished?.total_products ?? 0}
              sub={`Stock Value: ₹${(finished?.total_stock_value ?? 0).toLocaleString("en-IN")}`}
              subColor="text-purple-600"
              icon={Box}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600 dark:text-emerald-400" />
            <StatCard href="/clients"
              label="Clients"
              value={clients?.total_clients ?? 0}
              sub={`New this month: ${clients?.new_this_month ?? 0}`}
              subColor="text-sky-600"
              icon={Users}
              iconBg="bg-sky-50 dark:bg-sky-900/20"
              iconColor="text-sky-600 dark:text-sky-400" />
            <StatCard
              label="Low Stock Alerts"
              value={stats?.low_stock_alerts?.length ?? 0}
              sub="Items below minimum threshold"
              subColor="text-red-600"
              icon={AlertTriangle}
              iconBg="bg-red-50 dark:bg-red-900/20"
              iconColor="text-red-600 dark:text-red-400" />
          </div>
        )}

        {/* ── Tab bar ────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center",
                tab === t.id
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              ].join(" ")}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB 1 — REAL-TIME STOCK
        ══════════════════════════════════════════════════ */}
        {tab === "realtime" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Quick Actions + Stock Snapshot */}
            <section className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { href: "/raw-materials",     label: "Raw Materials",     cls: "bg-blue-50    text-blue-700    dark:bg-blue-900/30"    },
                  { href: "/finished-products", label: "Finished Products", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" },
                  { href: "/clients",           label: "Clients",           cls: "bg-purple-50  text-purple-700  dark:bg-purple-900/30"  },
                  { href: "/reports",           label: "Reports",           cls: "bg-amber-50   text-amber-700   dark:bg-amber-900/30"   },
                  { href: "/iot-devices",       label: "IoT Devices",       cls: "bg-cyan-50    text-cyan-700    dark:bg-cyan-900/30"    },
                ].map(({ href, label, cls }) => (
                  <a key={href} href={href}
                    className={`px-3 py-2 rounded-xl text-sm text-center font-semibold transition hover:opacity-80 ${cls}`}>
                    {label}
                  </a>
                ))}
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Stock Snapshot
              </h4>
              <div className="space-y-3">
                {(stats?.stock_movement?.labels ?? []).map((label, idx) => {
                  const val   = stats?.stock_movement?.values[idx] ?? 0;
                  const max   = Math.max(...(stats?.stock_movement?.values ?? [1]), 1);
                  const width = Math.max(4, (val / max) * 100);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{label}</span><span className="font-semibold">{val}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                             style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Raw Material stock status */}
            <section className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <Truck size={16} className="text-amber-500" /> Raw Material Status
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "In Stock", value: (raw?.total_items ?? 0) - (raw?.low_stock_count ?? 0) - (raw?.out_of_stock ?? 0), color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                  { label: "Low",      value: raw?.low_stock_count ?? 0, color: "text-amber-600",  bg: "bg-amber-50  dark:bg-amber-900/20"  },
                  { label: "Out",      value: raw?.out_of_stock    ?? 0, color: "text-red-600",    bg: "bg-red-50    dark:bg-red-900/20"    },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex justify-between"><span>Total items</span><span className="font-semibold">{raw?.total_items ?? 0}</span></div>
                <div className="flex justify-between"><span>Total qty</span><span className="font-semibold">{raw?.total_qty ?? 0}</span></div>
                <div className="flex justify-between"><span>Stock value</span><span className="font-semibold text-emerald-600">₹{(raw?.total_stock_value ?? 0).toLocaleString("en-IN")}</span></div>
              </div>
            </section>

            {/* Finished Product stock status */}
            <section className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <Box size={16} className="text-emerald-500" /> Finished Product Status
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Ready",  value: (finished?.total_products ?? 0) - (finished?.low_stock_count ?? 0) - (finished?.out_of_stock ?? 0), color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                  { label: "Low",    value: finished?.low_stock_count ?? 0, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                  { label: "Out",    value: finished?.out_of_stock    ?? 0, color: "text-red-600",   bg: "bg-red-50   dark:bg-red-900/20"  },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex justify-between"><span>Total products</span><span className="font-semibold">{finished?.total_products ?? 0}</span></div>
                <div className="flex justify-between"><span>Total qty</span><span className="font-semibold">{finished?.total_qty ?? 0}</span></div>
                <div className="flex justify-between"><span>Stock value</span><span className="font-semibold text-emerald-600">₹{(finished?.total_stock_value ?? 0).toLocaleString("en-IN")}</span></div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2 — LOW STOCK ALERTS
        ══════════════════════════════════════════════════ */}
        {tab === "alerts" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Alert cards */}
            <section className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Stock Alerts
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
                  {stats?.low_stock_alerts?.length ?? 0}
                </span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {stats?.low_stock_alerts?.length ? (
                  stats.low_stock_alerts.map(item => (
                    <div key={`${item.module}-${item.id}`}
                      className="flex items-center justify-between p-3 rounded-xl
                                 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {item.module.replace(/_/g, " ")} · Min: {item.min_stock} {item.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${item.quantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                          {item.quantity}
                        </p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-sm font-medium">All stock levels are healthy</p>
                  </div>
                )}
              </div>
            </section>

            {/* Stock decision support — visual green/red indicators */}
            <section className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <Factory size={16} className="text-blue-500" /> Manufacture Readiness
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Visual indicator — can you manufacture finished products right now?
              </p>
              <div className="space-y-3">
                {stats?.low_stock_alerts?.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">All materials in stock</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Manufacturing can proceed</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <XCircle size={22} className="text-red-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                        {stats?.low_stock_alerts?.length} material(s) below threshold
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Restock before manufacturing</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-xl font-black text-gray-800 dark:text-white">{mfg?.produced_this_month ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Produced this month</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-xl font-black text-gray-800 dark:text-white">{mfg?.outward_this_month ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Dispatched this month</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 3 — COST / PRICE ANALYSIS
        ══════════════════════════════════════════════════ */}
        {tab === "cost" && (
          <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Raw Material Value",     value: cost?.raw_material_total_value    ?? 0, color: "text-amber-600",   bg: "bg-amber-50   dark:bg-amber-900/20"   },
                { label: "Finished Product Value", value: cost?.finished_product_total_value ?? 0, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                { label: "Potential Revenue",      value: cost?.potential_revenue           ?? 0, color: "text-blue-600",    bg: "bg-blue-50    dark:bg-blue-900/20"    },
              ].map(s => (
                <div key={s.label} className={`card p-5 ${s.bg}`}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>
                    ₹{(s.value).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Top Raw Materials by value */}
              <section className="card p-5">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  <Truck size={16} className="text-amber-500" /> Top Raw Materials by Value
                </h3>
                <div className="space-y-2">
                  {cost?.top_raw_materials?.length ? (
                    cost.top_raw_materials.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.name}</span>
                            <span className="text-sm font-bold text-emerald-600 ml-2 shrink-0">₹{item.total_value.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>{item.quantity} {item.unit}</span>
                            <span>@₹{item.price.toLocaleString("en-IN")} each</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-gray-400 text-center py-6">No data</p>}
                </div>
              </section>

              {/* Top Finished Products by value */}
              <section className="card p-5">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  <Box size={16} className="text-emerald-500" /> Top Finished Products by Value
                </h3>
                <div className="space-y-2">
                  {cost?.top_finished_products?.length ? (
                    cost.top_finished_products.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.name}</span>
                            <span className="text-sm font-bold text-emerald-600 ml-2 shrink-0">₹{item.total_value.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>{item.qty} {item.unit}</span>
                            <span>@₹{item.price.toLocaleString("en-IN")} each</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-gray-400 text-center py-6">No data</p>}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 4 — RECENT ISSUANCES (transactions)
        ══════════════════════════════════════════════════ */}
        {tab === "issuances" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Transaction list */}
            <section className="xl:col-span-2 card p-5">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-blue-500" /> Recent Stock Movements
              </h3>
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {stats?.recent_transactions?.length ? (
                  (stats.recent_transactions as InventoryTransaction[]).map(tx => (
                    <div key={tx.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${TX_COLOR[tx.transactionType] ?? ""}`}>
                      <div className="shrink-0">{TX_ICON[tx.transactionType]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 dark:text-white truncate">{tx.itemName}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full
                            ${tx.transactionType === "INWARD"      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : tx.transactionType === "OUTWARD"     ? "bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"}`}>
                            {tx.transactionType}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase">{tx.itemType.replace("_", " ")}</span>
                        </div>
                        {tx.note && <p className="text-xs text-gray-500 mt-0.5 truncate">{tx.note}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold ${tx.quantity < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                          <User size={9} />{tx.performedBy}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Activity size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No transactions yet</p>
                    <p className="text-xs mt-1">Use Inward / Outward / Manufacture on Finished Products page</p>
                  </div>
                )}
              </div>
            </section>

            {/* Activity log */}
            <section className="card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-purple-500" /> Activity Log
                </h3>
                <a href="/reports" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  View all →
                </a>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                {stats?.recent_activity?.length ? (
                  stats.recent_activity.map((item, i) => {
                    const borderCls = MODULE_BORDER[item.module] ?? "border-gray-400";
                    const actionCls = ACTION_STYLES[item.action] ?? "bg-gray-100 text-gray-600";
                    return (
                      <div key={i} className={`border-l-4 ${borderCls} pl-3 py-1`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
                            {item.module.replace(/_/g, " ")}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${actionCls}`}>
                            {item.action}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-0.5">{item.label}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                            <User size={10} />{item.username}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(item.event_time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

      </div>
    </AppShell>
  );
}
