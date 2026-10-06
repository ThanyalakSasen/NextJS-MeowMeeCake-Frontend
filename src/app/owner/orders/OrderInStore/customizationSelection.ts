// ─────────────────────────────────────────────────────────────
// customizationSelection.ts — pure: ตัวเลือกที่พนักงานเลือกใน POS → ตรวจ + ราคาเพิ่ม + ข้อความแสดง + key ของบรรทัด
// กติกาตรงกับ backend productCustomizationService.resolveCustomization() (BACKLOG3-merge I4) — backend ตรวจซ้ำเสมอ
// ─────────────────────────────────────────────────────────────
import { CUSTOMIZATION_LIMITS, type ProductCustomization } from "@/types/productCustomization";

/** ค่าที่เลือก: ตัวเลือกที่ติ๊กในทุกกลุ่ม + ออปชัน (ติ๊ก = "" · ข้อความ = ข้อความที่กรอก) */
export interface Picked {
  variantIds: string[];
  /** option_id → ข้อความ ("" สำหรับออปชันแบบติ๊ก) · ไม่มี key = ไม่เลือก */
  options: Record<string, string>;
}

export interface SelectedOptionLine {
  option_id: string;
  option_name: string;
  extra_price: number;
  text_value: string | null;
}

/** ผลที่พร้อมลงบิล */
export interface CartSelection {
  variantIds: string[];
  options: SelectedOptionLine[];
  /** ราคาที่บวกเพิ่มต่อชิ้น (บาท) */
  extra: number;
  /** เช่น "ขนาด: 2 ปอนด์ · รสชาติ: วานิลลา, มะยงชิด" — รูปแบบเดียวกับ backend joinSelectedVariants */
  variantLabel: string | null;
  /** แยกบรรทัดในบิล: สินค้าเดียวกันคนละตัวเลือก = คนละบรรทัด ("" = ไม่มีตัวเลือก) */
  key: string;
}

export const EMPTY_SELECTION: CartSelection = { variantIds: [], options: [], extra: 0, variantLabel: null, key: "" };

export const hasCustomization = (c: ProductCustomization | null | undefined) =>
  !!c && (c.groups.length > 0 || c.options.length > 0);

/** ปัญหาที่ทำให้ยังลงบิลไม่ได้ — key ของ i18n (pos.pick*) + ค่าแทรก */
export interface PickProblem {
  key: "pickGroupRequired" | "pickGroupMin" | "pickGroupMax" | "pickOptionRequired" | "pickTextRequired" | "pickTextTooLong";
  params: Record<string, string | number>;
}

const cleanText = (s: string) => s.replace(/\s+/g, " ").trim();

export function checkPicked(c: ProductCustomization, picked: Picked): PickProblem[] {
  const wanted = new Set(picked.variantIds);
  const out: PickProblem[] = [];
  for (const g of c.groups) {
    const n = g.variants.filter((v) => wanted.has(v._id)).length;
    if (n < g.min_select) {
      out.push(
        g.min_select === 1 && g.max_select === 1
          ? { key: "pickGroupRequired", params: { group: g.group_name } }
          : { key: "pickGroupMin", params: { group: g.group_name, n: g.min_select } },
      );
    }
    if (n > g.max_select) out.push({ key: "pickGroupMax", params: { group: g.group_name, n: g.max_select } });
  }
  for (const o of c.options) {
    const value = picked.options[o._id];
    if (o.is_text_input) {
      const text = cleanText(value ?? "");
      const max = o.max_text_length ?? CUSTOMIZATION_LIMITS.defaultTextLength;
      if (!text && o.is_required) out.push({ key: "pickTextRequired", params: { option: o.option_name } });
      if (text.length > max) out.push({ key: "pickTextTooLong", params: { option: o.option_name, n: max } });
    } else if (value === undefined && o.is_required) {
      out.push({ key: "pickOptionRequired", params: { option: o.option_name } });
    }
  }
  return out;
}

/** ค่าที่เลือก (ผ่าน checkPicked แล้ว) → ข้อมูลบรรทัดในบิล */
export function toSelection(c: ProductCustomization, picked: Picked): CartSelection {
  const wanted = new Set(picked.variantIds);
  const variants = c.groups.flatMap((g) =>
    g.variants.filter((v) => wanted.has(v._id)).map((v) => ({ group: g.group_name, ...v })),
  );
  const options: SelectedOptionLine[] = [];
  for (const o of c.options) {
    const value = picked.options[o._id];
    if (value === undefined) continue;
    if (o.is_text_input) {
      const text = cleanText(value);
      if (!text) continue; // ไม่กรอก = ไม่เลือก (ไม่คิดเงิน) — เหมือน backend
      options.push({ option_id: o._id, option_name: o.option_name, extra_price: o.extra_price, text_value: text });
    } else {
      options.push({ option_id: o._id, option_name: o.option_name, extra_price: o.extra_price, text_value: null });
    }
  }

  const byGroup = new Map<string, string[]>();
  for (const v of variants) byGroup.set(v.group, [...(byGroup.get(v.group) ?? []), v.variant_name]);
  const variantLabel = variants.length
    ? [...byGroup.entries()].map(([group, names]) => (group ? `${group}: ${names.join(", ")}` : names.join(", "))).join(" · ")
    : null;

  const extra =
    Math.round((variants.reduce((s, v) => s + v.variant_price, 0) + options.reduce((s, o) => s + o.extra_price, 0)) * 100) / 100;
  const variantIds = variants.map((v) => v._id);
  const variantKey = [...variantIds].sort().join(",");
  const optionKey = options.map((o) => `${o.option_id}=${o.text_value ?? ""}`).join("|");
  return { variantIds, options, extra, variantLabel, key: variantKey || optionKey ? `${variantKey}#${optionKey}` : "" };
}

/** ค่าตั้งต้นของหน้าต่างเลือก: กลุ่มบังคับเลือก 1 ที่มีตัวเลือกเดียว → เลือกให้เลย */
export function initialPicked(c: ProductCustomization): Picked {
  const variantIds = c.groups
    .filter((g) => g.min_select >= 1 && g.variants.length === 1)
    .map((g) => g.variants[0]._id);
  return { variantIds, options: {} };
}

/** ติ๊ก/ยกเลิกตัวเลือกในกลุ่ม — กลุ่มเลือกได้อย่างเดียว = สลับ (radio) · หลายอย่าง = ติ๊กเพิ่มจนถึง max */
export function toggleVariant(c: ProductCustomization, picked: Picked, groupId: string, variantId: string): Picked {
  const group = c.groups.find((g) => g._id === groupId);
  if (!group) return picked;
  const inGroup = new Set(group.variants.map((v) => v._id));
  const current = picked.variantIds.filter((id) => inGroup.has(id));
  const others = picked.variantIds.filter((id) => !inGroup.has(id));
  let next: string[];
  if (group.max_select <= 1) next = current.includes(variantId) && group.min_select === 0 ? [] : [variantId];
  else if (current.includes(variantId)) next = current.filter((id) => id !== variantId);
  else if (current.length < group.max_select) next = [...current, variantId];
  else next = current; // เต็มแล้ว — ต้องเอาออกก่อน
  return { ...picked, variantIds: [...others, ...next] };
}
