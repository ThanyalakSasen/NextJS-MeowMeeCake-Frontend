// ─────────────────────────────────────────────────────────────
// storeInfoQuery.ts — pure: query key ของหน้าข้อมูลร้าน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
export const PROFILE_KEY = ["store-admin", "profile"] as const;
export const SETTINGS_KEY = ["store-admin", "settings"] as const;
export const MARKETS_KEY = ["store-admin", "weekly-markets"] as const;
