// lib/useTrialStatus.ts
// Fetches trial status from /health (proxied through Next.js → Express).
// Calculates exact calendar days remaining including time component.
// Used exclusively by the Admin page trial status card.
"use client";

import { useState, useEffect } from "react";

export interface TrialStatus {
  mode:          string;        // "1-month plan" | "6-month plan" | "1-year plan" | "licensed"
  enabled:       boolean;       // false = fully licensed, no expiry
  expired:       boolean;
  expiredOn:     string | null; // "YYYY-MM-DD" — the expiry date
  expiresAt:     Date   | null; // full Date object for precise time display
  daysRemaining: number;        // calendar days remaining (accurate)
  hoursRemaining: number;       // hours within the final day
  contact:       string;
}

// Module-level cache — one fetch per page session
let _cache:   TrialStatus | null          = null;
let _promise: Promise<TrialStatus> | null = null;

/**
 * Compute precise days + hours remaining from an ISO date string.
 * Uses end-of-day 23:59:59 local time as the expiry moment.
 */
function computeRemaining(expiredOn: string): { expiresAt: Date; daysRemaining: number; hoursRemaining: number; expired: boolean } {
  // Parse as local date at end of day so it doesn't expire at midnight UTC
  const [year, month, day] = expiredOn.split("-").map(Number);
  const expiresAt = new Date(year, month - 1, day, 23, 59, 59, 999);

  const now         = new Date();
  const msRemaining = expiresAt.getTime() - now.getTime();
  const expired     = msRemaining <= 0;

  if (expired) {
    return { expiresAt, daysRemaining: 0, hoursRemaining: 0, expired: true };
  }

  // Full calendar days remaining (floor — e.g. 33.7 days = 33 days 16 hrs)
  const totalHours    = msRemaining / (1000 * 60 * 60);
  const daysRemaining = Math.floor(totalHours / 24);
  const hoursRemaining = Math.floor(totalHours % 24);

  return { expiresAt, daysRemaining, hoursRemaining, expired: false };
}

async function fetchTrialStatus(): Promise<TrialStatus> {
  if (_cache)   return _cache;
  if (_promise) return _promise;

  _promise = fetch("/health", { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data): TrialStatus => {
      const raw = data.trial;

      // Fully licensed — no expiry
      if (!raw.enabled) {
        const result: TrialStatus = {
          mode: raw.mode || "licensed", enabled: false, expired: false,
          expiredOn: null, expiresAt: null,
          daysRemaining: 0, hoursRemaining: 0,
          contact: raw.contact || "civitasatlasco@gmail.com",
        };
        _cache = result;
        return result;
      }

      // Compute precise remaining time from the expiry date
      const { expiresAt, daysRemaining, hoursRemaining, expired } =
        raw.expiredOn
          ? computeRemaining(raw.expiredOn)
          : { expiresAt: null, daysRemaining: 0, hoursRemaining: 0, expired: true };

      const result: TrialStatus = {
        mode:           raw.mode           || "unknown",
        enabled:        true,
        expired,
        expiredOn:      raw.expiredOn      || null,
        expiresAt,
        daysRemaining,
        hoursRemaining,
        contact:        raw.contact        || "civitasatlasco@gmail.com",
      };
      _cache = result;
      return result;
    })
    .catch((): TrialStatus => ({
      mode: "unknown", enabled: true, expired: false,
      expiredOn: null, expiresAt: null,
      daysRemaining: 0, hoursRemaining: 0,
      contact: "civitasatlasco@gmail.com",
    }));

  return _promise;
}

/** Call this after a successful license key activation to force a re-fetch */
export function invalidateTrialCache() {
  _cache   = null;
  _promise = null;
}

export function useTrialStatus() {
  const [status, setStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    fetchTrialStatus().then(setStatus);
  }, []);

  return status;
}
