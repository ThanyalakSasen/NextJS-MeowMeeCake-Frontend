// query key ของรายการออเดอร์ (โหลดทั้งหมดแล้วกรองฝั่ง client) — ใช้ร่วมกันระหว่าง ViewModel กับ page.tsx (server prefetch)
// ไฟล์นี้ไม่มี "use client" — server เรียกได้
export const ORDERS_KEY = ["orders"] as const;
