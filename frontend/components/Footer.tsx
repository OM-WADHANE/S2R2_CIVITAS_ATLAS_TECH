// components/Footer.tsx
// ─────────────────────────────────────────────────────────────
// Protected branding component.
// DO NOT alter BRAND_OWNER, BRAND_NAME, or the developer credit.
// This component verifies its own branding at runtime and shows a
// lock screen if ownership markers are removed or modified.
//
// Builder override: entering the builder key on the lock screen
// temporarily bypasses the lock so the team can restore the footer.
// ─────────────────────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, Mail, ShieldAlert } from "lucide-react";

// ── Protected ownership constants (DO NOT MODIFY) ────────────
const BRAND_NAME    = "S2R2 Inventory Management System";
const BRAND_OWNER   = "Civitas Atlas Technologies Pvt. Ltd.";
const BRAND_CITY    = "Pune, India";
const BRAND_EMAIL   = "civitasatlasco@gmail.com";
const BRAND_VERSION = "Version 1.0";

// Structural integrity check — precomputed length of joined constants.
// If any constant above is changed this will mismatch and the lock triggers.
const BRAND_CHECK_EXPECTED = 106; // do not change

// Builder override key — allows Civitas Atlas team to bypass lock
// and restore the footer without losing access to the app.
// This key is the same format as trial keys.
// Stored obfuscated: reverse of "11oC@satiiviC"
const _BK = ["C","i","v","i","t","a","s","@","C","o","1","1"].join("");

const YEAR = new Date().getFullYear();

export default function Footer() {
  const [tampered,  setTampered]  = useState(false);
  const [bypassed,  setBypassed]  = useState(false);
  const [bKey,      setBKey]      = useState("");
  const [showBKey,  setShowBKey]  = useState(false);
  const [bError,    setBError]    = useState("");
  const [bSuccess,  setBSuccess]  = useState(false);

  useEffect(() => {
    // Check if builder already bypassed this session
    if (sessionStorage.getItem("__ca_bypass") === "1") {
      setBypassed(true);
      return;
    }
    // Runtime integrity check
    const actual = [BRAND_NAME, BRAND_OWNER, BRAND_CITY, BRAND_EMAIL].join("|");
    if (
      actual.length !== BRAND_CHECK_EXPECTED ||
      !BRAND_OWNER.includes("Civitas Atlas") ||
      !BRAND_EMAIL.includes("civitasatlasco")
    ) {
      setTampered(true);
      console.error("[integrity] Footer branding tampered — lock screen active.");
    }
  }, []);

  function handleBuilderKey(e: React.FormEvent) {
    e.preventDefault();
    setBError("");
    if (bKey.trim() === _BK) {
      // Valid — grant session bypass, hide lock
      sessionStorage.setItem("__ca_bypass", "1");
      setBSuccess(true);
      setTimeout(() => {
        setTampered(false);
        setBypassed(true);
      }, 1500);
    } else {
      setBError("Invalid builder key. Contact civitasatlasco@gmail.com.");
    }
  }

  // ── Lock screen (shown when tampered AND not bypassed) ────
  if (tampered && !bypassed) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)" }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #f87171, transparent)" }} />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
        </div>

        <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6
                        border border-white/20 dark:border-gray-700/60">

          {/* Icon + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center
                            ring-4 ring-red-100 dark:ring-red-800">
              <ShieldAlert size={40} className="text-red-500 dark:text-red-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Application Locked
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Critical ownership branding has been deleted or modified.
                This application is the intellectual property of{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Civitas Atlas Technologies Pvt. Ltd.
                </span>
              </p>
            </div>
          </div>

          {/* Success state */}
          {bSuccess ? (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20
                            border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-300">
                <p className="font-semibold">Builder key accepted</p>
                <p className="text-xs mt-0.5">Restoring access — please fix the footer branding.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Error */}
              {bError && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400
                                bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                                rounded-xl px-4 py-3">
                  <span className="shrink-0">⚠️</span>
                  <span>{bError}</span>
                </div>
              )}

              {/* Builder key form */}
              <form onSubmit={handleBuilderKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400
                                    mb-1.5 uppercase tracking-wide">
                    Builder Override Key
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <KeyRound size={15} />
                    </div>
                    <input
                      type={showBKey ? "text" : "password"}
                      value={bKey}
                      onChange={e => setBKey(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter builder key"
                      className="form-input pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={showBKey ? "Hide key" : "Show key"}
                    >
                      {showBKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-6
                             rounded-xl font-bold text-sm text-white transition-all
                             active:scale-[0.98] shadow-lg shadow-blue-500/30"
                  style={{ background: "linear-gradient(90deg, #2563eb, #0ea5e9)" }}
                >
                  <KeyRound size={15} />
                  Unlock for Maintenance
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
              </div>

              {/* Contact */}
              <a
                href={`mailto:${BRAND_EMAIL}?subject=S2R2%20Integrity%20Violation%20%E2%80%94%20Footer%20Tampered&body=Hello%2C%0A%0AThe%20application%20is%20showing%20the%20integrity%20lock%20screen.%20Please%20assist.%0A%0AThank%20you.`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-6
                           rounded-xl font-semibold text-sm transition-all
                           border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Mail size={15} />
                Contact us at {BRAND_EMAIL}
              </a>
            </>
          )}

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            {BRAND_OWNER}
          </p>
        </div>
      </div>
    );
  }

  // ── Normal footer ─────────────────────────────────────────
  return (
    <footer
      className="w-full shrink-0 border-t border-gray-200 dark:border-gray-800
                 bg-white dark:bg-gray-900"
      data-owner="civitas-atlas"
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
              {BRAND_NAME}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              IoT &amp; Inventory Platform &nbsp;·&nbsp; {BRAND_VERSION}
            </p>
          </div>
        </div>

        {/* Centre — copyright */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
          &copy;&nbsp;{YEAR}&nbsp;Civitas Atlas Technologies Pvt. Ltd., Pune. All&nbsp;rights&nbsp;reserved.
        </p>

        {/* Right — developer credit (protected — do not remove) */}
        <div className="text-right leading-tight" data-protected="true">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">
            Software by
          </p>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {BRAND_OWNER}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {BRAND_CITY}
          </p>
        </div>
      </div>
    </footer>
  );
}
