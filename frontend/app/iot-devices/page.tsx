"use client";
export const dynamic = "force-dynamic";
// app/iot-devices/page.tsx
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { getIoTDevices, createIoTDevice, updateIoTDevice, deleteIoTDevice, pingIoTDevice } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { IoTDevice, IoTDeviceStatus } from "@/types";
import { Search, Cpu, X, PlusCircle, Wifi, WifiOff, Wrench, RefreshCw } from "lucide-react";

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: IoTDeviceStatus }) {
  const map: Record<IoTDeviceStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    ONLINE:      { cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",  icon: <Wifi   size={11}/>, label: "Online"      },
    OFFLINE:     { cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",          icon: <WifiOff size={11}/>,label: "Offline"     },
    MAINTENANCE: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",  icon: <Wrench  size={11}/>,label: "Maintenance" },
  };
  const { cls, icon, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon}{label}
    </span>
  );
}

// ── Empty form ────────────────────────────────────────────────
const EMPTY: Partial<IoTDevice> = {
  deviceId: "", name: "", type: "", location: "", status: "ONLINE",
};

export default function IoTDevicesPage() {
  const { canAdd, canEdit, canDelete } = usePermissions("iot-device");
  const [devices,  setDevices]  = useState<IoTDevice[]>([]);
  const [filtered, setFiltered] = useState<IoTDevice[]>([]);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState<IoTDeviceStatus | "">("");
  const [loading,  setLoading]  = useState(true);
  const [pinging,  setPinging]  = useState<number | null>(null);
  const [modal,    setModal]    = useState<Partial<IoTDevice> | null>(null);
  const [isNew,    setIsNew]    = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const { devices } = await getIoTDevices();
      setDevices(devices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(devices.filter(d => {
      const hay = `${d.name} ${d.deviceId} ${d.type ?? ""} ${d.location ?? ""}`.toLowerCase();
      return (!q || hay.includes(q)) && (!status || d.status === status);
    }));
  }, [devices, search, status]);

  function openAdd()               { setIsNew(true);  setModal({ ...EMPTY }); }
  function openEdit(d: IoTDevice)  { setIsNew(false); setModal({ ...d }); }
  function closeModal()            { setModal(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    if (isNew) {
      await createIoTDevice(modal);
    } else {
      await updateIoTDevice(modal.id!, modal);
    }
    closeModal();
    fetchDevices();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this device?")) return;
    await deleteIoTDevice(id);
    fetchDevices();
  }

  async function handlePing(id: number) {
    setPinging(id);
    try {
      await pingIoTDevice(id);
      fetchDevices();
    } finally {
      setPinging(null);
    }
  }

  // ── counts ───────────────────────────────────────────────────
  const online      = devices.filter(d => d.status === "ONLINE").length;
  const offline     = devices.filter(d => d.status === "OFFLINE").length;
  const maintenance = devices.filter(d => d.status === "MAINTENANCE").length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Cpu size={24} className="text-blue-600" /> IoT Devices
          </h2>
          <p className="text-gray-500 text-sm">Monitor, register, and manage connected devices</p>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total",       value: devices.length, cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"     },
            { label: "Online",      value: online,         cls: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"  },
            { label: "Offline",     value: offline,        cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"          },
            { label: "Maintenance", value: maintenance,    cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"  },
          ].map(s => (
            <div key={s.label} className={`px-4 py-2 rounded-lg text-sm font-medium ${s.cls}`}>
              {s.label}: <strong>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, device ID, type or location…"
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as IoTDeviceStatus | "")}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              <PlusCircle size={14} /> Add Device
            </button>
          </div>
        </div>

        {/* Device cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Cpu size={64} className="mx-auto mb-4 opacity-30" />
            <p>No devices found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => (
              <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{d.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{d.deviceId}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p><span className="text-gray-400">Type:</span> {d.type || "—"}</p>
                  <p><span className="text-gray-400">Location:</span> {d.location || "—"}</p>
                  <p><span className="text-gray-400">Last ping:</span>{" "}
                    {d.lastPing ? new Date(d.lastPing).toLocaleString() : "Never"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(d)}
                      className="py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handlePing(d.id)}
                    disabled={pinging === d.id}
                    className={`py-1.5 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1 ${canEdit ? "" : "col-span-2"}`}
                  >
                    {pinging === d.id ? <RefreshCw size={10} className="animate-spin" /> : <Wifi size={10} />}
                    Ping
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="py-1.5 rounded bg-red-100 text-red-600 text-xs hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b dark:border-gray-700 font-semibold text-sm bg-gray-50 dark:bg-gray-900">
            Device Table
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                <tr>
                  {["ID","Device ID","Name","Type","Location","Status","Last Ping","Actions"].map(h => (
                    <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2">{d.id}</td>
                    <td className="px-3 py-2 font-mono">{d.deviceId}</td>
                    <td className="px-3 py-2 font-medium">{d.name}</td>
                    <td className="px-3 py-2">{d.type || "—"}</td>
                    <td className="px-3 py-2">{d.location || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2">{d.lastPing ? new Date(d.lastPing).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 flex gap-2">
                      {canEdit && <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline">Edit</button>}
                      {canEdit && <span className="text-gray-300">|</span>}
                      <button onClick={() => handlePing(d.id)} className="text-emerald-600 hover:underline">Ping</button>
                      {canDelete && <span className="text-gray-300">|</span>}
                      {canDelete && <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg text-gray-800 dark:text-white">
                {isNew ? "Register Device" : "Edit Device"}
              </h4>
              <button onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Device ID <span className="text-red-500">*</span></label>
                <input
                  value={modal.deviceId ?? ""}
                  onChange={e => setModal({ ...modal, deviceId: e.target.value })}
                  placeholder="e.g. DEV-001"
                  required
                  disabled={!isNew}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm dark:bg-gray-800 dark:border-gray-700 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Name <span className="text-red-500">*</span></label>
                <input
                  value={modal.name ?? ""}
                  onChange={e => setModal({ ...modal, name: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Type</label>
                <input
                  value={modal.type ?? ""}
                  onChange={e => setModal({ ...modal, type: e.target.value })}
                  placeholder="e.g. Temperature Sensor"
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Location</label>
                <input
                  value={modal.location ?? ""}
                  onChange={e => setModal({ ...modal, location: e.target.value })}
                  placeholder="e.g. Warehouse A"
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <select
                  value={modal.status ?? "ONLINE"}
                  onChange={e => setModal({ ...modal, status: e.target.value as IoTDeviceStatus })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                  {isNew ? "Register" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
