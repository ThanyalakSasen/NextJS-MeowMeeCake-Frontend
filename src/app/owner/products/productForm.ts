// ─────────────────────────────────────────────────────────────
// productForm.ts — helper ล้วนของฟอร์มสินค้า (ใช้ร่วม Add / Edit)
// validation ทำที่ <Form.Item rules={...}> ใน ProductFormFields (antd Form)
// ─────────────────────────────────────────────────────────────
import type { Product, ProductInput, ProductType } from "@/types/product";

export interface ProductFormValue {
  product_name_th: string;
  product_name_eng?: string;
  category_id?: string;
  unit_id?: string;
  product_type: ProductType;
  product_price: number;
  sale_price?: number;
  product_stock_quantity: number;
  product_description?: string;
  product_img?: string;
  is_visible: boolean;
}

/** ค่าเริ่มต้นตอนเพิ่มสินค้าใหม่ (antd Form initialValues) */
export const emptyProductForm: ProductFormValue = {
  product_name_th: "",
  product_type: "ready",
  product_price: 0,
  product_stock_quantity: 0,
  is_visible: true,
};

/** Product (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromProduct(p: Product): ProductFormValue {
  return {
    product_name_th: p.product_name_th,
    product_name_eng: p.product_name_eng,
    category_id: p.category_id,
    unit_id: p.unit_id,
    product_type: p.product_type,
    product_price: p.product_price,
    sale_price: p.sale_price ?? undefined,
    product_stock_quantity: p.product_stock_quantity,
    product_description: p.product_description,
    product_img: p.product_img,
    is_visible: p.is_visible,
  };
}

/** ค่าจากฟอร์ม → body ที่ส่งเข้า API */
export function toInput(v: ProductFormValue): ProductInput {
  return {
    product_name_th: v.product_name_th.trim(),
    product_name_eng: v.product_name_eng?.trim() || undefined,
    category_id: v.category_id,
    unit_id: v.unit_id,
    product_type: v.product_type,
    product_price: v.product_price,
    sale_price: v.sale_price ?? null,
    product_stock_quantity: v.product_stock_quantity,
    product_description: v.product_description?.trim() || undefined,
    product_img: v.product_img,
    is_visible: v.is_visible,
    is_active: true,
  };
}
