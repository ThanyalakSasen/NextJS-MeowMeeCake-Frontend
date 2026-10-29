// ─────────────────────────────────────────────────────────────
// src/types/productLot.ts — DTO ของ /admin/product-lots (productLotModel + productLotService ฝั่ง backend)
// 1 ล็อต = 1 รายการผลิตของใบสั่งผลิตที่ปิดงานแล้ว · lot_no = L<YYMMDD><ลำดับ 4 หลัก> เช่น L2610280001
// บาร์โค้ดบนฉลากแต่ละดวง = รหัสประจำชิ้น "<lot_no>-<ลำดับชิ้น>" (backend ProductLotPieces) — ไม่ซ้ำกันทุกชิ้น
// วันที่เป็น "YYYY-MM-DD" ตามเวลาไทย (วันบนฉลาก ไม่มีเวลา) · พรีออเดอร์ qty_remaining = null (ไม่มีสต็อก)
// ─────────────────────────────────────────────────────────────

/** expired = เลยวันหมดอายุ · expiring = หมดอายุภายใน 2 วัน (รวมวันนี้) · ok · none = ไม่มีวันหมดอายุ */
export type ExpiryState = "expired" | "expiring" | "ok" | "none";

export interface ProductLot {
  _id: string;
  lot_no: string;
  product_id: string;
  product_name_th: string | null;
  /** รหัสสินค้า (pos-/pre-) */
  product_code: string | null;
  is_preorder: boolean;
  /** ราคาปัจจุบันของสินค้า (บาท) — พิมพ์บนฉลาก · sale_price = ราคาลด (null = ไม่ลด) */
  product_price: number | null;
  sale_price: number | null;
  production_order_id: string;
  production_no: string | null;
  round_id: string | null;
  round_name: string | null;
  produced_date: string;
  expiry_date: string | null;
  expiry_state: ExpiryState;
  qty_produced: number;
  qty_remaining: number | null;
  created_at: string;
  /** เฉพาะค้นจากบาร์โค้ด (getByNo): ชิ้นที่สแกน (รหัสประจำชิ้น) · สแกน/พิมพ์เลขล็อตตรง ๆ = null */
  piece_no?: number | null;
  piece_code?: string | null;
}

/** GET /admin/product-lots/:lotNo/pieces */
export interface ProductLotPiece {
  piece_no: number;
  piece_code: string;
}

export interface ProductLotListParams {
  product_id?: string;
  production_order_id?: string;
  search?: string;
  in_stock?: boolean;
  page?: number;
  limit?: number;
}
