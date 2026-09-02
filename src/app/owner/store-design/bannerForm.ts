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

export interface BannerFormValue {
  banner_name: string;
  banner_img?: string;
  banner_link?: string;
  sort_order: number;
  dateRange?: [Dayjs, Dayjs] | null;
  is_active: boolean;
}

export const emptyBannerForm: BannerFormValue = {
  banner_name: "",
  sort_order: 1,
  is_active: true,
};

export function fromBanner(b: Banner): BannerFormValue {
  return {
    banner_name: b.banner_name,
    banner_img: b.banner_img || undefined,
    banner_link: b.banner_link ?? undefined,
    sort_order: b.sort_order,
    dateRange: b.start_date && b.end_date ? [dayjs(b.start_date), dayjs(b.end_date)] : null,
    is_active: b.is_active,
  };
}

export function toInput(v: BannerFormValue): BannerInput {
  return {
    banner_name: v.banner_name.trim(),
    banner_img: v.banner_img ?? "",
    banner_link: v.banner_link?.trim() || null,
    sort_order: v.sort_order ?? 1,
    is_active: v.is_active,
    start_date: v.dateRange?.[0] ? v.dateRange[0].toISOString() : null,
    end_date: v.dateRange?.[1] ? v.dateRange[1].toISOString() : null,
  };
}
