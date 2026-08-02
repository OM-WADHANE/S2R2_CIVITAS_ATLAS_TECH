// lib/permissions.ts
// Shared permission hook — reads role + saved permission matrix from localStorage.
// Used by every page to decide whether to show/hide add, edit, delete buttons.

"use client";
import { useMemo } from "react";

// ── Feature keys must match the "feature" strings in admin/page.tsx ──────────
export type PermFeature =
  | "View Dashboard & Reports"
  | "View Activity Log"
  | "Export CSV / Excel / PDF"
  | "Add Raw Materials"
  | "Edit Raw Materials"
  | "Delete Raw Materials"
  | "Add Finished Products"
  | "Edit Finished Products"
  | "Delete Finished Products"
  | "Add / Edit Clients"
  | "Import Clients (Excel)"
  | "Delete Clients"
  | "Add / Edit IoT Devices"
  | "Delete IoT Devices"
  | "Manage Users";

interface PermRow {
  feature: string;
  admin:   boolean;
  editor:  boolean;
  viewer:  boolean;
}

const DEFAULT_PERMS: PermRow[] = [
  { feature: "View Dashboard & Reports",  admin: true,  editor: true,  viewer: true  },
  { feature: "View Activity Log",         admin: true,  editor: true,  viewer: true  },
  { feature: "Export CSV / Excel / PDF",  admin: true,  editor: true,  viewer: true  },
  { feature: "Add Raw Materials",         admin: true,  editor: true,  viewer: false },
  { feature: "Edit Raw Materials",        admin: true,  editor: true,  viewer: false },
  { feature: "Delete Raw Materials",      admin: true,  editor: false, viewer: false },
  { feature: "Add Finished Products",     admin: true,  editor: true,  viewer: false },
  { feature: "Edit Finished Products",    admin: true,  editor: true,  viewer: false },
  { feature: "Delete Finished Products",  admin: true,  editor: false, viewer: false },
  { feature: "Add / Edit Clients",        admin: true,  editor: true,  viewer: false },
  { feature: "Import Clients (Excel)",    admin: true,  editor: true,  viewer: false },
  { feature: "Delete Clients",            admin: true,  editor: false, viewer: false },
  { feature: "Add / Edit IoT Devices",    admin: true,  editor: false, viewer: false },
  { feature: "Delete IoT Devices",        admin: true,  editor: false, viewer: false },
  { feature: "Manage Users",              admin: true,  editor: false, viewer: false },
];

function getRole(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("s2r2_role") || "";
}

function getMatrix(): PermRow[] {
  if (typeof window === "undefined") return DEFAULT_PERMS;
  try {
    const s = localStorage.getItem("s2r2_permissions");
    return s ? JSON.parse(s) : DEFAULT_PERMS;
  } catch {
    return DEFAULT_PERMS;
  }
}

/**
 * Returns true if the current user has the given permission.
 * ADMIN always returns true for everything.
 * EDITOR/VIEWER check the saved matrix.
 */
export function can(feature: PermFeature): boolean {
  const role   = getRole();
  if (role === "ADMIN") return true;
  const matrix = getMatrix();
  const row    = matrix.find(r => r.feature === feature);
  if (!row) return false;
  if (role === "EDITOR") return row.editor;
  return row.viewer; // VIEWER or USER
}

/**
 * usePermissions — React hook that returns permission flags for a given module.
 * Re-reads from localStorage on every render so changes in Admin Panel
 * take effect immediately without a page reload.
 */
export function usePermissions(module: "raw-material" | "finished-product" | "client" | "iot-device") {
  return useMemo(() => {
    const role = getRole();
    const isAdmin = role === "ADMIN";

    // Map module → feature names
    const featureMap: Record<typeof module, {
      add:    PermFeature;
      edit:   PermFeature;
      delete: PermFeature;
      export: PermFeature;
    }> = {
      "raw-material": {
        add:    "Add Raw Materials",
        edit:   "Edit Raw Materials",
        delete: "Delete Raw Materials",
        export: "Export CSV / Excel / PDF",
      },
      "finished-product": {
        add:    "Add Finished Products",
        edit:   "Edit Finished Products",
        delete: "Delete Finished Products",
        export: "Export CSV / Excel / PDF",
      },
      "client": {
        add:    "Add / Edit Clients",
        edit:   "Add / Edit Clients",
        delete: "Delete Clients",
        export: "Export CSV / Excel / PDF",
      },
      "iot-device": {
        add:    "Add / Edit IoT Devices",
        edit:   "Add / Edit IoT Devices",
        delete: "Delete IoT Devices",
        export: "Export CSV / Excel / PDF",
      },
    };

    const f = featureMap[module];

    return {
      isAdmin,
      role,
      canAdd:    can(f.add),
      canEdit:   can(f.edit),
      canDelete: can(f.delete),
      canExport: can(f.export),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally no deps — reads fresh on each render via localStorage
}
