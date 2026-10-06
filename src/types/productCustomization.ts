// ─────────────────────────────────────────────────────────────
// src/types/productCustomization.ts — กลุ่มตัวเลือก + ออปชันเสริมของสินค้า
// ตรงกับ backend src/services/productCustomizationService.ts (customer-backend-merge.md §8.3)
//   กลุ่ม (เช่น "ขนาด" เลือก 1 · "ท็อปปิ้ง" เลือกได้ 0–2) — ราคาตัวเลือก = ราคาที่ "บวกเพิ่ม" · ไม่มีสต็อกแยก
//   ออปชันเสริม — ติ๊กเลือก (เช่น เทียน +20) หรือกรอกข้อความ (เช่น ข้อความบนเค้ก) · บังคับได้
// ─────────────────────────────────────────────────────────────

/** ตัวเลือกเก่าก่อนมีกลุ่ม — backend รวมเป็นกลุ่มนี้ (ยังไม่มีเอกสารจริง · บันทึกแล้วได้กลุ่มจริง) */
export const LEGACY_GROUP_ID = "legacy";

export interface CustomizationVariant {
  _id: string;
  variant_name: string;
  /** บาทที่บวกเพิ่มจากราคาสินค้า */
  variant_price: number;
}

export interface CustomizationGroup {
  _id: string;
  group_name: string;
  /** 0 = ไม่บังคับ */
  min_select: number;
  max_select: number;
  variants: CustomizationVariant[];
}

export interface CustomizationOption {
  _id: string;
  option_name: string;
  is_text_input: boolean;
  /** เฉพาะช่องกรอกข้อความ · null = ใช้ค่าเริ่มต้นของ backend (100) */
  max_text_length: number | null;
  extra_price: number;
  is_required: boolean;
}

export interface ProductCustomization {
  groups: CustomizationGroup[];
  options: CustomizationOption[];
}

/** body ของ PUT — ส่งทั้งชุด: มี _id = แก้ · ไม่มี = เพิ่ม · หายไปจากชุด = ลบ */
export interface ProductCustomizationInput {
  groups: {
    _id?: string;
    group_name: string;
    min_select: number;
    max_select: number;
    variants: { _id?: string; variant_name: string; variant_price: number }[];
  }[];
  options: {
    _id?: string;
    option_name: string;
    is_text_input: boolean;
    max_text_length: number | null;
    extra_price: number;
    is_required: boolean;
  }[];
}

/** ข้อจำกัดของ backend (productCustomizationService.ts) — ตรวจฝั่งหน้าจอให้ตรงกัน */
export const CUSTOMIZATION_LIMITS = {
  maxGroups: 10,
  maxVariantsPerGroup: 20,
  maxOptions: 20,
  maxName: 100,
  maxPrice: 100_000,
  maxTextLimit: 200,
  defaultTextLength: 100,
} as const;
