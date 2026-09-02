// ─────────────────────────────────────────────────────────────
// src/types/banner.ts — DTO ของ /banners (docs/API_CONTRACT.md §3)
// แบนเนอร์หน้าร้านออนไลน์ · สถานะ "scheduled" คำนวณฝั่ง frontend จาก start_date
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

export type BannerInput = Omit<Banner, "_id" | "created_at" | "updated_at">;

export type BannerListParams = ListParams;
