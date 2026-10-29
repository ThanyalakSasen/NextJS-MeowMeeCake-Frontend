// ─────────────────────────────────────────────────────────────
// bannerForm.ts — helper ล้วนของ Store Design (สถานะแบนเนอร์ + แปลงค่าฟอร์ม)
// สถานะ "scheduled"/"expired" ไม่มีใน DB — คำนวณจาก start_date ที่ยังไม่ถึง / end_date ที่เลยไปแล้ว
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { Banner, BannerInput } from "@/types/banner";
import type { BannerStatus } from "@/constants/enumConfig";

/** ลำดับเดียวกับ couponForm.ts deriveCouponStatus(): ปิดเอง > หมดอายุ > รอตามกำหนด > กำลังแสดง
 *  end_date เก็บเป็นสิ้นวันสุดท้าย (toInput) → แบนเนอร์แสดงได้ตลอดวันสุดท้าย หมดอายุตั้งแต่วันถัดไป
 *  (แบนเนอร์ที่บันทึกก่อนแก้อาจติดเวลากลางวันอยู่ — เทียบแบบรายวันไว้ ไม่ให้สถานะเปลี่ยนกลางวัน) */
export function getBannerStatus(b: Pick<Banner, "is_active" | "start_date" | "end_date">): BannerStatus {
  if (!b.is_active) return "inactive";
  const now = dayjs();
  if (b.end_date && dayjs(b.end_date).isBefore(now, "day")) return "expired";
  if (b.start_date && dayjs(b.start_date).isAfter(now)) return "scheduled";
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

// ช่องว่างส่งค่า "ล้าง" เสมอ (ไม่ใช่ไม่ส่ง key — PATCH ที่ไม่ส่ง key คงค่าเดิม ลบออกไม่ได้)
// ข้อความ = "" · ช่วงวันที่ = null (backend schemas/catalog.ts รับ nullish — null = แสดงตลอด)
export function toInput(v: BannerFormValue): Omit<BannerInput, "sort_order"> {
  const link = v.banner_link?.trim();
  const [start, end] = v.dateRange ?? [];
  return {
    banner_name: v.banner_name.trim(),
    banner_img: v.banner_img ?? "",
    banner_description: v.banner_description?.trim() ?? "",
    is_active: v.is_active,
    // ว่าง = "" (ไม่ใช่ไม่ส่ง) — PATCH ที่ไม่ส่ง key คงลิงก์เดิมไว้ ล้างช่องตอนแก้ไขจึงไม่เคยล้างได้ · backend รับ "" (schemas/catalog.ts)
    banner_link: link ?? "",
    // DatePicker ติดเวลาตอนกดเลือกมาด้วย — หน้าร้าน (HeroCarousel) เทียบถึงระดับเวลา เดิมแบนเนอร์จึงหายกลางวันสุดท้าย
    // (เวลาที่บังเอิญกดเลือก) ทั้งที่หลังร้านยังขึ้น "กำลังแสดง" · เริ่ม = ต้นวัน · สิ้นสุด = สิ้นวัน (แบบเดียวกับ roundDates.ts)
    start_date: start ? start.startOf("day").toISOString() : null,
    end_date: end ? end.endOf("day").toISOString() : null,
  };
}
