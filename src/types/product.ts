// ─────────────────────────────────────────────────────────────
// src/types/product.ts
// DTO ของ resource /products — ดู field จริงใน docs/INVENTORY.md §1.1
// (นี่คือ "ตัวอย่าง reference" — DTO ของ resource อื่นสร้างแบบเดียวกันตอนทำ screen นั้น)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

// backend จริงใช้ "inStore" | "online" | "preorder" (src/models/productModel.ts) ไม่ใช่ "ready"
export type ProductType = "inStore" | "online" | "preorder";

/** บังคับเฉพาะตอน product_type === "preorder" (productService.ts validateTypeConsistency) —
 *  ต้องไม่มี (null/undefined) ตอน type เป็น inStore/online และ product_stock_quantity ต้องเป็น
 *  null/ไม่ส่งแทน ตอน type เป็น preorder (สองอย่างนี้ exclusive กันเสมอ) */
export interface PreorderConfig {
  min_order_qty: number;
  max_order_qty: number;
  lead_time_days: number;
}

/** backend populate category_id/unit_id เป็น object เต็มตอน GET/list — ใช้ refId() ดึง id ตอนต้องใช้เทียบ/ส่งกลับ */
export interface Product {
  _id: string;
  product_name_th: string;
  /** backend บังคับ required จริง (ไม่ optional) ทั้งตอน create — เก็บเป็น optional ที่นี่เพราะ
   *  Product ใช้ตอนอ่านด้วย (ข้อมูลเก่าก่อน field นี้บังคับอาจว่างอยู่) แต่ ProductInput ด้านล่างบังคับจริง */
  product_name_eng?: string;
  category_id?: string | { _id: string; product_category_name: string };
  unit_id?: string | { _id: string; unit_name: string; unit_abbr: string };
  product_price: number;
  sale_price?: number | null;
  product_type: ProductType;
  /** มีค่าเฉพาะ type inStore/online — preorder จะเป็น null เสมอ */
  product_stock_quantity: number | null;
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
  product_type?: ProductType;
  is_visible?: boolean;
}
