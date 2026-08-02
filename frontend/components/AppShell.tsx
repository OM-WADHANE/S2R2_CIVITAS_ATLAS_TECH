"use client";
// components/AppShell.tsx — Auth guard + layout wrapper
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/api";
import Header  from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted,          setMounted]          = useState(false);

  // Auth guard — redirect before render
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setMounted(true);
    }
  }, [router]);

  // Restore sidebar collapse preference
  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("s2r2-sidebar-collapsed") === "1");
  }, []);

  function handleCollapse() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("s2r2-sidebar-collapsed", next ? "1" : "0");
  }

  // Avoid flash of authenticated content before redirect
  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={() => setSidebarOpen(v => !v)}
        onSidebarCollapse={handleCollapse}
      />
      {/* pt-20 offsets the fixed floating header (height ~56px + 12px top gap + 4px buffer) */}
      <div className="flex flex-1 pt-20">
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-5 md:p-7 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
