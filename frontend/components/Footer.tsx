// components/Footer.tsx
"use client";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      className="w-full shrink-0 border-t border-gray-200 dark:border-gray-800
                 bg-white dark:bg-gray-900"
    >
      <div
        className="max-w-7xl mx-auto px-6 py-4
                   flex flex-col md:flex-row md:items-center
                   justify-between gap-3"
      >
        {/* Left — product branding */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/s2r2-logo.png"
            alt="S2R2 Technologies"
            className="h-7 w-auto object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              S2R2 Inventory Management System
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              IoT &amp; Inventory Platform &nbsp;·&nbsp; Version&nbsp;1.0
            </p>
          </div>
        </div>

        {/* Centre — copyright */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
          &copy;&nbsp;{YEAR}&nbsp;S2R2 Technologies. All&nbsp;rights&nbsp;reserved.
        </p>

        {/* Right — developer credit */}
        <div className="text-right leading-tight">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">
            Software by
          </p>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Civitas Atlas Technologies Pvt. Ltd.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Pune, India
          </p>
        </div>
      </div>
    </footer>
  );
}
