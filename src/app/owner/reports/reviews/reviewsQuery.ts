// ─────────────────────────────────────────────────────────────
// reviewsQuery.ts — pure: query key / ค่าเริ่มต้นของรายการรีวิว ที่ ViewModel (browser) กับ page.tsx (server prefetch) ใช้ร่วมกัน
// ต้องอยู่ไฟล์ที่ไม่มี "use client" — server เรียกฟังก์ชันจากไฟล์ client ไม่ได้
// ─────────────────────────────────────────────────────────────
import type { ReviewListParams, ReviewSort } from "@/types/review";

export const REVIEWS_LIST_KEY = ["reviews", "admin"] as const;
export const REVIEW_FILTER_OPTIONS_KEY = ["reviews", "filter-options"] as const;
export const REVIEW_ASPECTS_KEY = ["review-aspects"] as const;

// 10 (เดิม 20) — การ์ดรีวิวมี antd Select/Tooltip/Checkbox หลายตัว · 20 ใบ render+hydrate รวดเดียว = TBT ~400ms บนมือถือ
export const REVIEWS_PAGE_SIZE = 10;
export const REVIEWS_DEFAULT_SORT: ReviewSort = "newest";

/** params ของหน้าแรกเมื่อยังไม่กรองอะไร — ตรงกับ toParams(DEFAULT_FILTERS, "", 1, REVIEWS_PAGE_SIZE) */
export function initialReviewListParams(): ReviewListParams {
  return { page: 1, limit: REVIEWS_PAGE_SIZE, sort: REVIEWS_DEFAULT_SORT };
}
