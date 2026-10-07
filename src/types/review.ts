// ─────────────────────────────────────────────────────────────
// src/types/review.ts — DTO ของ /admin/reviews (backend reviewModerationService · customer-backend-merge.md §8.20)
// admin สร้าง/แก้เนื้อหารีวิวไม่ได้ · จัดการได้ (PATCH /admin/reviews/:id): สถานะ · ปักหมุด · ตอบกลับ (ลูกค้าเห็น) ·
// แท็ก/โน้ตภายใน · อ่านแล้ว — สิทธิ์เมนู reports (BACKLOG4 E4)
// list populate user_id/product_id/เลขออเดอร์ · product_img เหลือรูปแรก (string) · มี status + analysis_source เสมอ
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { SentimentLabel } from "@/constants/enumConfig";

export type ReviewStatus = "pending" | "approved" | "hidden";
export type ReviewSort = "newest" | "oldest" | "lowest" | "highest" | "needs_reply";
/** ที่มาของผลวิเคราะห์หัวข้อ: ลูกค้าเลือกเอง · โมเดล NLP · อนุมานจากประโยคสำเร็จรูป (รีวิวเก่า) · ไม่มี */
export type AnalysisSource = "customer" | "model" | "inferred" | null;

export interface Review {
  _id: string;
  user_id: { _id: string; user_fullname: string; user_img?: string | null } | string | null;
  product_id: { _id: string; product_name_th: string; product_name_eng?: string; product_img?: string | null } | string | null;
  /** รีวิวพรีออเดอร์ = null (ใช้ preorder_order_item_id) */
  order_item_id: { _id: string; order_id?: { _id: string; order_no: string } | null } | string | null;
  preorder_order_item_id?: { _id: string; preorder_id?: { _id: string; preorder_no: string } | null } | string | null;
  /** status กับ is_visible เปลี่ยนคู่กัน (approved = แสดง · hidden = ซ่อน) */
  status: ReviewStatus;
  rating: number;
  review_text?: string | null;
  image?: string[];
  video?: string | null;
  is_pinned?: boolean;
  aspect_feedback?: { aspect_id: string | null; aspect_name_th?: string; sentiment: "positive" | "negative" }[];
  /** ประโยคสำเร็จรูปของรีวิวเก่า (backend เติมชื่อหัวข้อให้) */
  selected_presets?: { aspect_id: { _id: string; aspect_name_th: string } | string | null; rating_level: number; text: string }[];
  shop_reply?: { text: string; replied_at: string } | null;
  internal_tags?: string[];
  internal_note?: { text: string; updated_at: string } | null;
  read_at?: string | null;
  analysis_source?: AnalysisSource;
  is_analyzed: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewListParams extends ListParams {
  sort?: ReviewSort;
  q?: string;
  product_id?: string;
  category_id?: string;
  status?: ReviewStatus;
  rating?: number;
  sentiment_group?: "positive" | "neutral" | "negative";
  aspect_id?: string;
  sentiment?: "positive" | "negative";
  replied?: 0 | 1;
  read?: 0 | 1;
  has_media?: 0 | 1;
  order_kind?: "order" | "preorder";
  source?: "customer" | "inferred" | "model" | "none";
  since?: string;
  until?: string;
}

/** summary=1 — สรุปของชุดที่กรองทั้งหมด (ไม่ใช่แค่หน้าปัจจุบัน) */
export interface ReviewSummary {
  count: number;
  avg_rating: number | null;
  /** 0–1 · รีวิว 1-2 ดาว */
  negative_rate: number | null;
  unreplied_negative: number;
}

/** PATCH /admin/reviews/:id — ส่งบางส่วน · ตอบกลับ = นับว่าอ่านแล้ว · ข้อความว่าง = ลบคำตอบ/โน้ต */
export interface ReviewModeration {
  status?: ReviewStatus;
  is_pinned?: boolean;
  shop_reply_text?: string;
  internal_tags?: string[];
  internal_note_text?: string;
  read?: boolean;
}

export interface ReplySuggestion {
  text: string;
  used_count: number;
  rating_avg: number;
}

export interface ReviewFilterOptions {
  products: { product_id: string; product_name_th: string; is_deleted: boolean; review_count: number; avg_rating: number }[];
  categories: { category_id: string; category_name: string; review_count: number; avg_rating: number }[];
  reply_suggestions: ReplySuggestion[];
}

/** GET /admin/reviews/[id]/sentiment เท่านั้น — fetch แยกตอนเปิดดูรายละเอียด */
export interface SentimentResult {
  _id: string;
  aspect_id: string | { _id: string; aspect_name_th: string; aspect_name_eng?: string };
  /** normalize เป็น number แล้วที่ services/reviews.ts (backend ส่ง Decimal128 ดิบ) */
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  sentiment_result?: string;
  extracted_aspects?: string[];
}

/** แง่มุมรีวิว (/admin/aspects) — ปุ่มชอบ/ควรปรับปรุงในฟอร์มรีวิวของลูกค้า · สูงสุด 20 */
export interface ReviewAspect {
  _id: string;
  aspect_name_th: string;
  aspect_name_eng: string;
  is_active: boolean;
  display_order: number;
  /** key ไอคอน (backend lib/aspectIcons) · null = ค่าเริ่มต้นตามชื่ออังกฤษ */
  icon: string | null;
  placeholder_text: string | null;
  deleted_at: string | null;
}

export type ReviewAspectInput = Partial<Pick<ReviewAspect, "aspect_name_th" | "aspect_name_eng" | "is_active" | "icon" | "placeholder_text">>;

/** คำสำหรับวิเคราะห์ (/admin/semantic-terms) — คำ/วลีในรีวิว → แง่มุม (ให้ระบบวิเคราะห์ข้อความ) */
export interface SemanticTerm {
  _id: string;
  term: string;
  synonyms: string[];
  aspect: { _id: string; aspect_name_th: string } | null;
}

export interface SemanticTermInput {
  term: string;
  synonyms: string[];
  aspect_id: string;
}
