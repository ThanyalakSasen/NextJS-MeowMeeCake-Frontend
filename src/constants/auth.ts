// ─────────────────────────────────────────────────────────────
// src/constants/auth.ts
// ค่าคงที่ auth ฝั่ง frontend — ดู docs/AUTH_PLAN.md §FRONTEND PIVOT
// ─────────────────────────────────────────────────────────────

/** ชื่อ cookie ที่ backend ตั้งตอน login — frontend เช็คแค่ "มีไหม" ไม่ verify (D18) */
export const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE || "mmc_session";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/owner/dashboard";
export const ACCESS_DENIED_PATH = "/owner/access-denied";

/** ช่องทาง sync การ logout ข้ามแท็บ */
export const AUTH_BROADCAST_CHANNEL = "mmc-auth";
