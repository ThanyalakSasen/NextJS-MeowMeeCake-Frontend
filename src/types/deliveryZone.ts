// ─────────────────────────────────────────────────────────────
// src/types/deliveryZone.ts — โซนค่าจัดส่งหลังร้าน (backend deliveryZoneModel · /admin/delivery-zones · BACKLOG4 I8)
// ใช้คิดค่าส่งของออเดอร์/พรีออเดอร์แบบ "ส่งตามที่อยู่" ที่สร้างจากหลังร้าน (ไม่ได้กรอกค่าส่งเอง)
// หน้าร้านออนไลน์ใช้อีกชุด (ShippingZones — F2) · เงินเป็นบาท
// ─────────────────────────────────────────────────────────────
export interface DeliveryZone {
  _id: string;
  zone_name: string;
  /** ชื่อจังหวัดที่นับเป็นโซนนี้ — ต้องตรงกับที่กรอกในที่อยู่ (ตัด "จังหวัด"/"จ." ข้างหน้าแล้ว) · catch-all ไม่ใช้ */
  provinces: string[];
  /** รับทุกจังหวัดที่ไม่ตรงกับโซนอื่น — เปิดได้ทีละโซน (backend ปลดโซนเดิมให้เอง) */
  is_catch_all: boolean;
  fee: number;
  /** น้อยกว่าเช็คก่อน — จังหวัดซ้ำหลายโซน = โซนแรกชนะ */
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
}

export type DeliveryZoneInput = Pick<DeliveryZone, "zone_name" | "provinces" | "is_catch_all" | "fee" | "sort_order" | "is_active">;

/** GET /admin/delivery-fee — โครงค่าส่งที่ใช้อยู่จริง · env-fallback = ยังไม่มีโซนเปิดใช้ใน DB (ใช้ค่าจาก env) */
export interface DeliveryFeeOverview {
  free_shipping_min: number;
  source: "db" | "env-fallback";
  zones: { name: string; fee: number; is_catch_all?: boolean; provinces?: string[] }[];
}
