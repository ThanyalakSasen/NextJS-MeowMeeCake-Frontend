// ─────────────────────────────────────────────────────────────
// src/types/product.ts
// DTO ของ resource /products — ดู field จริงใน docs/INVENTORY.md §1.1
// (นี่คือ "ตัวอย่าง reference" — DTO ของ resource อื่นสร้างแบบเดียวกันตอนทำ screen นั้น)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

// backend (#52, BACKLOG2 §14) เหลือสินค้า 2 แบบ ตัดสินด้วย is_preorder ตัวเดียว — ช่องทางขาย (เว็บ/หน้าร้าน)
// ดูจากเลขออเดอร์ (ORD-/POS-/PRE-) ไม่ได้ผูกกับสินค้าแล้ว · backend ตอบ 400 ถ้าส่ง product_type/product_types มา

/** ประเภทสินค้าสำหรับ UI เท่านั้น (ป้าย/ตัวกรอง/i18n enums.productType) — derive จาก is_preorder ไม่ได้ส่งไป API */
export type ProductKind = "normal" | "preorder";

export const productKindOf = (p: Pick<Product, "is_preorder">): ProductKind => (p.is_preorder ? "preorder" : "normal");

/** บังคับเฉพาะตอน is_preorder = true (productService.ts validateTypeConsistency) —
 *  ต้องไม่มี (null/undefined) ตอนเป็นสินค้าปกติ และ product_stock_quantity ต้องเป็น
 *  null/ไม่ส่งแทน ตอนเป็นพรีออเดอร์ (สองอย่างนี้ exclusive กันเสมอ) */
export interface PreorderConfig {
  min_order_qty: number;
  max_order_qty: number;
  lead_time_days: number;
}

/** backend populate category_id/unit_id เป็น object เต็มตอน GET/list — ใช้ refId() ดึง id ตอนต้องใช้เทียบ/ส่งกลับ */
export interface Product {
  _id: string;
  /** รหัสสินค้า/บาร์โค้ด เช่น "pos-0126264" (สินค้าพร้อมขาย) / "pre-..." (พรีออเดอร์) — ใช้กับ POS
   *  scan (`services/pos.ts`) ไม่ใช่ทุกแถวจะมีค่า (สร้างผ่าน backfill/สร้างสินค้าใหม่เท่านั้น) */
  product_id?: string;
  product_name_th: string;
  /** backend บังคับ required จริง (ไม่ optional) ทั้งตอน create — เก็บเป็น optional ที่นี่เพราะ
   *  Product ใช้ตอนอ่านด้วย (ข้อมูลเก่าก่อน field นี้บังคับอาจว่างอยู่) แต่ ProductInput ด้านล่างบังคับจริง */
  product_name_eng?: string;
  category_id?: string | { _id: string; product_category_name: string };
  unit_id?: string | { _id: string; unit_name: string; unit_abbr: string };
  product_price: number;
  sale_price?: number | null;
  /** true = พรีออเดอร์ (รหัส pre- · ไม่มีสต็อก · ต้องมี preorder_config) · false = สินค้าปกติ (รหัส pos-) */
  is_preorder: boolean;
  /** มีค่าเฉพาะสินค้าปกติ — พรีออเดอร์จะเป็น null เสมอ */
  product_stock_quantity: number | null;
  /** เกณฑ์ "สินค้าใกล้หมด" ของสินค้านี้ (จำนวนเต็ม ≥ 0) — null/ไม่มี = ใช้ค่ากลางของ backend (5)
   *  ใช้เฉพาะสินค้าปกติ (พรีออเดอร์ไม่มีสต็อก) */
  low_stock_threshold?: number | null;
  product_description?: string;
  /** array ของ URL รูปจริงที่อัปโหลดผ่าน POST /admin/products/images แล้ว (ไม่ใช่ base64) */
  product_img?: string[];
  preorder_config?: PreorderConfig | null;
  /** normalize เป็น number แล้วที่ services/products.ts (backend ส่ง Mongoose Decimal128 ดิบ) */
  avg_rating?: number;
  review_count?: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/** body ตอน create/update — ต่างจาก Product ตรงที่ backend บังคับ product_name_eng/category_id/
 *  unit_id ต้องมีค่าจริงเสมอ (productService.createProduct required check) ไม่ใช่ optional */
export type ProductInput = Omit<
  Product,
  "_id" | "created_at" | "updated_at" | "avg_rating" | "review_count" | "category_id" | "unit_id" | "product_name_eng"
> & {
  product_name_eng: string;
  category_id: string;
  unit_id: string;
};

export interface ProductListParams extends ListParams {
  category_id?: string;
  /** true = เฉพาะพรีออเดอร์ · false = เฉพาะสินค้าปกติ · ไม่ส่ง = ทั้งหมด */
  is_preorder?: boolean;
  is_visible?: boolean;
}
