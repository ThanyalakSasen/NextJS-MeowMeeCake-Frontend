// ─────────────────────────────────────────────────────────────
// deliveryZonesQuery.ts — pure: query key ของหน้าโซนค่าจัดส่ง (หลังร้าน)
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
export const DELIVERY_ZONES_KEY = ["delivery-zones"] as const;
export const DELIVERY_FEE_OVERVIEW_KEY = ["delivery-fee"] as const;
