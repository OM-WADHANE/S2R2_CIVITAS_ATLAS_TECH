"use client";
// app/page.tsx — Dashboard
import { useEffect, useState, useCallback } from "react";
import AppShell  from "@/components/AppShell";
import StatCard  from "@/components/ui/StatCard";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/types";
import { Truck, Box, Users, AlertTriangle, Search, Activity, User } from "lucide-react";

// ── action colour map ──────────────────────────────────────────
const ACTION_STYLES: Record<string, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  updated: "bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400",
  deleted: "bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400",
};
const MODULE_BORDER: Record<string, string> = {
  raw_material:      "border-blue-500",
  finished_product:  "border-emerald-500",
  client:            "border-purple-500",
  iot_device:        "border-amber-500",
};

export default function DashboardPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

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
  const maxVal   = Math.max(...(stats?.stock_movement?.values ?? [1]), 1);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ── Page heading ─────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
            <p className="text-gray-500 text-sm">Live stats — auto-refreshes every 15 seconds</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules or quick links…"
              className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm
                         focus:ring-2 focus:ring-blue-500 focus:outline-none
                         dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard href="/raw-materials"     label="Raw Materials"
              value={raw?.total_items ?? 0}
              sub={`Stock Value: ₹${(raw?.total_stock_value ?? 0).toLocaleString()}`}
              subColor="text-emerald-600" icon={Truck}         iconBg="bg-amber-50 dark:bg-amber-900/20"    iconColor="text-amber-600 dark:text-amber-400" />
            <StatCard href="/finished-products" label="Finished Products"
              value={finished?.total_products ?? 0}
              sub={`Stock Value: ₹${(finished?.total_stock_value ?? 0).toLocaleString()}`}
              subColor="text-purple-600" icon={Box}            iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
            <StatCard href="/clients"           label="Clients"
              value={clients?.total_clients ?? 0}
              sub={`New this month: ${clients?.new_this_month ?? 0}`}
              subColor="text-sky-600" icon={Users}             iconBg="bg-sky-50 dark:bg-sky-900/20"         iconColor="text-sky-600 dark:text-sky-400" />
            <StatCard                           label="Low Stock Alerts"
              value={stats?.low_stock_alerts?.length ?? 0}
              sub="Items below minimum threshold"
              subColor="text-red-600" icon={AlertTriangle}     iconBg="bg-red-50 dark:bg-red-900/20"         iconColor="text-red-600 dark:text-red-400" />
          </div>
        )}

        {/* ── Summary bar ──────────────────────────────────── */}
        {stats && (
          <div className="card px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
            <strong>Summary:</strong>{" "}
            Raw materials <strong>{raw?.total_items ?? 0}</strong> items · stock value <strong>₹{(raw?.total_stock_value ?? 0).toLocaleString()}</strong> ({raw?.low_stock_count ?? 0} low),{" "}
            finished products <strong>{finished?.total_products ?? 0}</strong> · stock value <strong>₹{(finished?.total_stock_value ?? 0).toLocaleString()}</strong>,{" "}
            clients <strong>{clients?.total_clients ?? 0}</strong> ({clients?.new_this_month ?? 0} new this month).
          </div>
        )}

        {/* ── Three-column grid ────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Quick Actions + Stock Bars */}
          <section className="card p-5">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { href: "/raw-materials",     label: "Raw Materials",     cls: "bg-blue-50    text-blue-700    dark:bg-blue-900/30    dark:text-blue-300"    },
                { href: "/finished-products", label: "Finished Products", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
                { href: "/clients",           label: "Clients",           cls: "bg-purple-50  text-purple-700  dark:bg-purple-900/30  dark:text-purple-300"  },
                { href: "/reports",           label: "Reports",           cls: "bg-amber-50   text-amber-700   dark:bg-amber-900/30   dark:text-amber-300"   },
                { href: "/iot-devices",       label: "IoT Devices",       cls: "bg-cyan-50    text-cyan-700    dark:bg-cyan-900/30    dark:text-cyan-300"    },
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
                const width = Math.max(4, (val / maxVal) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>{label}</span>
                      <span className="font-semibold">{val}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                           style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Low Stock Alerts */}
          <section className="card p-5">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Low Stock Alerts
            </h3>
            <div className="space-y-2">
              {stats?.low_stock_alerts?.length ? (
                stats.low_stock_alerts.map(item => (
                  <div key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl
                               bg-red-50 dark:bg-red-900/10
                               border border-red-100 dark:border-red-900/30">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Min: {item.min_stock} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-gray-400">{item.unit}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All stock levels OK</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity — now shows WHO did each action */}
          <section className="card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-blue-500" /> Recent Activity
              </h3>
              <a href="/reports"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all →
              </a>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
              {stats?.recent_activity?.length ? (
                stats.recent_activity.map((item, i) => {
                  const borderCls = MODULE_BORDER[item.module] ?? "border-gray-400";
                  const actionCls = ACTION_STYLES[item.action] ?? "bg-gray-100 text-gray-600";
                  return (
                    <div key={i}
                      className={`border-l-4 ${borderCls} pl-3 py-1`}>
                      {/* Top row: module + action badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
                          {item.module.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${actionCls}`}>
                          {item.action}
                        </span>
                      </div>
                      {/* Label */}
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-0.5">
                        {item.label}
                      </p>
                      {/* Who + when */}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          <User size={10} />
                          {item.username}
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
      </div>
    </AppShell>
  );
}
