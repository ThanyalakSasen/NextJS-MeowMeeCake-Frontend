// ─────────────────────────────────────────────────────────────
// shippingQuery.ts — pure: query key ของหน้าค่าจัดส่งหน้าร้านออนไลน์
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
export const SHIPPING_ZONES_KEY = ["admin", "shipping-zones"] as const;
