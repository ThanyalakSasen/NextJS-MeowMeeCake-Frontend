// ─────────────────────────────────────────────────────────────
// bannerForm.ts — helper ล้วนของ Store Design (สถานะแบนเนอร์ + แปลงค่าฟอร์ม)
// สถานะ "scheduled" ไม่มีใน DB — คำนวณจาก start_date ที่ยังไม่ถึง
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { Banner, BannerInput } from "@/types/banner";
import type { BannerStatus } from "@/constants/enumConfig";

export function getBannerStatus(b: Pick<Banner, "is_active" | "start_date">): BannerStatus {
  if (!b.is_active) return "inactive";
  if (b.start_date && dayjs(b.start_date).isAfter(dayjs())) return "scheduled";
  return "active";
}

// sort_order ไม่อยู่ในฟอร์มแล้ว — จัดลำดับด้วยการลากการ์ด (ดู useStoreDesignViewModel.onReorder)
// ตอนสร้างใหม่ ViewModel เป็นคนเติม sort_order ให้ (ต่อท้ายลำดับสุดท้าย) ก่อนยิง create จริง
export interface BannerFormValue {
  banner_name: string;
  banner_img?: string;
  banner_description?: string;
  banner_link?: string;
  dateRange?: [Dayjs, Dayjs] | null;
  is_active: boolean;
}

export const emptyBannerForm: BannerFormValue = {
  banner_name: "",
  is_active: true,
};

export function fromBanner(b: Banner): BannerFormValue {
  return {
    banner_name: b.banner_name,
    banner_img: b.banner_img || undefined,
    banner_description: b.banner_description ?? undefined,
    banner_link: b.banner_link ?? undefined,
    dateRange: b.start_date && b.end_date ? [dayjs(b.start_date), dayjs(b.end_date)] : null,
    is_active: b.is_active,
  };
}

// backend รับ field เสริมพวกนี้เป็น "ไม่ส่งมา" (undefined) เท่านั้น — ส่ง null ตรง ๆ ไม่ได้
// (zod `.optional()` ไม่ใช่ `.nullable()`, ดูคอมเมนต์ที่ types/banner.ts) จึง omit key แทนส่ง null
// banner_description เป็นข้อยกเว้น — schema รับ "" (string ว่าง) ได้อยู่แล้ว จึงส่งตรง ๆ ได้เสมอ
// (แก้ไขแล้วลบข้อความที่เคยกรอกไว้ให้ว่างได้จริง ไม่เหมือน banner_link/date ที่เคลียร์ผ่าน API ไม่ได้)
export function toInput(v: BannerFormValue): Omit<BannerInput, "sort_order"> {
  const link = v.banner_link?.trim();
  const [start, end] = v.dateRange ?? [];
  return {
    banner_name: v.banner_name.trim(),
    banner_img: v.banner_img ?? "",
    banner_description: v.banner_description?.trim() ?? "",
    is_active: v.is_active,
    ...(link ? { banner_link: link } : {}),
    ...(start ? { start_date: start.toISOString() } : {}),
    ...(end ? { end_date: end.toISOString() } : {}),
  };
}
