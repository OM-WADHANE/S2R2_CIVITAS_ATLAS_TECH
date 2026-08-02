// lib/api.ts — Centralised API client
// All fetch calls go through here so the auth header is always set.

const BASE = "/api"; // proxied by next.config.js → Express :4000

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("s2r2_token") || "";
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("s2r2_token");
    window.location.href = "/login";
    throw new Error("Unauthorised");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const data = await request<{ token: string; username: string; role: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) }
  );
  localStorage.setItem("s2r2_token",    data.token);
  localStorage.setItem("s2r2_username", data.username);
  localStorage.setItem("s2r2_role",     data.role);
  return data;
}

export function logout() {
  localStorage.removeItem("s2r2_token");
  localStorage.removeItem("s2r2_username");
  localStorage.removeItem("s2r2_role");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardStats = () =>
  request<import("../types").DashboardStats>("/dashboard/stats");

// ── Raw Materials ─────────────────────────────────────────────
export const getRawMaterials = (params = "") =>
  request<{ items: import("../types").RawMaterial[] }>(`/raw-materials${params ? "?" + params : ""}`);

export const createRawMaterial = (data: Partial<import("../types").RawMaterial>) =>
  request("/raw-materials", { method: "POST", body: JSON.stringify(data) });

export const updateRawMaterial = (id: number, data: Partial<import("../types").RawMaterial>) =>
  request(`/raw-materials/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteRawMaterial = (id: number) =>
  request(`/raw-materials/${id}`, { method: "DELETE" });

// ── Finished Products ─────────────────────────────────────────
export const getFinishedProducts = (params = "") =>
  request<{ products: import("../types").FinishedProduct[] }>(`/finished-products${params ? "?" + params : ""}`);

export const createFinishedProduct = (data: Partial<import("../types").FinishedProduct>) =>
  request("/finished-products", { method: "POST", body: JSON.stringify(data) });

export const updateFinishedProduct = (id: number, data: Partial<import("../types").FinishedProduct>) =>
  request(`/finished-products/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteFinishedProduct = (id: number) =>
  request(`/finished-products/${id}`, { method: "DELETE" });

// ── Clients ───────────────────────────────────────────────────
export const getClients = (params = "") =>
  request<{ clients: import("../types").Client[] }>(`/clients${params ? "?" + params : ""}`);

export const createClient = (data: Partial<import("../types").Client>) =>
  request("/clients", { method: "POST", body: JSON.stringify(data) });

export const updateClient = (id: number, data: Partial<import("../types").Client>) =>
  request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteClient = (id: number) =>
  request(`/clients/${id}`, { method: "DELETE" });

export const importClients = (rows: Record<string, string>[]) =>
  request<{ created: number; skipped: number; errors: string[] }>(
    "/clients/import",
    { method: "POST", body: JSON.stringify({ rows }) }
  );

// ── IoT Devices ───────────────────────────────────────────────
export const getIoTDevices = (params = "") =>
  request<{ devices: import("../types").IoTDevice[] }>(`/iot-devices${params ? "?" + params : ""}`);

export const createIoTDevice = (data: Partial<import("../types").IoTDevice>) =>
  request("/iot-devices", { method: "POST", body: JSON.stringify(data) });

export const updateIoTDevice = (id: number, data: Partial<import("../types").IoTDevice>) =>
  request(`/iot-devices/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteIoTDevice = (id: number) =>
  request(`/iot-devices/${id}`, { method: "DELETE" });

export const pingIoTDevice = (id: number) =>
  request(`/iot-devices/${id}/ping`, { method: "PATCH" });

// ── Activity Log ──────────────────────────────────────────────
export const getActivity = (params = "") =>
  request<import("../types").ActivityResponse>(`/activity${params ? "?" + params : ""}`);

export const getActivityUsers = () =>
  request<{ users: string[] }>("/activity/users");

export const clearActivity = () =>
  request("/activity", { method: "DELETE" });

// ── User management (ADMIN only) ──────────────────────────────
export const getUsers = () =>
  request<{ users: import("../types").AppUser[] }>("/users");

export const getMe = () =>
  request<import("../types").AppUser>("/users/me");

export const createUser = (data: { username: string; password: string; role: string }) =>
  request<import("../types").AppUser>("/users", { method: "POST", body: JSON.stringify(data) });

export const updateUser = (id: number, data: { username?: string; role?: string; password?: string }) =>
  request<import("../types").AppUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteUser = (id: number) =>
  request(`/users/${id}`, { method: "DELETE" });
