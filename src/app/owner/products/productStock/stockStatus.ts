// ─────────────────────────────────────────────────────────────
// stockStatus.ts — pure: จัดสถานะสต็อกสินค้าสำเร็จรูปจากจำนวนคงเหลือ
// เกณฑ์เดียวกับหน้า "จัดการข้อมูลสินค้า" — ถ้ามี consumer ที่ 2 ให้ promote ไป src/utils/
// ─────────────────────────────────────────────────────────────
import type { StockStatus } from "@/constants/enumConfig";

/** เหลือ ≤ ค่านี้ = "สต็อกต่ำ" (หน่วย: ชิ้น) */
export const LOW_STOCK_THRESHOLD = 5;

export function getStockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}
