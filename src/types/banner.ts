// ─────────────────────────────────────────────────────────────
// src/types/banner.ts — DTO ของ /banners (docs/API_CONTRACT.md §3)
// แบนเนอร์หน้าร้านออนไลน์ · สถานะ "scheduled"/"expired" คำนวณฝั่ง frontend จาก start_date/end_date
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

export interface Banner {
  _id: string;
  banner_name: string;
  banner_description?: string;
  banner_img: string;
  banner_link?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** body ตอน POST/PATCH /admin/banners — start_date/end_date: null = ล้างช่วงวันที่ (แสดงตลอด) */
export interface BannerInput {
  banner_name: string;
  banner_description?: string;
  banner_img: string;
  banner_link?: string;
  start_date?: string | null;
  end_date?: string | null;
  sort_order: number;
  is_active?: boolean;
}

export type BannerListParams = ListParams;
