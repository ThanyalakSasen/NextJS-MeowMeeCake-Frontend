// ─────────────────────────────────────────────────────────────
// src/types/preorderRound.ts — DTO ของ /admin/preorder-rounds* + /admin/preorder-round-items/[id]
// (preorderRoundModel/preorderRoundItemModel จริงฝั่ง backend)
//
// price_override: schema จริง (schemas/preorderRound.ts) เป็น .nullish() (ต่างจากฟิลด์อื่นในไฟล์นี้ที่
// เป็น .optional() เฉย ๆ) — ส่ง null ตรง ๆ ได้เพื่อ "เคลียร์" ราคาพิเศษกลับไปใช้ราคาสินค้าปกติ ส่วน
// min_order_qty/is_active เป็น .optional() เท่านั้น ห้ามส่ง null (ต้อง omit key ถ้าไม่ตั้งค่า)
//
// backend populate product_id เป็น object เต็มตอน getRoundDetail()/listRoundItems() — denormalize
// เป็น product_name/product_img ที่ services/preorderRounds.ts จุดเดียว (แพทเทิร์นเดียวกับ
// services/orders.ts toOrder())
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { RoundStatus } from "@/constants/enumConfig";

export type { RoundStatus };

export interface PreorderRoundItem {
  _id: string;
  round_id: string;
  product_id: string;
  product_name: string;
  product_img?: string[];
  /** null = ใช้ราคาสินค้าปกติ (sale_price ?? product_price) */
  price_override: number | null;
  min_order_qty: number;
  max_qty_total: number;
  current_qty: number;
  is_active: boolean;
  /** ราคาที่ใช้จริง = price_override ?? sale_price ?? product_price — backend คำนวณให้ */
  current_price: number;
  /** max_qty_total - current_qty (ไม่ติดลบ) — backend คำนวณให้ */
  remaining_qty: number;
  created_at: string;
  updated_at: string;
}

export interface PreorderRound {
  _id: string;
  round_name: string;
  open_date: string;
  close_date: string;
  pickup_date: string;
  round_status: RoundStatus;
  created_by: string;
  /** มีเฉพาะตอน list (นับจาก PreorderRoundItem ที่ยังไม่ลบ) */
  item_count?: number;
  /** มีเฉพาะตอน get/create/update รายตัว — list ไม่มี */
  items?: PreorderRoundItem[];
  created_at: string;
  updated_at: string;
}

export interface RoundItemInput {
  product_id: string;
  /** เว้นว่าง = ใช้ราคาสินค้าปกติ · ส่ง null ได้ (schema .nullish()) เพื่อเคลียร์ราคาพิเศษ */
  price_override?: number | null;
  min_order_qty?: number;
  max_qty_total: number;
  is_active?: boolean;
}

/** POST /admin/preorder-rounds — สร้างรายการสินค้าในรอบไปพร้อมกันได้เลย (ไม่บังคับ) */
export interface CreateRoundInput {
  round_name: string;
  open_date: string;
  close_date: string;
  pickup_date: string;
  round_status?: RoundStatus;
  items?: RoundItemInput[];
}

/** PATCH /admin/preorder-rounds/[id] — round_name/open_date/close_date/pickup_date เท่านั้น
 *  (backend ปฏิเสธ 400 ถ้าไม่ส่งฟิลด์ใดเลย — ผู้เรียกต้องส่งอย่างน้อย 1 ฟิลด์ที่เปลี่ยนจริง) */
export type UpdateRoundInput = Partial<
  Pick<CreateRoundInput, "round_name" | "open_date" | "close_date" | "pickup_date">
>;

/** PATCH /admin/preorder-round-items/[id] — ต้องส่งอย่างน้อย 1 ฟิลด์ (backend ปฏิเสธ 400 ถ้าไม่ส่งเลย) */
export type UpdateRoundItemInput = Partial<RoundItemInput>;

export interface RoundListParams extends ListParams {
  /** ชื่อ query param จริงคือ "status" ไม่ใช่ "round_status" (ดู /api/admin/preorder-rounds/route.ts) */
  status?: RoundStatus;
  upcomingOnly?: boolean;
}
