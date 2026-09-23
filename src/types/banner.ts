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

/**
 * body ตอน POST/PATCH /admin/banners จริง — ต่างจาก Banner ตรงที่ backend (schemas/catalog.ts
 * bannerCreate) รับ field เสริมพวกนี้เป็น "ไม่ส่งมา" (undefined) เท่านั้น ส่ง `null` ตรง ๆ ไม่ได้
 * (zod `.optional()` ไม่ใช่ `.nullable()`) — ต่างจาก Banner (ที่อ่านจาก DB จริงได้ null สำหรับ
 * start_date/end_date เพราะ mongoose schema ตั้ง default: null ไว้)
 */
export interface BannerInput {
  banner_name: string;
  banner_description?: string;
  banner_img: string;
  banner_link?: string;
  start_date?: string;
  end_date?: string;
  sort_order: number;
  is_active?: boolean;
}

export type BannerListParams = ListParams;
