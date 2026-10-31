"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useIdleTimeout.ts
// จับ activity ของผู้ใช้ — ไม่ขยับครบ (timeoutMs - warnMs) → onWarn · ครบ timeoutMs → onTimeout
// ไม่มีข้อความ UI (ผู้เรียก render modal/toast เอง)
// นับรวมทุกแท็บ: เวลาใช้งานล่าสุดแชร์ผ่าน localStorage — เดิมแต่ละแท็บนับเอง แท็บที่เปิดทิ้งไว้ว่างครบ 30 นาที
// สั่ง logout ทั้งที่อีกแท็บยังใช้งานอยู่ (cookie session เดียวกัน = ออกทุกแท็บ) · ก่อนเตือน/หมดเวลาเช็คค่ากลางอีกครั้ง
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARN_MS,
  IDLE_RESET_THROTTLE_MS,
  ACTIVITY_EVENTS,
} from "@/constants/session";

const SHARED_KEY = "mmc:last-activity";
const readShared = () => {
  try {
    return Number(window.localStorage.getItem(SHARED_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeShared = (at: number) => {
  try {
    window.localStorage.setItem(SHARED_KEY, String(at));
  } catch {
    // ไม่มี storage (private mode ฯลฯ) = นับเฉพาะแท็บนี้เหมือนเดิม
  }
};

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
    /** เวลาใช้งานล่าสุด (ของแท็บไหนก็ได้) ที่ timer นับจาก */
    let last = Date.now();

    const schedule = () => {
      clearTimeout(warnTimer);
      clearTimeout(idleTimer);
      const left = last + timeoutMs - Date.now();
      warnTimer = setTimeout(fireWarn, Math.max(0, left - warnMs));
      idleTimer = setTimeout(fireTimeout, Math.max(0, left));
    };
    /** แท็บอื่นใช้งานหลังจากที่นับไว้ → ขยับ last ตาม (true = ต้องตั้ง timer ใหม่) */
    const syncShared = () => {
      const shared = readShared();
      if (shared <= last) return false;
      last = shared;
      return true;
    };
    function fireWarn() {
      if (syncShared()) schedule();
      else cb.current.onWarn();
    }
    function fireTimeout() {
      if (syncShared()) schedule();
      else cb.current.onTimeout();
    }

    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < IDLE_RESET_THROTTLE_MS) return;
      lastReset = now;
      last = now;
      writeShared(now);
      schedule();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_KEY && syncShared()) schedule();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    writeShared(last);
    schedule();

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, timeoutMs, warnMs]);
}
