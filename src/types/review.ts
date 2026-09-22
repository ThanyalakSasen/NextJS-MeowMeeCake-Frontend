// ─────────────────────────────────────────────────────────────
// src/types/review.ts — DTO ของ /admin/reviews (reviewModel.ts จริงฝั่ง backend)
// admin ทำได้แค่ "ดู + ควบคุมการแสดงผล" เท่านั้น — ไม่มี endpoint ให้สร้าง/แก้ไขเนื้อหารีวิวเลย
// (รีวิวสร้างได้จากลูกค้าที่ออเดอร์ completed แล้วเท่านั้น ผ่าน /api/shop/reviews คนละ endpoint)
// backend populate user_id/product_id เป็น object เต็มตอน GET/list ใช้ refId() ดึง id ตอนต้องใช้เทียบ
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { SentimentLabel } from "@/constants/enumConfig";

export interface Review {
  _id: string;
  user_id: string | { _id: string; user_fullname: string; user_img?: string | null };
  product_id: string | { _id: string; product_name_th: string; product_name_eng?: string };
  order_item_id: string;
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
