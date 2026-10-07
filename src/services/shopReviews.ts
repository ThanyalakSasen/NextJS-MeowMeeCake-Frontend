// ─────────────────────────────────────────────────────────────
// src/services/shopReviews.ts — เขียนรีวิวสินค้าที่ซื้อแล้ว · หน้าร้าน (BACKLOG3-merge D7)
//   GET  /catalog/review-aspects        แง่มุมที่เปิดใช้งาน (สาธารณะ · icon เป็น key ที่ backend แปลงค่าเริ่มต้นให้แล้ว)
//   GET  /shop/reviews                  รีวิวของฉัน — ใช้หาว่ารายการไหนรีวิวแล้ว (1 รีวิว/รายการ)
//   POST /shop/reviews/upload           รูป ≤ 5 MB · วิดีโอ ≤ 30 MB (multipart { file, type }) → { url }
//   DELETE /shop/reviews/upload         ลบไฟล์ค้างเมื่อส่งรีวิวไม่สำเร็จ (เฉพาะไฟล์ของเราที่ยังไม่มีรีวิวอ้างถึง)
//   POST /shop/reviews                  ส่งแบบ …_ids เสมอ (1 ชิ้นก็ได้) → { data, failed } · ไม่ผ่านเลยสักชิ้น = error ของชิ้นแรก
// backend reviewService: รีวิวได้เมื่อออเดอร์/พรีออเดอร์ completed + ชำระแล้ว · แต้ม 15 (มีรูป 20) ต่อรายการ
// ─────────────────────────────────────────────────────────────
import { http, LIST_ALL } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export type ReviewKind = "order" | "preorder";
export type AspectSentiment = "positive" | "negative";

export interface ReviewAspect {
  _id: string;
  aspect_name_th: string;
  aspect_name_eng: string | null;
  placeholder_text: string | null;
  icon: string | null;
}

/** รีวิวของฉัน — เฉพาะ field ที่หน้าเว็บใช้ */
export interface MyReview {
  _id: string;
  order_item_id: string | null;
  preorder_order_item_id: string | null;
}

export interface CreateReviewsInput {
  kind: ReviewKind;
  itemIds: string[];
  rating: number;
  review_text?: string;
  image?: string[];
  video?: string;
  aspect_feedback?: { aspect_id: string; sentiment: AspectSentiment }[];
}

export interface CreateReviewsResult {
  /** id ของรายการที่ส่งรีวิวไม่ผ่าน + เหตุผลจาก backend */
  failed: { item_id: string; message: string }[];
}

const idOf = (v: unknown): string | null => (v == null ? null : String((v as { _id?: unknown })._id ?? v));

export const shopReviewsService = {
  aspects: async (): Promise<ReviewAspect[]> =>
    (await http.getList<ReviewAspect>("/catalog/review-aspects")).data,

  mine: async (): Promise<MyReview[]> => {
    const res = await http.getList<Record<string, unknown>>("/shop/reviews", { params: { limit: LIST_ALL } });
    return res.data.map((r) => ({
      _id: String(r._id),
      order_item_id: idOf(r.order_item_id),
      preorder_order_item_id: idOf(r.preorder_order_item_id),
    }));
  },

  upload: async (file: File, type: "image" | "video"): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    // ไฟล์วิดีโอใหญ่ — ให้เวลามากกว่า timeout ปกติ (15 วิ)
    const res = await http.post<ItemResponse<{ url: string }>>("/shop/reviews/upload", form, { timeout: 120_000 });
    return res.data.url;
  },

  /** ลบไม่ได้ก็ไม่ต้องแจ้งผู้ใช้ (ไฟล์ค้างไม่กระทบรีวิว) */
  discardUploads: async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;
    await http.delete("/shop/reviews/upload", { data: { urls } }).catch(() => undefined);
  },

  create: async ({ kind, itemIds, ...content }: CreateReviewsInput): Promise<CreateReviewsResult> => {
    const res = await http.post<ItemResponse<CreateReviewsResult>>("/shop/reviews", {
      ...content,
      [kind === "preorder" ? "preorder_item_ids" : "order_item_ids"]: itemIds,
    });
    return { failed: res.data?.failed ?? [] };
  },
};
