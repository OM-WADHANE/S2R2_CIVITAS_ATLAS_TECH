// lib/notifications.ts
// Shared notification store — fetches /api/intelligence once per session
// and exposes alert count + alert list to any component that needs it.
// Used by: Header (badge count), AppShell (popup), notifications/page.tsx

"use client";

export interface StockNotification {
  id:        number;
  name:      string;
  urgency:   "CRITICAL" | "HIGH" | "MEDIUM";
  category:  string;
  current:   number;
  min:       number;
  unit:      string;
  supplier:  string | null;
  type:      "raw_material";
}

// Module-level cache — one fetch per browser session
let _cache:   StockNotification[] | null = null;
let _promise: Promise<StockNotification[]> | null = null;

export function clearNotificationCache() {
  _cache   = null;
  _promise = null;
}

export async function fetchNotifications(): Promise<StockNotification[]> {
  if (_cache)   return _cache;
  if (_promise) return _promise;

  _promise = fetch("/api/intelligence", {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${
        typeof window !== "undefined"
          ? localStorage.getItem("s2r2_token") || ""
          : ""
      }`,
    },
  })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (!data?.reorder_alerts) return [];
      const alerts: StockNotification[] = data.reorder_alerts.map(
        (a: {
          id: number; name: string; urgency: string;
          category: string; current_qty: number; min_stock: number;
          unit: string; supplier: string | null;
        }) => ({
          id:       a.id,
          name:     a.name,
          urgency:  a.urgency as StockNotification["urgency"],
          category: a.category,
          current:  a.current_qty,
          min:      a.min_stock,
          unit:     a.unit,
          supplier: a.supplier,
          type:     "raw_material" as const,
        })
      );
      _cache = alerts;
      return alerts;
    })
    .catch(() => []);

  return _promise;
}
