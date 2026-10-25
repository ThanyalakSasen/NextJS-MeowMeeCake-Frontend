// ─────────────────────────────────────────────────────────────
// src/services/shopReviews.ts — เขียนรีวิวสินค้าที่ซื้อแล้ว · หน้าร้าน (BACKLOG3-merge D7)
//   GET  /catalog/review-aspects        แง่มุมที่เปิดใช้งาน (สาธารณะ · icon เป็น key ที่ backend แปลงค่าเริ่มต้นให้แล้ว)
//   GET  /shop/reviews                  รีวิวของฉัน — ใช้หาว่ารายการไหนรีวิวแล้ว (1 รีวิว/รายการ) · หน้า "รีวิวของฉัน" (history)
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

/** รีวิวของฉันแบบเต็ม — หน้า "รีวิวของฉัน" (/customer/account/reviews) · รวมคำตอบจากร้าน */
export interface MyReviewDetail {
  _id: string;
  product: { id: string | null; name: string; image: string | null };
  rating: number;
  review_text: string | null;
  image: string[];
  video: string | null;
  aspect_feedback: { aspect_id: string; aspect_name_th: string; sentiment: AspectSentiment }[];
  /** ร้านซ่อนจากหน้าสินค้า (status hidden/pending หรือ is_visible false) — เจ้าของรีวิวยังเห็นเอง */
  hidden: boolean;
  from_preorder: boolean;
  /** null = ร้านยังไม่ตอบ */
  shop_reply: { text: string; replied_at: string | null } | null;
  /** รายการที่รีวิว (ออเดอร์/พรีออเดอร์) — null = รายการถูกลบไปแล้ว */
  item: ReviewedItem | null;
  /** สถานะรีวิว: แสดงบนหน้าสินค้า · รอร้านตรวจ · ร้านซ่อน */
  status: "approved" | "pending" | "hidden";
  created_at: string;
}

export interface ReviewedItem {
  /** _id ของออเดอร์/พรีออเดอร์ (ลิงก์ไปหน้ารายละเอียด) */
  order_id: string | null;
  order_no: string;
  ordered_at: string | null;
  /** พรีออเดอร์เท่านั้น */
  pickup_date: string | null;
  choices: string[];
  special_request: string | null;
  quantity: number;
  total_price: number;
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function reviewedItemOf(raw: any, kind: ReviewKind): ReviewedItem | null {
  if (!raw || typeof raw !== "object") return null;
  const parent = kind === "preorder" ? raw.preorder_id : raw.order_id;
  const p = parent && typeof parent === "object" ? parent : null;
  const variants: string[] = (Array.isArray(raw.selected_variants) ? raw.selected_variants : [])
    .map((v: any) => [v.group_name, v.variant_name].filter(Boolean).join(": "))
    .filter(Boolean);
  const options: string[] = (Array.isArray(raw.selected_options) ? raw.selected_options : [])
    .map((o: any) => `${o.option_name ?? ""}${o.text_value ? `: "${o.text_value}"` : ""}`)
    .filter(Boolean);
  return {
    order_id: idOf(parent),
    order_no: String((kind === "preorder" ? p?.preorder_no : p?.order_no) ?? ""),
    ordered_at: p?.created_at ? String(p.created_at) : null,
    pickup_date: raw.pickup_date ? String(raw.pickup_date) : null,
    choices: [...variants, ...options],
    special_request: raw.special_request ? String(raw.special_request) : null,
    quantity: Number(raw.quantity ?? 0),
    total_price: Number(raw.total_price ?? 0),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

  /** ประวัติรีวิวของฉัน (ใหม่ก่อน) — backend ตัดข้อมูลภายในของทีมงาน + ผู้ตอบ (replied_by) ออกแล้ว */
  history: async (): Promise<MyReviewDetail[]> => {
    const res = await http.getList<Record<string, any>>("/shop/reviews", { params: { limit: LIST_ALL } }); // eslint-disable-line @typescript-eslint/no-explicit-any
    return res.data.map((r) => {
      const p = r.product_id && typeof r.product_id === "object" ? r.product_id : null;
      const reply = r.shop_reply && typeof r.shop_reply.text === "string" && r.shop_reply.text.trim() ? r.shop_reply : null;
      return {
        _id: String(r._id),
        product: {
          id: idOf(r.product_id),
          name: String(p?.product_name_th ?? ""),
          image: Array.isArray(p?.product_img) && p.product_img[0] ? String(p.product_img[0]) : null,
        },
        rating: Number(r.rating ?? 0),
        review_text: r.review_text ?? null,
        image: Array.isArray(r.image) ? r.image.map(String) : [],
        video: r.video ?? null,
        aspect_feedback: Array.isArray(r.aspect_feedback)
          ? r.aspect_feedback.map((f: Record<string, unknown>) => ({
              aspect_id: String(f.aspect_id),
              aspect_name_th: String(f.aspect_name_th ?? ""),
              sentiment: f.sentiment === "negative" ? ("negative" as const) : ("positive" as const),
            }))
          : [],
        hidden: r.is_visible === false || r.status === "hidden" || r.status === "pending",
        from_preorder: !!r.preorder_order_item_id,
        shop_reply: reply ? { text: String(reply.text), replied_at: reply.replied_at ? String(reply.replied_at) : null } : null,
        item: r.preorder_order_item_id ? reviewedItemOf(r.preorder_order_item_id, "preorder") : reviewedItemOf(r.order_item_id, "order"),
        status: r.status === "pending" || r.status === "hidden" ? r.status : r.is_visible === false ? "hidden" : "approved",
        created_at: String(r.created_at ?? ""),
      };
    });
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
