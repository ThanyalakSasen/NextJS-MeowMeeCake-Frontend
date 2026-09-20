// ─────────────────────────────────────────────────────────────
// src/constants/auth.ts
// ค่าคงที่ auth ฝั่ง frontend — ดู docs/AUTH_PLAN.md §FRONTEND PIVOT
// ─────────────────────────────────────────────────────────────

/** ชื่อ cookie ที่ backend ตั้งตอน login — frontend เช็คแค่ "มีไหม" ไม่ verify (D18) */
export const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE || "mmc_session";

/**
 * ใครเป็นด่านหน้ากั้น /owner/* ก่อน render (D18):
 *  - "cookie" (ดีฟอลต์): proxy.ts เช็คว่ามี auth cookie ไหม — ใช้ได้เมื่อ cookie ของ backend มองเห็นได้จาก origin ของ
 *    frontend คือ dev บน localhost หรือ backend/frontend เป็น subdomain ของ site เดียวกันแล้ว backend ตั้ง COOKIE_DOMAIN
 *  - "client": proxy ไม่เช็ค cookie เลย — ใช้เมื่อ frontend กับ backend อยู่คนละ site (cookie ติดอยู่กับโดเมน backend
 *    frontend มองไม่เห็นตลอดกาล ถ้ายังเช็คจะ login สำเร็จแล้วถูกเด้งกลับ /login วนไม่จบ) ด่านหน้าเหลือแค่ฝั่ง client
 *    (OwnerLayout เรียก /auth/me → 401 = เด้งไป login) ส่วนของจริงคือ backend กั้นทุก route อยู่แล้ว
 */
export const AUTH_GATE: "cookie" | "client" = process.env.NEXT_PUBLIC_AUTH_GATE === "client" ? "client" : "cookie";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/owner/dashboard";
export const ACCESS_DENIED_PATH = "/owner/access-denied";

/** ช่องทาง sync การ logout ข้ามแท็บ */
export const AUTH_BROADCAST_CHANNEL = "mmc-auth";
