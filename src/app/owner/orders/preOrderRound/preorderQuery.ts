// ─────────────────────────────────────────────────────────────
// preorderQuery.ts — pure: แท็บ + query key ของหน้ารอบพรีออเดอร์
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
export type TabKey = "rounds" | "dashboard" | "orders";
export const TAB_KEYS: TabKey[] = ["dashboard", "rounds", "orders"];

/** แท็บที่เปิดจาก ?tab= / ?id= (ลิงก์แจ้งเตือนพรีออเดอร์ → แท็บคำสั่งซื้อ) · ไม่ระบุ = สรุปรอบ — ตรรกะเดียวกับ ViewModel */
export function tabFrom(tab: string | null | undefined, id: string | null | undefined): TabKey {
  return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : id ? "orders" : "dashboard";
}

export const ROUNDS_KEY = ["preorder-rounds"] as const;
export const PREORDERS_KEY = ["preorders"] as const;
export const ROUND_DASHBOARD_KEY = ["preorder-rounds", "dashboard"] as const;
