"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useIdleTimeout.ts
// จับ activity ของผู้ใช้ — ไม่ขยับครบ (timeoutMs - warnMs) → onWarn · ครบ timeoutMs → onTimeout
// ไม่มีข้อความ UI (ผู้เรียก render modal/toast เอง)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARN_MS,
  IDLE_RESET_THROTTLE_MS,
  ACTIVITY_EVENTS,
} from "@/constants/session";

interface Options {
  enabled: boolean;
  onWarn: () => void;
  onTimeout: () => void;
  timeoutMs?: number;
  warnMs?: number;
}

export function useIdleTimeout({
  enabled,
  onWarn,
  onTimeout,
  timeoutMs = IDLE_TIMEOUT_MS,
  warnMs = IDLE_WARN_MS,
}: Options): void {
  // เก็บ callback ล่าสุดไว้ใน ref — ไม่ต้อง re-bind listener ทุกครั้งที่ callback เปลี่ยน
  const cb = useRef({ onWarn, onTimeout });
  useEffect(() => {
    cb.current = { onWarn, onTimeout };
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let warnTimer: ReturnType<typeof setTimeout>;
    let idleTimer: ReturnType<typeof setTimeout>;
    let lastReset = 0;

    const schedule = () => {
      clearTimeout(warnTimer);
      clearTimeout(idleTimer);
      warnTimer = setTimeout(() => cb.current.onWarn(), Math.max(0, timeoutMs - warnMs));
      idleTimer = setTimeout(() => cb.current.onTimeout(), timeoutMs);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < IDLE_RESET_THROTTLE_MS) return;
      lastReset = now;
      schedule();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    schedule();

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [enabled, timeoutMs, warnMs]);
}
