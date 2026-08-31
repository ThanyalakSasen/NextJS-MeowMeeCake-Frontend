// ─────────────────────────────────────────────────────────────
// src/types/product.ts
// DTO ของ resource /products — ดู field จริงใน docs/INVENTORY.md §1.1
// (นี่คือ "ตัวอย่าง reference" — DTO ของ resource อื่นสร้างแบบเดียวกันตอนทำ screen นั้น)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

export type ProductType = "ready" | "preorder";

export interface Product {
  _id: string;
  product_name_th: string;
  product_name_eng?: string;
  category_id?: string;
  unit_id?: string;
  product_price: number;
  sale_price?: number | null;
  product_type: ProductType;
  product_stock_quantity: number;
  product_description?: string;
  /** base64 — ไม่มาใน list (ขอด้วย ?include=product_img) */
  product_img?: string;
  avg_rating?: number;
  review_count?: number;
  is_visible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** body ตอน create/update (ไม่มี field ที่ backend gen เอง) */
export type ProductInput = Omit<
  Product,
  "_id" | "created_at" | "updated_at" | "avg_rating" | "review_count"
>;

export interface ProductListParams extends ListParams {
  category_id?: string;
  product_type?: ProductType;
  is_visible?: boolean;
}
