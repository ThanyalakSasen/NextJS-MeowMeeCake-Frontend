// ─────────────────────────────────────────────────────────────
// pricingHelpers.ts — pure: คำนวณส่วนลด/ราคาลด เฉพาะหน้า Pricing
// backend (productModel.ts) ไม่มี concept "แคมเปญส่วนลด" แยกเก็บเลย — มีแค่ product_price/
// sale_price 2 ค่า "ส่วนลด" ที่เห็นในหน้านี้จึงเป็นแค่ UI convenience คำนวณจากผลต่างราคา
// ไปกลับเอง ไม่ได้ยิง endpoint แยก (ต่างจาก "คูปอง/ส่วนลด" ที่ใช้ /admin/promotions จริง)
// ─────────────────────────────────────────────────────────────
export type DiscountType = "percent" | "baht";

export interface Discount {
  type: DiscountType;
  value: number;
}

export function calcSalePrice(base: number, disc: Discount): number {
  if (disc.type === "percent") return Math.round(base * (1 - disc.value / 100));
  return Math.max(0, base - disc.value);
}

/** ย้อนกลับจาก sale_price ที่มีอยู่แล้ว (เช่น ตอนโหลดจาก backend) เป็นส่วนลดแบบ % เสมอ
 *  (backend ไม่ได้เก็บว่าตอนตั้งเป็น % หรือ บาท — เดาเป็น % ให้เพื่อโชว์ในตาราง) */
export function discountFromSalePrice(base: number, salePrice: number | null): Discount | null {
  if (salePrice === null || base <= 0 || salePrice >= base) return null;
  return { type: "percent", value: Math.round(((base - salePrice) / base) * 100) };
}

// แท็กหมวดหมู่ — สุ่มสีจาก preset ของ antd ให้คงที่ต่อ category เดิมเสมอ (hash ชื่อ/id)
// เฉพาะสี preset ของ antd ที่ตัวอักษรบนพื้น tag ผ่านคอนทราสต์ 4.5:1 (blue 5.5 · purple 8.9 · magenta 5.0 · geekblue 7.9)
// green/gold/volcano/cyan ได้แค่ 2.8–4.4 → Lighthouse Accessibility ตก
const TAG_COLORS = ["blue", "purple", "magenta", "geekblue"];

export function tagColorFor(seed: string): string {
  if (!seed) return "default";
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}
