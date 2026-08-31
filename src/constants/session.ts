// ─────────────────────────────────────────────────────────────
// src/constants/session.ts
// พารามิเตอร์ idle timeout ฝั่ง frontend (D11 — เวลาจริงของ token อยู่ที่ backend,
// อันนี้แค่ UX: เตือน + หยุดเรียก refresh เมื่อผู้ใช้ไม่ขยับ)
// ─────────────────────────────────────────────────────────────

/** ไม่ขยับเกินเท่านี้ → logout */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 นาที

/** เตือนล่วงหน้าก่อนหมด */
export const IDLE_WARN_MS = 60 * 1000; // 60 วินาที

/** throttle การรีเซ็ตตัวจับเวลา (กัน reset ถี่ทุก mousemove) */
export const IDLE_RESET_THROTTLE_MS = 5 * 1000;

export const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown", "scroll", "touchstart", "visibilitychange",
] as const;
