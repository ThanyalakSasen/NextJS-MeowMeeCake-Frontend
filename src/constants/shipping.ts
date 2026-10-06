// ─────────────────────────────────────────────────────────────
// src/constants/shipping.ts
// หมวดสินค้าที่ยังไม่เคยตั้ง ships_nationwide → backend เดาจากชื่อหมวด (ของเก็บได้นาน = ส่งทั่วประเทศ)
// ⚠️ ต้องตรงกับ backend src/lib/shipping.ts NATIONWIDE_CATEGORY_KEYWORDS
// ─────────────────────────────────────────────────────────────
export const NATIONWIDE_CATEGORY_KEYWORDS = ["ซาวโดว์", "sourdough"] as const;

/** ค่าที่ backend ใช้จริงเมื่อหมวดยังไม่ได้ตั้ง ships_nationwide */
export const guessShipsNationwide = (categoryName: string) =>
  NATIONWIDE_CATEGORY_KEYWORDS.some((k) => categoryName.toLowerCase().includes(k));
