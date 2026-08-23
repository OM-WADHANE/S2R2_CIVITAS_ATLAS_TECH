"use client";
export const dynamic = "force-dynamic";
// app/notifications/page.tsx
// Not in the sidebar nav — accessed only via the bell icon in the header.
// Shows all stock alerts grouped by urgency with action links.
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { fetchNotifications, StockNotification } from "@/lib/notifications";
import {
  Bell, AlertTriangle, RefreshCw, ArrowRight,
  CheckCircle2, Package, Brain,
} from "lucide-react";

const URGENCY_CONFIG = {
  CRITICAL: {
    label:  "Critical",
    border: "border-l-4 border-red-500",
    bg:     "bg-red-50 dark:bg-red-900/10",
    badge:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot:    "bg-red-500",
    icon:   <AlertTriangle size={15} className="text-red-500 shrink-0" />,
  },
  HIGH: {
    label:  "High",
    border: "border-l-4 border-orange-500",
    bg:     "bg-orange-50 dark:bg-orange-900/10",
    badge:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dot:    "bg-orange-500",
    icon:   <AlertTriangle size={15} className="text-orange-500 shrink-0" />,
  },
  MEDIUM: {
    label:  "Medium",
    border: "border-l-4 border-amber-400",
    bg:     "bg-amber-50 dark:bg-amber-900/10",
    badge:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot:    "bg-amber-400",
    icon:   <AlertTriangle size={15} className="text-amber-500 shrink-0" />,
  },
} as const;

export default function NotificationsPage() {
  const [alerts,  setAlerts]  = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchNotifications();
    setAlerts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const critical = alerts.filter(a => a.urgency === "CRITICAL");
  const high     = alerts.filter(a => a.urgency === "HIGH");
  const medium   = alerts.filter(a => a.urgency === "MEDIUM");

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={22} className="text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Notifications
              </h2>
              {alerts.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700
                                 dark:bg-red-900/30 dark:text-red-400">
                  {alerts.length}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stock alerts for raw materials requiring immediate attention
            </p>
          </div>
          <button
            onClick={() => { import("@/lib/notifications").then(m => m.clearNotificationCache()); load(); }}
            className="btn-secondary gap-2 shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── All clear ───────────────────────────────────── */}
        {!loading && alerts.length === 0 && (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 size={48} className="text-emerald-400 opacity-70" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              All stock levels are healthy
            </p>
            <p className="text-sm text-gray-500">
              No raw materials are below or near minimum threshold.
            </p>
          </div>
        )}

        {/* ── Grouped alerts ──────────────────────────────── */}
        {!loading && alerts.length > 0 && (
          <div className="space-y-5">
            {(["CRITICAL", "HIGH", "MEDIUM"] as const).map(urgency => {
              const group  = urgency === "CRITICAL" ? critical
                           : urgency === "HIGH"     ? high
                           : medium;
              if (!group.length) return null;
              const cfg = URGENCY_CONFIG[urgency];

              return (
                <section key={urgency}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {cfg.label} Priority
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {group.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.map(alert => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-4 p-4 rounded-xl ${cfg.bg} ${cfg.border}`}
                      >
                        <div className="mt-0.5">{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {alert.name}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {alert.category}
                            </span>
                            {alert.supplier && (
                              <span className="text-xs text-gray-400">· {alert.supplier}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-1.5 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Current:{" "}
                              <strong className="text-red-600 dark:text-red-400">
                                {alert.current} {alert.unit}
                              </strong>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Min threshold:{" "}
                              <strong>{alert.min} {alert.unit}</strong>
                            </span>
                          </div>
                        </div>
                        <a
                          href="/raw-materials"
                          className="shrink-0 flex items-center gap-1 text-xs font-semibold
                                     text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          View <ArrowRight size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ── Action footer ───────────────────────────── */}
            <div className="card p-4 flex flex-col sm:flex-row items-center gap-3 justify-between
                            bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                <Brain size={16} className="shrink-0" />
                <span>
                  Get AI-powered replenishment suggestions and manufacture readiness analysis.
                </span>
              </div>
              <a
                href="/intelligence"
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold
                           gap-2 text-sm shrink-0"
              >
                <Package size={14} />
                Open Decision Intelligence
              </a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
