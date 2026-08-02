"use client";
// components/Header.tsx
// Floating rounded header — hides on scroll-down, reveals on scroll-up.
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, ChevronLeft, ChevronRight, Moon, Sun,
  UserCircle, ChevronDown, LogOut,
} from "lucide-react";
import { logout } from "@/lib/api";

interface HeaderProps {
  sidebarOpen:       boolean;
  sidebarCollapsed:  boolean;
  onMenuToggle:      () => void;
  onSidebarCollapse: () => void;
}

export default function Header({
  sidebarOpen,
  sidebarCollapsed,
  onMenuToggle,
  onSidebarCollapse,
}: HeaderProps) {
  const router = useRouter();
  const [dark,     setDark]     = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [username, setUsername] = useState("User");
  const [role,     setRole]     = useState("");

  // ── hide / show on scroll ──────────────────────────────────
  const [visible,  setVisible]  = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      // Always show when near the top
      if (currentY < 60) { setVisible(true); lastY.current = currentY; return; }
      // Scrolling down → hide; scrolling up → show
      setVisible(currentY < lastY.current);
      lastY.current = currentY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem("s2r2_theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setUsername(localStorage.getItem("s2r2_username") || "User");
    setRole(localStorage.getItem("s2r2_role") || "");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("s2r2_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  function handleLogout() {
    setUserOpen(false);
    logout();
    router.push("/login");
  }

  return (
    // Outer wrapper: fixed positioning + spacing from all edges
    <div
      className={[
        "fixed top-3 left-3 right-3 z-40",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-[calc(100%+16px)]",
      ].join(" ")}
    >
      <header
        className="rounded-2xl shadow-lg"
        style={{
          background: "linear-gradient(90deg, #1e40af 0%, #0369a1 60%, #0891b2 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">

          {/* ── Left: toggle controls + logo ─────────────── */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-xl hover:bg-white/15 text-white transition"
              aria-label="Toggle menu"
            >
              <Menu size={19} />
            </button>

            {/* Collapse toggle — desktop only */}
            <button
              onClick={onSidebarCollapse}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl hover:bg-white/15 text-white transition"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed
                ? <ChevronRight size={15} />
                : <ChevronLeft  size={15} />}
            </button>

            {/* Logo */}
            <div className="brand-logo" role="img" aria-label="S2R2 Logo" />
          </div>

          {/* ── Centre: title ──────────────────────────────── */}
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-white font-bold truncate text-sm md:text-base leading-tight tracking-tight">
              Inventory Management System
            </h1>
            <p className="text-white/55 text-[11px] hidden md:block">S2R2 Technologies</p>
          </div>

          {/* ── Right: theme + user ────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dark / light toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark
                ? <Sun  size={15} className="text-yellow-300" />
                : <Moon size={15} className="text-white" />}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setUserOpen(v => !v); }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20
                           rounded-xl px-2.5 py-1.5 text-white transition"
                aria-haspopup="true"
                aria-expanded={userOpen}
              >
                <UserCircle size={19} />
                <span className="hidden md:inline text-sm font-semibold capitalize max-w-24 truncate">
                  {username}
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div className="fixed inset-0 z-[60]" onClick={() => setUserOpen(false)} />

                  {/* Dropdown panel */}
                  <div
                    className="absolute right-0 mt-2 w-52 z-[70]
                               bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
                               border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-900/60">
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {username}
                      </p>
                      {role && (
                        <span
                          className="inline-block mt-1 text-[10px] font-semibold uppercase
                                     tracking-wider px-2 py-0.5 rounded-full
                                     bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                        >
                          {role}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                   text-red-600 dark:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-900/20
                                   transition font-medium"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </header>
    </div>
  );
}
