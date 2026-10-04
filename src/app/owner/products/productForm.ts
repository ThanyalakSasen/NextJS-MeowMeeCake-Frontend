// ─────────────────────────────────────────────────────────────
// productForm.ts — helper ล้วนของฟอร์มสินค้า (ใช้ร่วม Add / Edit)
// validation ทำที่ <Form.Item rules={...}> ใน ProductFormFields (antd Form)
// ─────────────────────────────────────────────────────────────
import type { PreorderConfig, Product, ProductInput } from "@/types/product";
import { refId } from "@/lib/refId";

export interface ProductFormValue {
  product_name_th: string;
  /** backend บังคับ required จริง (ไม่ optional) — required rule อยู่ที่ ProductFormFields */
  product_name_eng: string;
  category_id: string;
  unit_id: string;
  /** true = พรีออเดอร์ · false = สินค้าปกติ */
  is_preorder: boolean;
  product_price: number;
  sale_price?: number;
  /** ไม่มีความหมายตอนเป็นพรีออเดอร์ (ซ่อนช่องนี้ในฟอร์ม, backend ห้ามส่งมาด้วย) */
  product_stock_quantity: number;
  /** ว่าง (null/undefined) = ใช้ค่ากลางของ backend (5) · ซ่อนตอน preorder เหมือน stock */
  low_stock_threshold?: number | null;
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
  is_preorder: false,
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
    is_preorder: p.is_preorder,
    product_price: p.product_price,
    sale_price: p.sale_price ?? undefined,
    product_stock_quantity: p.product_stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? null,
    product_description: p.product_description,
    product_img: p.product_img ?? [],
    preorder_config: p.preorder_config ?? undefined,
    is_visible: p.is_visible,
  };
}

/**
 * ค่าจากฟอร์ม → body ที่ส่งเข้า API — product_stock_quantity/preorder_config exclusive กันเสมอ
 * (productService.ts validateTypeConsistency): พรีออเดอร์ต้องไม่ส่ง stock, สินค้าปกติต้องไม่ส่ง
 * preorder_config จึงส่ง null ฝั่งที่ไม่เกี่ยวข้อง (backend เช็ค != null)
 * ส่ง is_preorder ค่าเดิมซ้ำตอนแก้ไขได้ — backend สร้าง product_id ใหม่เฉพาะเมื่อ prefix pos-/pre- ไม่ตรงประเภท
 */
export function toInput(v: ProductFormValue): ProductInput {
  const isPreorder = v.is_preorder;
  return {
    product_name_th: v.product_name_th.trim(),
    product_name_eng: v.product_name_eng.trim(),
    category_id: v.category_id,
    unit_id: v.unit_id,
    is_preorder: isPreorder,
    product_price: v.product_price,
    sale_price: v.sale_price ?? null,
    product_description: v.product_description?.trim() || undefined,
    product_img: v.product_img ?? [],
    is_visible: v.is_visible,
    // exclusive กันเสมอ (validateTypeConsistency) — null อีกฝั่งเทียบเท่า "ไม่ส่งมา" (!= null ผ่านทั้งคู่)
    product_stock_quantity: isPreorder ? null : v.product_stock_quantity,
    // preorder ไม่มีสต็อก → ไม่ส่ง key นี้เลย · ว่าง = null (backend ใช้ค่ากลาง 5)
    low_stock_threshold: isPreorder ? undefined : (v.low_stock_threshold ?? null),
    preorder_config: isPreorder ? (v.preorder_config as PreorderConfig) : null,
  };
}

/**
 * ค่าจากฟอร์ม → body ของ PATCH ตอนแก้ไข — เหมือน toInput แต่ **ไม่ส่ง product_stock_quantity**
 * สต็อกปรับที่หน้าสต็อกสินค้า (PUT …/stock) เท่านั้น — backend จะปฏิเสธฟิลด์นี้ใน PATCH ทั่วไป (BACKLOG2 §15.2 ข้อ 5)
 * เปลี่ยนประเภทปกติ↔พรีออเดอร์ได้โดยไม่ต้องส่ง: backend ตั้งสต็อกเป็น null (พรีออเดอร์) / 0 (กลับเป็นปกติ) ให้เอง
 */
export function toUpdateInput(v: ProductFormValue): Omit<ProductInput, "product_stock_quantity"> {
  const { product_stock_quantity: _omit, ...rest } = toInput(v);
  void _omit;
  return rest;
}
