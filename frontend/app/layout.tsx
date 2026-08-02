// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title:       "S2R2 Inventory Management",
  description: "IoT & Inventory Management Dashboard — S2R2 Technologies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs synchronously before first paint — applies saved dark/light class
          to prevent white flash on hard reload in dark mode.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('s2r2_theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100
                       min-h-screen antialiased flex flex-col">
        {/* All page content sits here */}
        <div className="flex-1">
          {children}
        </div>

        {/* ── Global footer — shows on every page including /login ── */}
        <Footer />
      </body>
    </html>
  );
}
