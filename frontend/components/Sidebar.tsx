"use client";
// components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Truck, Box, Users,
  Cpu, BarChart2, ShieldCheck, X,
} from "lucide-react";

const BASE_NAV = [
  { href: "/",                  label: "Dashboard",         icon: LayoutDashboard, adminOnly: false },
  { href: "/raw-materials",     label: "Raw Materials",     icon: Truck,           adminOnly: false },
  { href: "/finished-products", label: "Finished Products", icon: Box,             adminOnly: false },
  { href: "/clients",           label: "Clients",           icon: Users,           adminOnly: false },
  { href: "/iot-devices",       label: "IoT Devices",       icon: Cpu,             adminOnly: false },
  { href: "/reports",           label: "Reports",           icon: BarChart2,       adminOnly: false },
  { href: "/admin",             label: "Admin Panel",       icon: ShieldCheck,     adminOnly: true  },
];

interface SidebarProps {
  open:      boolean;
  collapsed: boolean;
  onClose:   () => void;
}

export default function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("s2r2_role") || "");
  }, []);

  const NAV_ITEMS = BASE_NAV.filter(item => !item.adminOnly || role === "ADMIN");

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={[
          "app-sidebar p-3",
          open ? "open" : "",
          collapsed ? "collapsed" : "",
        ].join(" ")}
      >
        {/* Mobile close button only — no logo/title */}
        <div className="flex justify-end mb-3 px-1 md:hidden">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    title={label}
                    className={["nav-link", active ? "active" : ""].join(" ")}
                  >
                    <Icon
                      size={18}
                      className={`nav-icon shrink-0 mr-3 ${active ? "text-blue-600 dark:text-blue-400" : ""}`}
                    />
                    <span className="nav-label">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom version tag */}
        <div className="sidebar-title absolute bottom-4 left-0 right-0 px-4">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
            S2R2 IMS v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
