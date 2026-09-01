// ─────────────────────────────────────────────────────────────
// src/utils/unitContext.ts — pure: หน่วยนับใช้กับ "วัตถุดิบ" / "สินค้า" ได้หรือไม่
// อ้าง Unit.usage_context (["Ingredient" | "Product" | "Both"]) — ทนค่าเก่าตัวเล็ก/พหูพจน์
// label ของ unit_type อยู่ที่ i18n `enums.unitType.*` (ไม่ hard-code ที่นี่)
// ─────────────────────────────────────────────────────────────

/** ค่า unit_type ที่รองรับ — ต้องตรงกับ key ใน i18n `enums.unitType` */
export const UNIT_TYPES = [
  "IngredientWeight",
  "IngredientVolume",
  "ProductWeight",
  "ProductVolume",
  "ProductCount",
  "Package",
  "Sheet",
  "Tray",
  "Slice",
  "Piece",
  "Custom",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export function isIngredientUnit(usageContext: readonly string[] | undefined | null): boolean {
  return (usageContext ?? []).some((c) => /ingredient|both/i.test(c));
}

export function isProductUnit(usageContext: readonly string[] | undefined | null): boolean {
  return (usageContext ?? []).some((c) => /product|both/i.test(c));
}
