"use client";
// components/Header.tsx - Optimized with memoization
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Moon, Sun, UserCircle, ChevronDown, LogOut, Bell,
} from "lucide-react";
import { logout } from "@/lib/api";
import { fetchNotifications } from "@/lib/notifications";
import CiviAIIcon from "./CiviAIIcon";

interface HeaderProps {
  sidebarOpen:       boolean;
  sidebarCollapsed:  boolean;
  onMenuToggle:      () => void;
  onSidebarCollapse: () => void;
}

const Header = memo(function Header({
  sidebarOpen,
  sidebarCollapsed,
  onMenuToggle,
  onSidebarCollapse,
}: HeaderProps) {
  const router = useRouter();
  const [dark,       setDark]       = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [username,   setUsername]   = useState("User");
  const [role,       setRole]       = useState("");
  const [alertCount, setAlertCount] = useState(0);

  // ── hide / show on scroll ──────────────────────────────────
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) { setVisible(true); lastY.current = currentY; return; }
      setVisible(currentY < lastY.current);
      lastY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem("s2r2_theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setUsername(localStorage.getItem("s2r2_username") || "User");
    setRole(localStorage.getItem("s2r2_role") || "");

    // Fetch notification count for bell badge
    fetchNotifications()
      .then(alerts => setAlertCount(alerts.length))
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("s2r2_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }, [dark]);

  const handleLogout = useCallback(() => {
    setUserOpen(false);
    logout();
    router.push("/login");
  }, [router]);

  return (
    <div
      className={[
        "fixed top-3 left-3 right-3 z-40",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-[calc(100%+16px)]",
      ].join(" ")}
    >
      <header
        className="rounded-2xl shadow-lg relative"
        style={{
          background: "linear-gradient(90deg, #1e40af 0%, #0369a1 60%, #0891b2 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">

          {/* ── Left: Burger menu + logo ────────────── */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Animated Burger Menu Button - Always visible */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-xl hover:bg-white/15 text-white transition relative w-10 h-10 flex items-center justify-center"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <div className="relative w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                  sidebarOpen ? 'rotate-45 translate-y-1.5' : ''
                }`} />
                <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                  sidebarOpen ? 'opacity-0' : 'opacity-100'
                }`} />
                <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                  sidebarOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`} />
              </div>
            </button>
            <div className="brand-logo" role="img" aria-label="S2R2 Logo" />
          </div>

          {/* ── Centre: title ────────────────────────────── */}
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-white font-bold truncate text-sm md:text-base leading-tight tracking-tight">
              Inventory Management System
            </h1>
            <p className="text-white/55 text-[11px] hidden md:block">S2R2 Technologies</p>
          </div>

          {/* ── Right: theme + bell + user ───────────────── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dark / light toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn flex items-center justify-center"
              aria-label={dark ? "Light mode" : "Dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark
                ? <Sun  size={15} className="text-yellow-300" />
                : <Moon size={15} className="text-white" />}
            </button>

            {/* ── Notification bell ── */}
            <button
              onClick={() => router.push("/notifications")}
              className="relative p-2 rounded-xl hover:bg-white/15 text-white transition flex items-center justify-center"
              aria-label="Notifications"
              title="Stock alerts"
            >
              <Bell size={17} />
              {alertCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5
                             flex items-center justify-center
                             text-[9px] font-black text-white bg-red-500 rounded-full
                             border border-white/40 leading-none"
                >
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>

            {/* ── Ask Civi AI link ── */}
            <button
              onClick={() => router.push("/intelligence/chat")}
              className="relative p-2 rounded-lg hover:bg-white/15 text-white transition-all group flex items-center justify-center"
              aria-label="Ask Civi AI"
              title="Ask Civi AI Assistant"
            >
              <CiviAIIcon size={20} animated />
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
                  <div className="fixed inset-0 z-[60]" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 z-[70]
                                  bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
                                  border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-900/60">
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {username}
                      </p>
                      {role && (
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase
                                         tracking-wider px-2 py-0.5 rounded-full
                                         bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                          {role}
                        </span>
                      )}
                    </div>
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
});

export default Header;
