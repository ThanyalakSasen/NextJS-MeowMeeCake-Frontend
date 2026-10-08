// ─────────────────────────────────────────────────────────────
// src/lib/lineAccount.ts — บัญชีที่สมัครด้วย LINE แต่ไม่ได้ให้อีเมล → backend ตั้งอีเมลชั่วคราว *@line-user.invalid
// (backend oauthService PLACEHOLDER_DOMAIN · BE §8.9) — ห้ามแสดงเป็นอีเมลจริง ทั้งหน้าร้านและหลังร้าน (BACKLOG3 I10)
// ─────────────────────────────────────────────────────────────
export const isLinePlaceholderEmail = (email: string | null | undefined) =>
  !!email && email.toLowerCase().endsWith("@line-user.invalid");
