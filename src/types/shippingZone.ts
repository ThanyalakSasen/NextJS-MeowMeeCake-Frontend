// ─────────────────────────────────────────────────────────────
// src/types/shippingZone.ts — โซนค่าส่งของออเดอร์เว็บ A–D (shippingZoneModel ฝั่ง backend · BACKLOG4 F2 · Q-BE2)
// คนละชุดกับ DeliveryZone (/admin/delivery-zones — ค่าส่งออเดอร์ที่สร้างจากหลังร้าน)
// ─────────────────────────────────────────────────────────────

export type ShippingZoneCode = "A" | "B" | "C" | "D";

export interface ShippingZone {
  _id: string;
  zone_code: ShippingZoneCode;
  /** เช่น "Zone A — จังหวัดหนองคาย" */
  zone_label: string;
  /** ชื่อทางการใน 77 จังหวัด · โซน D ว่างเสมอ (= จังหวัดที่ไม่อยู่ใน A–C) */
  provinces: string[];
  /** บาท */
  fee: number;
}

/** PATCH /admin/shipping-zones/:zone_code — อย่างน้อย 1 ฟิลด์ */
export interface ShippingZoneUpdate {
  zone_label?: string;
  fee?: number;
  provinces?: string[];
}
