// ─────────────────────────────────────────────────────────────
// src/types/productStockTransaction.ts
// DTO ของ GET /admin/products/stock-history — ประวัติสต็อกสินค้า (อ่านอย่างเดียว)
// backend บันทึกเองทุกครั้งที่สต็อกเปลี่ยน: รับเข้า/เบิกใช้/ปรับยอด (หน้าสต็อก) · ปิดงานผลิต · ขาย · คืนสต็อก
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { ProductStockTxnType } from "@/constants/enumConfig";

export interface ProductStockTransaction {
  _id: string;
  /** populate มาพร้อมชื่อ/รหัส/หน่วย · สินค้าที่ถูกลบถาวร = null */
  product_id: {
    _id: string;
    product_id?: string;
    product_name_th: string;
    unit_id?: { _id: string; unit_name: string; unit_abbr?: string } | string | null;
  } | null;
  type: ProductStockTxnType;
  /** ส่วนต่างแบบมีเครื่องหมาย (+ เพิ่ม / − ลด) */
  delta: number;
  qty_before: number;
  qty_after: number;
  note: string;
  ref_type: "order" | "production_order" | null;
  ref_id: string | null;
  /** เลขออเดอร์ / เลขใบสั่งผลิตของ ref_id */
  ref_no: string | null;
  /** null = ระบบ / ลูกค้าสั่งเอง */
  performed_by: { _id: string; user_fullname: string; email: string } | null;
  created_at: string;
}

export interface ProductStockHistoryParams extends ListParams {
  product_id?: string;
  type?: ProductStockTxnType;
  /** "YYYY-MM-DD" ตามวันไทย */
  date_from?: string;
  date_to?: string;
}
