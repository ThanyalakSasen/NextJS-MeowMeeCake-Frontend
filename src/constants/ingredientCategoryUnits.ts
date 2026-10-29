// ─────────────────────────────────────────────────────────────
// src/constants/ingredientCategoryUnits.ts
// กฎจับคู่ "หมวดหมู่วัตถุดิบ (+ ชื่อวัตถุดิบ)" → "หน่วยนับที่สมเหตุสมผล"
// และกฎล็อกบริบทการใช้งานของประเภทหน่วยนับ (unit_type)
// ─────────────────────────────────────────────────────────────
import type { Unit } from "@/types/unit";
import { isIngredientUnit } from "@/utils/unitContext";

interface CategoryUnitRule {
  /** คีย์เวิร์ดของชื่อหมวดหมู่ */
  categoryPattern: RegExp;
  /** unit_type ที่อนุญาตในหมวดนี้ */
  allowedTypes: readonly string[];
  /** ชื่อหน่วยหรือตัวย่อที่อนุญาตเพิ่มเติม (ถ้ามี) */
  allowedNames?: readonly string[];
  /** ชื่อหน่วยหรือตัวย่อที่ไม่อนุญาตในหมวดนี้ */
  excludedNames?: readonly string[];
  /** ลำดับชื่อหน่วย/ตัวย่อเริ่มต้นที่แนะนำเมื่อเลือกหมวดนี้ */
  preferredUnits: readonly string[];
  /** อนุญาตหน่วยบรรจุภัณฑ์แม้ตั้ง usage_context เป็น Product ไว้ตอน seed */
  includePackagingUnits?: boolean;
}

const PACKAGING_UNIT_TYPES = ["Package", "Tray", "Sheet", "Piece", "ProductCount", "Custom"] as const;
const INTEGER_UNIT_TYPES = new Set(["ProductCount", "Package", "Sheet", "Tray", "Slice", "Piece"]);
const DECIMAL_UNIT_TYPES = new Set(["IngredientWeight", "IngredientVolume", "ProductWeight", "ProductVolume"]);
const INTEGER_UNIT_NAME_PATTERN = /ฟอง|ชิ้น|กล่อง|ถาด|แผ่น|ลูก|ผล|ถุง|ซอง|ขวด|กระป๋อง|แพ็ก|แพ็ค|ห่อ|ม้วน|ใบ|อัน|หลอด|ก้อน|ชุด|ลัง/i;
const DECIMAL_UNIT_NAME_PATTERN = /^(กรัม|ก\.?|g|กิโลกรัม|กก\.?|kg|มิลลิลิตร|มล\.?|ml|ลิตร|ล\.?|l|ปอนด์|lb|ออนซ์|oz)$/i;

/**
 * ตรวจว่าหน่วยนับนี้ต้องกรอกเป็นจำนวนเต็มเท่านั้นหรือไม่ (เช่น ฟอง, ชิ้น, กล่อง, ถาด, แผ่น)
 */
export function isIntegerOnlyUnit(
  unit: { unit_type?: string; unit_name?: string; unit_abbr?: string } | string | null | undefined,
): boolean {
  if (!unit) return false;
  if (typeof unit === "string") {
    const s = unit.trim();
    if (!s) return false;
    if (DECIMAL_UNIT_NAME_PATTERN.test(s)) return false;
    return INTEGER_UNIT_NAME_PATTERN.test(s);
  }
  const name = (unit.unit_name ?? "").trim();
  const abbr = (unit.unit_abbr ?? "").trim();
  if (DECIMAL_UNIT_NAME_PATTERN.test(name) || DECIMAL_UNIT_NAME_PATTERN.test(abbr)) return false;
  if (INTEGER_UNIT_NAME_PATTERN.test(name) || INTEGER_UNIT_NAME_PATTERN.test(abbr)) return true;
  if (unit.unit_type && DECIMAL_UNIT_TYPES.has(unit.unit_type)) return false;
  if (unit.unit_type && INTEGER_UNIT_TYPES.has(unit.unit_type)) return true;
  return false;
}

const CATEGORY_RULES: readonly CategoryUnitRule[] = [
  // หมวดของแห้ง / ผง / ของแข็งที่ชั่งน้ำหนักเป็นกรัมหรือกิโลกรัม
  {
    categoryPattern: /แป้ง|น้ำตาล|ช็อกโกแลต|โกโก้|ผงฟู|สารช่วย|ถั่ว|ผลไม้แห้ง|ธัญพืช/i,
    allowedTypes: ["IngredientWeight"],
    preferredUnits: ["กรัม", "g", "กิโลกรัม", "kg"],
  },
  // หมวดเนยและไขมัน (เนย/ชีส/มาการีน = น้ำหนัก, น้ำมัน = ปริมาตร/น้ำหนัก)
  {
    categoryPattern: /เนย|ไขมัน|ชีส/i,
    allowedTypes: ["IngredientWeight", "IngredientVolume"],
    preferredUnits: ["กรัม", "g", "กิโลกรัม", "kg", "มิลลิลิตร", "ml", "ลิตร", "L"],
  },
  // หมวดสารแต่งกลิ่นและสี (ส่วนใหญ่เป็นของเหลว ml/L หรือแบบผง g/kg)
  {
    categoryPattern: /กลิ่น|สี|ไซรัป|ซอส|น้ำเชื่อม/i,
    allowedTypes: ["IngredientVolume", "IngredientWeight"],
    preferredUnits: ["มิลลิลิตร", "ml", "กรัม", "g", "ลิตร", "L", "กิโลกรัม", "kg"],
  },
  // หมวดไข่และนม (ไข่ = ฟอง, นม/ครีม/วิป = มิลลิลิตร/ลิตร/กรัม/กิโลกรัม)
  {
    categoryPattern: /ไข่|นม|ครีม/i,
    allowedTypes: ["Custom", "Piece", "IngredientVolume", "IngredientWeight"],
    preferredUnits: ["ฟอง", "มิลลิลิตร", "ml", "ลิตร", "L", "กรัม", "g", "กิโลกรัม", "kg"],
  },
  // หมวดบรรจุภัณฑ์ (กล่อง, ถาด, แผ่น, ชิ้น)
  {
    categoryPattern: /บรรจุภัณฑ์|แพ็กเกจ|กล่อง|ถุง|ถาด/i,
    allowedTypes: PACKAGING_UNIT_TYPES,
    excludedNames: ["ฟอง"],
    preferredUnits: ["ชิ้น", "กล่อง", "ถาด", "แผ่น"],
    includePackagingUnits: true,
  },
];

function matchUnitByNameOrAbbr(u: Unit, target: string): boolean {
  const t = target.trim().toLowerCase();
  return u.unit_name.trim().toLowerCase() === t || u.unit_abbr.trim().toLowerCase() === t;
}

function findPreferredUnitId(units: Unit[], preferred: readonly string[]): string | undefined {
  for (const p of preferred) {
    const found = units.find((u) => matchUnitByNameOrAbbr(u, p));
    if (found) return found._id;
  }
  return units[0]?._id;
}

/**
 * คืนรายการหน่วยนับที่สมเหตุสมผลสำหรับหมวดหมู่วัตถุดิบ (และชื่อวัตถุดิบถ้ากรอกแล้ว)
 * พร้อมหน่วยเริ่มต้นที่แนะนำ
 */
export function resolveIngredientCategoryUnits(
  categoryName: string | undefined,
  ingredientName: string | undefined,
  allUnits: Unit[],
): {
  allowedUnits: Unit[];
  defaultUnitId: string | undefined;
} {
  const baseIngredientUnits = allUnits.filter((u) => isIngredientUnit(u.usage_context));
  const cat = (categoryName ?? "").trim();
  const name = (ingredientName ?? "").trim();

  if (!cat) {
    return {
      allowedUnits: baseIngredientUnits,
      defaultUnitId: undefined,
    };
  }

  const rule = CATEGORY_RULES.find((r) => r.categoryPattern.test(cat));
  if (!rule) {
    return {
      allowedUnits: baseIngredientUnits,
      defaultUnitId: baseIngredientUnits[0]?._id,
    };
  }

  const pool = rule.includePackagingUnits ? allUnits : baseIngredientUnits;

  let filtered = pool.filter((u) => {
    if (
      rule.excludedNames?.some(
        (ex) => matchUnitByNameOrAbbr(u, ex),
      )
    ) {
      return false;
    }
    if (rule.allowedTypes.includes(u.unit_type)) return true;
    if (rule.allowedNames?.some((n) => matchUnitByNameOrAbbr(u, n))) return true;
    return false;
  });

  let preferred = [...rule.preferredUnits];

  // ปรับละเอียดตามชื่อวัตถุดิบในหมวดที่มีได้หลายสถานะ (เช่น "ไข่และนม", "เนยและไขมัน", "สารแต่งกลิ่นและสี")
  if (/ไข่|นม|ครีม/i.test(cat) && name) {
    if (/ไข่/.test(name) && !/เหลว|ผง|ขาวเหลว|แดงเหลว/.test(name)) {
      const eggUnits = filtered.filter((u) => matchUnitByNameOrAbbr(u, "ฟอง"));
      if (eggUnits.length > 0) {
        filtered = eggUnits;
        preferred = ["ฟอง"];
      }
    } else if (/นมผง|ครีมชีส|มาสคาร์โปน/.test(name)) {
      const weightUnits = filtered.filter((u) => u.unit_type === "IngredientWeight");
      if (weightUnits.length > 0) {
        filtered = weightUnits;
        preferred = ["กรัม", "g", "กิโลกรัม", "kg"];
      }
    } else if (/นม|ครีม|วิป|กะทิ|โยเกิร์ต|บัตเตอร์มิลค์/.test(name)) {
      const liquidOrWeight = filtered.filter(
        (u) => u.unit_type === "IngredientVolume" || u.unit_type === "IngredientWeight",
      );
      if (liquidOrWeight.length > 0) {
        filtered = liquidOrWeight;
        preferred = ["มิลลิลิตร", "ml", "ลิตร", "L", "กรัม", "g", "กิโลกรัม", "kg"];
      }
    }
  } else if (/เนย|ไขมัน|ชีส/i.test(cat) && name) {
    if (/น้ำมัน/.test(name)) {
      const volUnits = filtered.filter((u) => u.unit_type === "IngredientVolume");
      if (volUnits.length > 0) {
        filtered = volUnits;
        preferred = ["มิลลิลิตร", "ml", "ลิตร", "L"];
      }
    } else if (/เนย|มาการีน|ชอร์ตเทนนิ่ง|ชีส/.test(name)) {
      const weightUnits = filtered.filter((u) => u.unit_type === "IngredientWeight");
      if (weightUnits.length > 0) {
        filtered = weightUnits;
        preferred = ["กรัม", "g", "กิโลกรัม", "kg"];
      }
    }
  } else if (/กลิ่น|สี|ไซรัป|ซอส|น้ำเชื่อม/i.test(cat) && name) {
    if (/ผง|เกล็ด|เจล/.test(name)) {
      const weightUnits = filtered.filter((u) => u.unit_type === "IngredientWeight");
      if (weightUnits.length > 0) {
        filtered = weightUnits;
        preferred = ["กรัม", "g", "กิโลกรัม", "kg"];
      }
    } else {
      const volUnits = filtered.filter((u) => u.unit_type === "IngredientVolume");
      if (volUnits.length > 0) {
        filtered = volUnits;
        preferred = ["มิลลิลิตร", "ml", "ลิตร", "L"];
      }
    }
  }

  if (filtered.length === 0) {
    filtered = baseIngredientUnits;
  }

  return {
    allowedUnits: filtered,
    defaultUnitId: findPreferredUnitId(filtered, preferred),
  };
}

/**
 * ตรวจว่าประเภทหน่วยนับ (unit_type) บังคับล็อกกลุ่มการใช้งาน (วัตถุดิบ / สินค้า) หรือไม่
 */
export function getUnitTypeLockedContext(unitType: string | undefined): "ingredient" | "product" | null {
  if (!unitType) return null;
  if (unitType === "IngredientWeight" || unitType === "IngredientVolume") {
    return "ingredient";
  }
  if (
    unitType === "ProductWeight" ||
    unitType === "ProductVolume" ||
    unitType === "ProductCount" ||
    unitType === "Slice"
  ) {
    return "product";
  }
  return null;
}

/**
 * บล็อกการพิมพ์ตัวอักษร สัญลักษณ์ และเครื่องหมายลบ (-) ในช่องตัวเลข
 * อนุญาตเฉพาะตัวเลข 0-9, จุดทศนิยม (.) ไม่ซ้ำ และปุ่มควบคุม (Backspace, Delete, Tab, Arrow ฯลฯ)
 */
export function blockNegativeKeyDown(e: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  currentTarget?: EventTarget | null;
  preventDefault: () => void;
}) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length > 1) return;
  if (/^[0-9]$/.test(e.key)) return;
  if (e.key === ".") {
    const input = e.currentTarget as HTMLInputElement | null;
    const val = input?.value ?? "";
    if (!val.includes(".")) return;
  }
  e.preventDefault();
}

/**
 * บล็อกการวาง (Paste) ข้อความที่ไม่ใช่ตัวเลขลงในช่องตัวเลข
 */
export function blockNonNumericPaste(e: {
  clipboardData?: DataTransfer | null;
  preventDefault: () => void;
}) {
  const text = e.clipboardData?.getData("text") ?? "";
  if (!/^\d*(\.\d*)?$/.test(text.trim())) {
    e.preventDefault();
  }
}

/**
 * กรองเฉพาะตัวเลขและจุดทศนิยมสำหรับ parser ของ InputNumber
 */
export function numericParser(displayValue: string | undefined): string {
  if (!displayValue) return "";
  const cleaned = displayValue.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
}

/**
 * บล็อกการพิมพ์จุดทศนิยม ตัวอักษร สัญลักษณ์ และเครื่องหมายลบ (-) สำหรับหน่วยนับที่เป็นจำนวนเต็มเท่านั้น
 */
export function blockIntegerKeyDown(e: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault: () => void;
}) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length > 1) return;
  if (/^[0-9]$/.test(e.key)) return;
  e.preventDefault();
}

/**
 * บล็อกการวาง (Paste) ข้อความที่ไม่ใช่จำนวนเต็ม
 */
export function blockNonIntegerPaste(e: {
  clipboardData?: DataTransfer | null;
  preventDefault: () => void;
}) {
  const text = e.clipboardData?.getData("text") ?? "";
  if (!/^\d+$/.test(text.trim())) {
    e.preventDefault();
  }
}

/**
 * กรองเฉพาะตัวเลขจำนวนเต็ม (0-9) สำหรับ parser ของ InputNumber
 */
export function integerParser(displayValue: string | undefined): string {
  if (!displayValue) return "";
  return displayValue.replace(/[^0-9]/g, "");
}
