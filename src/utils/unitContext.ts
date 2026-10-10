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

/** ป้ายหน่วยจาก unit_id ที่ backend populate มาแล้ว ({ unit_name, unit_abbr }) — เป็น string id ดิบ = "" */
export function unitLabel(ref: string | { unit_name?: string; unit_abbr?: string } | null | undefined): string {
  return ref && typeof ref === "object" ? ref.unit_abbr || ref.unit_name || "" : "";
}

export function isIngredientUnit(usageContext: readonly string[] | undefined | null): boolean {
  return (usageContext ?? []).some((c) => /ingredient|both/i.test(c));
}

export function isProductUnit(usageContext: readonly string[] | undefined | null): boolean {
  return (usageContext ?? []).some((c) => /product|both/i.test(c));
}
