// types/index.ts — Shared TypeScript interfaces

export interface RawMaterial {
  id:          number;
  name:        string;
  category:    string;
  description: string;
  quantity:    number;
  unit:        string;
  supplier:    string;
  location:    string;
  minStock:    number;
  price:       number;
  status:      "active" | "low" | "out";
  lastUpdated: string;
}

export interface FinishedProduct {
  id:       number;
  name:     string;
  qty:      number;
  unit:     string;
  category: string;
  price:    number;   // unit price in ₹
  status:   "ACTIVE" | "HOLD";
}

export interface Client {
  id:          number;
  clientName:  string;
  companyName: string;
  phone:       string;
  email:       string;
  address:     string;
  gstNo:       string;
  status:      "ACTIVE" | "INACTIVE";
  createdAt:   string;
}

export interface DashboardStats {
  raw_materials: {
    total_items:       number;
    total_qty:         number;
    total_stock_value: number;
    low_stock_count:   number;
    out_of_stock:      number;
  };
  finished_products: {
    total_products:    number;
    total_qty:         number;
    total_stock_value: number;
    ready_stock:       number;
  };
  clients:     { total_clients: number; new_this_month: number };
  iot_devices: { total: number; online: number; offline: number; maintenance: number };
  low_stock_alerts:  { id: number; name: string; quantity: number; unit: string; min_stock: number }[];
  recent_activity:   { module: string; label: string; action: string; username: string; event_time: string }[];
  stock_movement:    { labels: string[]; values: number[] };
}

// ── User management ───────────────────────────────────────────
export type UserRole = "ADMIN" | "EDITOR" | "VIEWER";

export interface AppUser {
  id:        number;
  username:  string;
  role:      UserRole;
  createdAt: string;
  updatedAt?: string;
}

// ── IoT Devices ───────────────────────────────────────────────
export type IoTDeviceStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export interface IoTDevice {
  id:        number;
  deviceId:  string;
  name:      string;
  type:      string | null;
  location:  string | null;
  status:    IoTDeviceStatus;
  lastPing:  string | null;
  metadata:  Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Activity Log ──────────────────────────────────────────────
export type ActivityModule = "raw_material" | "finished_product" | "client" | "iot_device";
export type ActivityAction = "created" | "updated" | "deleted";

export interface ActivityLog {
  id:        number;
  module:    ActivityModule;
  label:     string;
  action:    ActivityAction;
  username:  string;
  eventTime: string;
}

export interface ActivityResponse {
  logs: ActivityLog[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
