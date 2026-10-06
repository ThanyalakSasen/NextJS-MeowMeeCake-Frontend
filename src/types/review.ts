// ─────────────────────────────────────────────────────────────
// src/types/review.ts — DTO ของ /admin/reviews (reviewModel.ts จริงฝั่ง backend)
// admin สร้าง/แก้เนื้อหารีวิวไม่ได้ · จัดการได้: ซ่อน/แสดง (/visibility) + PATCH /admin/reviews/:id (สถานะ · ปักหมุด ·
// ตอบกลับ · แท็ก/โน้ตภายใน — backend §8.20 · หน้าจอยังไม่ใช้ → BACKLOG3-merge E4) · สิทธิ์เมนู reports
// (รีวิวสร้างได้จากลูกค้าที่ออเดอร์ completed แล้วเท่านั้น ผ่าน /api/shop/reviews คนละ endpoint)
// backend populate user_id/product_id เป็น object เต็มตอน GET/list ใช้ refId() ดึง id ตอนต้องใช้เทียบ
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { SentimentLabel } from "@/constants/enumConfig";

export type ReviewStatus = "pending" | "approved" | "hidden";

export interface Review {
  _id: string;
  user_id: string | { _id: string; user_fullname: string; user_img?: string | null };
  product_id: string | { _id: string; product_name_th: string; product_name_eng?: string; product_img?: string | null };
  /** list ของหลังร้าน populate ถึงเลขออเดอร์ · รีวิวพรีออเดอร์ = null (ใช้ preorder_order_item_id) */
  order_item_id: string | { _id: string; order_id?: { _id: string; order_no: string } | null } | null;
  preorder_order_item_id?: string | { _id: string; preorder_id?: { _id: string; preorder_no: string } | null } | null;
  /** status กับ is_visible เปลี่ยนคู่กัน (approved = แสดง · hidden = ซ่อน) — backend §8.20 */
  status?: ReviewStatus;
  video?: string | null;
  is_pinned?: boolean;
  /** 1-5 เต็ม เป็นตัวเลขธรรมดา ไม่ใช่ Decimal128 (ต่างจาก Product.avg_rating) */
  rating: number;
  review_text?: string | null;
  image?: string[];
  is_analyzed: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewListParams extends ListParams {
  product_id?: string;
  user_id?: string;
  rating?: number;
  is_visible?: boolean;
  is_analyzed?: boolean;
  /** ตัวกรองเพิ่มของ backend §8.20 (reviewModerationService.listAdminReviews) */
  status?: ReviewStatus;
  category_id?: string;
}

/** GET /admin/reviews/[id]/sentiment เท่านั้น — ไม่มาใน list/get ของ review เอง (fetch แยกตอนเปิดดูรายละเอียด) */
export interface SentimentResult {
  _id: string;
  aspect_id: string | { _id: string; aspect_name_th: string; aspect_name_eng?: string };
  /** normalize เป็น number แล้วที่ services/reviews.ts (backend ส่ง Mongoose Decimal128 ดิบ) */
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  sentiment_result?: string;
  extracted_aspects?: string[];
}
