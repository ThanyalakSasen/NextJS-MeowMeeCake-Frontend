// ─────────────────────────────────────────────────────────────
// customizationForm.ts — pure: state ของตัวแก้กลุ่มตัวเลือก/ออปชัน + แปลงไป-กลับ API + ตรวจก่อนบันทึก
// กติกาตรวจตรงกับ backend saveProductCustomization() — ผิดตรงไหนบอกได้ก่อนส่ง (backend ตรวจซ้ำเสมอ)
// ─────────────────────────────────────────────────────────────
import {
  CUSTOMIZATION_LIMITS as L,
  LEGACY_GROUP_ID,
  type ProductCustomization,
  type ProductCustomizationInput,
} from "@/types/productCustomization";

let seq = 0;
/** key ของแถวในหน้าจอ (React key) — แถวที่มีอยู่แล้วใช้ _id · แถวใหม่สุ่ม */
const newKey = () => `new-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export interface VariantRow {
  key: string;
  _id: string | null;
  name: string;
  price: number | null;
}

export interface GroupRow {
  key: string;
  /** null = กลุ่มใหม่ · กลุ่ม legacy ก็เป็น null (ยังไม่มีเอกสารจริง) */
  _id: string | null;
  name: string;
  min: number | null;
  max: number | null;
  variants: VariantRow[];
}

export interface OptionRow {
  key: string;
  _id: string | null;
  name: string;
  isText: boolean;
  maxLength: number | null;
  price: number | null;
  required: boolean;
}

export interface CustomizationState {
  groups: GroupRow[];
  options: OptionRow[];
}

export const emptyVariant = (): VariantRow => ({ key: newKey(), _id: null, name: "", price: 0 });
export const emptyGroup = (): GroupRow => ({ key: newKey(), _id: null, name: "", min: 1, max: 1, variants: [emptyVariant()] });
export const emptyOption = (): OptionRow => ({
  key: newKey(), _id: null, name: "", isText: false, maxLength: L.defaultTextLength, price: 0, required: false,
});

export function fromCustomization(c: ProductCustomization): CustomizationState {
  return {
    groups: c.groups.map((g) => ({
      key: g._id,
      _id: g._id === LEGACY_GROUP_ID ? null : g._id,
      name: g.group_name,
      min: g.min_select,
      max: g.max_select,
      variants: g.variants.map((v) => ({ key: v._id, _id: v._id, name: v.variant_name, price: v.variant_price })),
    })),
    options: c.options.map((o) => ({
      key: o._id,
      _id: o._id,
      name: o.option_name,
      isText: o.is_text_input,
      maxLength: o.max_text_length ?? L.defaultTextLength,
      price: o.extra_price,
      required: o.is_required,
    })),
  };
}

const cleanName = (s: string) => s.replace(/\s+/g, " ").trim();

export function toInput(s: CustomizationState): ProductCustomizationInput {
  return {
    groups: s.groups.map((g) => ({
      ...(g._id ? { _id: g._id } : {}),
      group_name: cleanName(g.name),
      min_select: g.min ?? 0,
      max_select: g.max ?? 1,
      variants: g.variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        variant_name: cleanName(v.name),
        variant_price: v.price ?? 0,
      })),
    })),
    options: s.options.map((o) => ({
      ...(o._id ? { _id: o._id } : {}),
      option_name: cleanName(o.name),
      is_text_input: o.isText,
      max_text_length: o.isText ? o.maxLength : null,
      extra_price: o.price ?? 0,
      is_required: o.required,
    })),
  };
}

/** ปัญหา 1 ข้อ — key ของ i18n (customization.err*) + ค่าแทรก */
export interface Problem {
  key: string;
  params?: Record<string, string | number>;
}

const priceOk = (p: number | null) => p === null || (Number.isFinite(p) && p >= 0 && p <= L.maxPrice);

/** ตรวจทั้งชุดแบบเดียวกับ backend — คืนรายการปัญหา (ว่าง = บันทึกได้) */
export function validate(s: CustomizationState): Problem[] {
  const out: Problem[] = [];
  if (s.groups.length > L.maxGroups) out.push({ key: "errTooManyGroups", params: { n: L.maxGroups } });
  if (s.options.length > L.maxOptions) out.push({ key: "errTooManyOptions", params: { n: L.maxOptions } });

  const groupNames = new Set<string>();
  s.groups.forEach((g, gi) => {
    const name = cleanName(g.name);
    const label = name || String(gi + 1);
    if (!name) out.push({ key: "errGroupName", params: { n: gi + 1 } });
    else if (name.length > L.maxName) out.push({ key: "errNameTooLong", params: { name, n: L.maxName } });
    else if (groupNames.has(name.toLowerCase())) out.push({ key: "errGroupDuplicate", params: { name } });
    groupNames.add(name.toLowerCase());

    if (g.variants.length === 0) out.push({ key: "errGroupEmpty", params: { group: label } });
    if (g.variants.length > L.maxVariantsPerGroup) {
      out.push({ key: "errTooManyVariants", params: { group: label, n: L.maxVariantsPerGroup } });
    }
    const variantNames = new Set<string>();
    g.variants.forEach((v, vi) => {
      const vName = cleanName(v.name);
      if (!vName) out.push({ key: "errVariantName", params: { group: label, n: vi + 1 } });
      else if (vName.length > L.maxName) out.push({ key: "errNameTooLong", params: { name: vName, n: L.maxName } });
      else if (variantNames.has(vName.toLowerCase())) out.push({ key: "errVariantDuplicate", params: { group: label, name: vName } });
      variantNames.add(vName.toLowerCase());
      if (!priceOk(v.price)) out.push({ key: "errPrice", params: { name: vName || String(vi + 1), max: L.maxPrice } });
    });

    const min = g.min ?? 0;
    const max = g.max ?? 1;
    if (!Number.isInteger(min) || min < 0 || !Number.isInteger(max) || max < 1) {
      out.push({ key: "errSelectCount", params: { group: label } });
    } else if (min > max) {
      out.push({ key: "errMinOverMax", params: { group: label } });
    } else if (min > g.variants.length) {
      out.push({ key: "errMinOverVariants", params: { group: label } });
    }
  });

  const optionNames = new Set<string>();
  s.options.forEach((o, i) => {
    const name = cleanName(o.name);
    if (!name) out.push({ key: "errOptionName", params: { n: i + 1 } });
    else if (name.length > L.maxName) out.push({ key: "errNameTooLong", params: { name, n: L.maxName } });
    else if (optionNames.has(name.toLowerCase())) out.push({ key: "errOptionDuplicate", params: { name } });
    optionNames.add(name.toLowerCase());
    if (!priceOk(o.price)) out.push({ key: "errPrice", params: { name: name || String(i + 1), max: L.maxPrice } });
    if (o.isText && (!Number.isInteger(o.maxLength) || (o.maxLength ?? 0) < 1 || (o.maxLength ?? 0) > L.maxTextLimit)) {
      out.push({ key: "errTextLength", params: { name: name || String(i + 1), max: L.maxTextLimit } });
    }
  });
  return out;
}

/** สรุปกติกาของกลุ่มเป็นข้อความสั้น (บังคับ/ไม่บังคับ · เลือกได้กี่อย่าง) — คืน key + params ให้ View แปล */
export function groupRuleOf(g: Pick<GroupRow, "min" | "max">): { required: boolean; single: boolean; max: number } {
  const max = g.max ?? 1;
  return { required: (g.min ?? 0) >= 1, single: max <= 1, max };
}

// ── แก้ state แบบ immutable (ใช้จาก ViewModel) ──
export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
