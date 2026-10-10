// ─────────────────────────────────────────────────────────────
// src/types/pos.ts
// DTO ของ GET /admin/pos/scan · /admin/pos/products — ดูโค้ดจริง productService.resolveScan() / getPosProducts() ฝั่ง backend
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";
import type { ProductCustomization } from "@/types/productCustomization";

/** 1 แถวของ GET /admin/pos/products — สินค้า (ไม่มี purchase_cost) + flag ว่าต้องเลือกตัวเลือกก่อนลงบิลไหม */
export interface PosProduct extends Product {
  /** true = มีกลุ่มตัวเลือก/ออปชันเสริม → ดึงรายละเอียดจาก /admin/pos/scan แล้วเปิดหน้าต่างเลือก */
  has_customization: boolean;
}

/** search ค้นจากรหัสสินค้าหรือชื่อ th/en (backend เรียงตามชื่อไทย) */
export interface PosProductListParams {
  page?: number;
  limit?: number;
  search?: string;
}

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
