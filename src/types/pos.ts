// ─────────────────────────────────────────────────────────────
// src/types/pos.ts
// DTO ของ GET /admin/pos/scan — ดูโค้ดจริง productService.resolveScan() ฝั่ง backend
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";
import type { ProductCustomization } from "@/types/productCustomization";

/** ตัวเลือกดิบของสินค้า (productvariants) — ไม่มี variant_stock แล้ว (สต็อกอยู่ที่ตัวสินค้า · backend §8.3)
 *  POS ใช้ customization (จัดกลุ่มแล้ว) แทน */
export interface PosScanVariant {
  _id: string;
  group_id?: string | null;
  variant_name: string;
  variant_price: number;
}

export interface PosScanResult {
  product: Product;
  current_price: number;
  stock: number | null;
  variants: PosScanVariant[];
  /** กลุ่มตัวเลือก + ออปชันเสริม — มี = ต้องให้พนักงานเลือกก่อนลงบิล */
  customization: ProductCustomization;
}
