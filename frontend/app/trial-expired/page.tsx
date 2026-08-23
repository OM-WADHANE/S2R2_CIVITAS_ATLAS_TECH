"use client";
export const dynamic = "force-dynamic";
// app/trial-expired/page.tsx
// Shown when the backend returns HTTP 402 TRIAL_EXPIRED.
// Users enter the license key here. On success the in-memory expiry is
// extended server-side — NO data is reset or deleted.

import { useState } from "react";
import { ShieldAlert, Mail, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const CONTACT_EMAIL = "civitasatlasco@gmail.com";
const COMPANY_NAME  = "Civitas Atlas Technologies Pvt. Ltd.";

export default function TrialExpiredPage() {
  const [key,     setKey]     = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<{
    plan: string; expiredOn: string | null; daysRemaining: number | null;
  } | null>(null);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Call the activation endpoint directly — it is always exempt from the trial guard
      const res  = await fetch("/api/trial/activate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: key.trim(), plan: "30d" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid license key. Please try again.");
        return;
      }

      // Clear any trial-expired flags from localStorage
      localStorage.removeItem("s2r2_trial_expired");
      localStorage.removeItem("s2r2_trial_unlocked");

      setSuccess({
        plan:          data.label || data.plan,
        expiredOn:     data.expiredOn,
        daysRemaining: data.daysRemaining,
      });
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f87171, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6
                        border border-white/20 dark:border-gray-700/60 backdrop-blur-sm">

          {/* Icon + heading — always visible */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center
                            ring-4 ring-red-100 dark:ring-red-800">
              <ShieldAlert size={40} className="text-red-500 dark:text-red-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Evaluation Period Ended
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Your trial license for{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">S2R2 Inventory</span>{" "}
                has expired.
              </p>
            </div>
          </div>

          {/* ── SUCCESS STATE ── */}
          {success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20
                              border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-300">
                  <p className="font-semibold">License key accepted — access restored</p>
                  {success.expiredOn ? (
                    <p className="text-xs mt-0.5 text-green-700 dark:text-green-400">
                      Plan: <span className="font-medium uppercase">{success.plan}</span>
                      {" · "}Expires: <span className="font-medium">{success.expiredOn}</span>
                      {success.daysRemaining !== null && ` · ${success.daysRemaining} day(s) remaining`}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5">Running as fully licensed — no expiry.</p>
                  )}
                  <p className="text-xs mt-1 text-green-600 dark:text-green-500">
                    All your data is safe — nothing was reset.
                  </p>
                </div>
              </div>

              {/* Hard reload so every page re-fetches from the now-unlocked backend */}
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="w-full flex items-center justify-center gap-2 py-3 px-6
                           rounded-xl font-bold text-sm text-white transition-all
                           active:scale-[0.98] shadow-lg shadow-blue-500/25"
                style={{ background: "linear-gradient(90deg, #2563eb, #0ea5e9)" }}
              >
                Continue to Dashboard
              </button>
            </div>

          ) : (
            <>
              {/* ── ERROR BANNER ── */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400
                                bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                                rounded-xl px-4 py-3">
                  <span className="shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* ── KEY FORM ── */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400
                                    mb-1.5 uppercase tracking-wide">
                    License Key
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <KeyRound size={15} />
                    </div>
                    <input
                      type={showKey ? "text" : "password"}
                      value={key}
                      onChange={e => setKey(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your license key"
                      className="form-input pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6
                             rounded-xl font-bold text-sm text-white transition-all
                             disabled:opacity-60 disabled:cursor-not-allowed
                             active:scale-[0.98] shadow-lg shadow-blue-500/30"
                  style={{ background: loading ? "#93c5fd" : "linear-gradient(90deg, #2563eb, #0ea5e9)" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Verifying…
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      Activate License
                    </>
                  )}
                </button>
              </form>

              {/* ── DIVIDER ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
                <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
              </div>

              {/* ── CONTACT ── */}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=S2R2%20Inventory%20%E2%80%94%20License%20Key%20Request&body=Hello%2C%0A%0AOur%20S2R2%20Inventory%20trial%20has%20expired.%20Please%20provide%20a%20license%20key%20for%20renewal.%0A%0AThank%20you.`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-6
                           rounded-xl font-semibold text-sm transition-all
                           border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Mail size={15} />
                Contact us at {CONTACT_EMAIL}
              </a>
            </>
          )}

          {/* Footer */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
            {COMPANY_NAME}
          </p>
        </div>
      </div>
    </main>
  );
}
