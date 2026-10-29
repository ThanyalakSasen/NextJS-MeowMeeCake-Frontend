// ─────────────────────────────────────────────────────────────
// pricingHelpers.ts — pure: คำนวณส่วนลด/ราคาลด เฉพาะหน้า Pricing
// backend (productModel.ts) ไม่มี concept "แคมเปญส่วนลด" แยกเก็บเลย — มีแค่ product_price/
// sale_price 2 ค่า "ส่วนลด" ที่เห็นในหน้านี้จึงเป็นแค่ UI convenience คำนวณจากผลต่างราคา
// ไปกลับเอง ไม่ได้ยิง endpoint แยก (ต่างจาก "คูปอง/ส่วนลด" ที่ใช้ /admin/promotions จริง)
// ─────────────────────────────────────────────────────────────
// ส่วนลดในหน้านี้เป็นเปอร์เซ็นต์อย่างเดียว (ผู้ใช้เลือก 2026-10-29 — เอาตัวเลือก % / บาท ออก)
// อยากลดเป็นบาทให้แก้ช่อง "ราคาลด (บาท)" ตรง ๆ แทน

/** ราคาลดจากส่วนลด % (ปัดเป็นบาทเต็ม) */
export function calcSalePrice(base: number, percent: number): number {
  return Math.round(base * (1 - percent / 100));
}

/** ย้อนกลับจาก sale_price ที่มีอยู่แล้ว (เช่น ตอนโหลดจาก backend) เป็นส่วนลด % (ปัดเต็ม) · ไม่มีส่วนลด = null */
export function discountFromSalePrice(base: number, salePrice: number | null): number | null {
  if (salePrice === null || base <= 0 || salePrice >= base) return null;
  return Math.round(((base - salePrice) / base) * 100);
}
