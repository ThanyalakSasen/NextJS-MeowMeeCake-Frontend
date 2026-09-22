// ─────────────────────────────────────────────────────────────
// productForm.ts — helper ล้วนของฟอร์มสินค้า (ใช้ร่วม Add / Edit)
// validation ทำที่ <Form.Item rules={...}> ใน ProductFormFields (antd Form)
// ─────────────────────────────────────────────────────────────
import type { PreorderConfig, Product, ProductInput, ProductType } from "@/types/product";
import { refId } from "@/lib/refId";

export interface ProductFormValue {
  product_name_th: string;
  /** backend บังคับ required จริง (ไม่ optional) — required rule อยู่ที่ ProductFormFields */
  product_name_eng: string;
  category_id: string;
  unit_id: string;
  product_type: ProductType;
  product_price: number;
  sale_price?: number;
  /** ไม่มีความหมายตอน product_type = "preorder" (ซ่อนช่องนี้ในฟอร์ม, backend ห้ามส่งมาด้วย) */
  product_stock_quantity: number;
  product_description?: string;
  /** array ของ URL ที่อัปโหลดจริงแล้วผ่าน productsService.uploadImages() */
  product_img?: string[];
  preorder_config?: Partial<PreorderConfig>;
  is_visible: boolean;
}

/** ค่าเริ่มต้นตอนเพิ่มสินค้าใหม่ (antd Form initialValues) */
export const emptyProductForm: ProductFormValue = {
  product_name_th: "",
  product_name_eng: "",
  category_id: "",
  unit_id: "",
  product_type: "inStore",
  product_price: 0,
  product_stock_quantity: 0,
  product_img: [],
  is_visible: true,
};

/** Product (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromProduct(p: Product): ProductFormValue {
  return {
    product_name_th: p.product_name_th,
    product_name_eng: p.product_name_eng ?? "",
    category_id: refId(p.category_id),
    unit_id: refId(p.unit_id),
    product_type: p.product_type,
    product_price: p.product_price,
    sale_price: p.sale_price ?? undefined,
    product_stock_quantity: p.product_stock_quantity ?? 0,
    product_description: p.product_description,
    product_img: p.product_img ?? [],
    preorder_config: p.preorder_config ?? undefined,
    is_visible: p.is_visible,
  };
}

/**
 * ค่าจากฟอร์ม → body ที่ส่งเข้า API — product_stock_quantity/preorder_config exclusive กันเสมอ
 * (productService.ts validateTypeConsistency): type preorder ต้องไม่ส่ง stock, type อื่นต้องไม่ส่ง
 * preorder_config เลย จึง omit key ที่ไม่เกี่ยวข้องแทนส่ง null/0 ไปเฉย ๆ
 */
export function toInput(v: ProductFormValue): ProductInput {
  const isPreorder = v.product_type === "preorder";
  return {
    product_name_th: v.product_name_th.trim(),
    product_name_eng: v.product_name_eng.trim(),
    category_id: v.category_id,
    unit_id: v.unit_id,
    product_type: v.product_type,
    product_price: v.product_price,
    sale_price: v.sale_price ?? null,
    product_description: v.product_description?.trim() || undefined,
    product_img: v.product_img ?? [],
    is_visible: v.is_visible,
    // exclusive กันเสมอ (validateTypeConsistency) — null อีกฝั่งเทียบเท่า "ไม่ส่งมา" (!= null ผ่านทั้งคู่)
    product_stock_quantity: isPreorder ? null : v.product_stock_quantity,
    preorder_config: isPreorder ? (v.preorder_config as PreorderConfig) : null,
  };
}
