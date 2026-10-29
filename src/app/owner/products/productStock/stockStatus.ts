// ─────────────────────────────────────────────────────────────
// stockStatus.ts — pure: จัดสถานะสต็อกสินค้าสำเร็จรูปจากจำนวนคงเหลือ
// เกณฑ์รายสินค้า = products.low_stock_threshold (ตั้งในฟอร์มสินค้า) · ไม่ตั้ง = 5 — ตรงกับ backend src/lib/lowStock.ts
// ─────────────────────────────────────────────────────────────
import type { StockStatus } from "@/constants/enumConfig";

/** เกณฑ์เริ่มต้นเมื่อสินค้าไม่ได้ตั้ง low_stock_threshold (หน่วย: ชิ้น) */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function effectiveLowStockThreshold(threshold?: number | null): number {
  return threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

/** เหลือ ≤ เกณฑ์ = "ใกล้หมด" (เท่ากับเกณฑ์ก็นับ — แบบเดียวกับ backend $lte) */
export function getStockStatus(qty: number, threshold?: number | null): StockStatus {
  if (qty <= 0) return "out";
  if (qty <= effectiveLowStockThreshold(threshold)) return "low";
  return "ok";
}
