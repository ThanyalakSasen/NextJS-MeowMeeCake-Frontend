// ─────────────────────────────────────────────────────────────
// src/types/shippingZone.ts — โซนค่าส่งของออเดอร์เว็บ A–D (shippingZoneModel ฝั่ง backend · BACKLOG4 F2 · Q-BE2)
// คนละชุดกับ DeliveryZone (/admin/delivery-zones — ค่าส่งออเดอร์ที่สร้างจากหลังร้าน)
// ─────────────────────────────────────────────────────────────

/** ตัวอักษร A–Z — เริ่มต้น A–D · โซนที่เพิ่มใหม่ได้รหัสถัดไป (E, F, …) · D = จังหวัดที่ไม่อยู่ในโซนอื่น */
export type ShippingZoneCode = string;

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

/** POST /admin/shipping-zones — เพิ่มโซน (รหัสโซนระบบตั้งให้) */
export interface ShippingZoneCreate {
  zone_label: string;
  fee: number;
  provinces: string[];
}

/** PATCH /admin/shipping-zones/:zone_code — อย่างน้อย 1 ฟิลด์ */
export interface ShippingZoneUpdate {
  zone_label?: string;
  fee?: number;
  provinces?: string[];
}

/**
 * GET /admin/shipping-zones/categories — หมวดหมู่สินค้า + ขอบเขตจัดส่งของออเดอร์เว็บ
 * (ตั้งที่หน้า "ค่าจัดส่งหน้าร้านออนไลน์" · สิทธิ์ store_info — ย้ายมาจากตัวจัดการหมวดหมู่ในหน้าสินค้า)
 */
export interface CategoryShipping {
  _id: string;
  product_category_name: string;
  /** ค่าที่มีผลจริง: true = ส่งทั่วประเทศ · false = ส่งได้เฉพาะจังหวัดของร้าน (รับเองได้เสมอ) */
  ships_nationwide: boolean;
  /** true = ยังไม่เคยตั้ง backend เดาจากชื่อหมวด (ซาวโดว์ = ส่งทั่วประเทศ) */
  ships_nationwide_auto: boolean;
}

/**
 * GET /admin/shipping-zones/products — ขอบเขตจัดส่งแบบยกเว้นรายสินค้า ("จัดส่งนอกจังหวัด" แท็บรายสินค้า)
 * ค่าที่ใช้จริง = ค่ายกเว้นของสินค้า (ถ้าตั้ง) ไม่งั้นตามหมวด
 */
export interface ProductShipping {
  _id: string;
  product_name_th: string;
  /** รหัสสินค้า pos-/pre- */
  product_code: string | null;
  category_id: string | null;
  category_name: string;
  is_preorder: boolean;
  /** ค่าที่ตั้งยกเว้นไว้ · null = ตามหมวด */
  ships_nationwide: boolean | null;
  category_ships_nationwide: boolean;
  effective_ships_nationwide: boolean;
}

/** GET /catalog/shipping-exceptions — สินค้าที่ตั้งขอบเขตจัดส่งต่างจากหมวด (หน้าค่าจัดส่งของลูกค้า) */
export interface ShippingExceptionItem {
  _id: string;
  product_name_th: string;
  category_name: string;
}
export interface ShippingExceptions {
  /** หมวดส่งเฉพาะจังหวัด แต่สินค้าชิ้นนี้ส่งทั่วประเทศได้ */
  nationwide: ShippingExceptionItem[];
  /** หมวดส่งทั่วประเทศ แต่สินค้าชิ้นนี้ส่งได้เฉพาะจังหวัดร้าน */
  province_only: ShippingExceptionItem[];
}
