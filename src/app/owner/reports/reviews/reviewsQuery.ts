// ─────────────────────────────────────────────────────────────
// reviewsQuery.ts — pure: query key / ค่าเริ่มต้นของรายการรีวิว ที่ ViewModel (browser) กับ page.tsx (server prefetch) ใช้ร่วมกัน
// ต้องอยู่ไฟล์ที่ไม่มี "use client" — server เรียกฟังก์ชันจากไฟล์ client ไม่ได้
// ─────────────────────────────────────────────────────────────
import type { ReviewListParams, ReviewSort, ReviewStatsParams } from "@/types/review";
import { bangkokMonthRangeIso } from "@/utils/period";

export const REVIEWS_LIST_KEY = ["reviews", "admin"] as const;
export const REVIEW_STATS_KEY = ["reviews", "admin", "stats"] as const;
export const REVIEW_FILTER_OPTIONS_KEY = ["reviews", "filter-options"] as const;
export const REVIEW_ASPECTS_KEY = ["review-aspects"] as const;

// 10 (เดิม 20) — การ์ดรีวิวมี antd Select/Tooltip/Checkbox หลายตัว · 20 ใบ render+hydrate รวดเดียว = TBT ~400ms บนมือถือ
export const REVIEWS_PAGE_SIZE = 10;
export const REVIEWS_DEFAULT_SORT: ReviewSort = "newest";

/** ?view= จากลิงก์แจ้งเตือน (backend adminLinks.reviewsNeedsReply) — เปิดแท็บจัดการรีวิวพร้อมตัวกรองสำเร็จรูป */
export type ReviewsLinkView = "negative_unreplied";
export function linkViewFrom(v: unknown): ReviewsLinkView | undefined {
  return v === "negative_unreplied" ? v : undefined;
}

/** until ของ backend เป็น $lt → ต้นช่วงถัดไป (สิ้นช่วง + 1 ms) */
const untilIso = (endIso: string) => new Date(Date.parse(endIso) + 1).toISOString();

/**
 * params สถิติของแดชบอร์ดตอนเปิดหน้า (รายเดือน · เดือนนี้ · ทุกสินค้า) ตามเวลาไทย — ให้ server prefetch ได้
 * ตรงกับที่ useReviewDashboardViewModel คำนวณใน browser ที่ตั้งเวลาไทย (key ไม่ตรง = browser ดึงเองเหมือนเดิม)
 */
export function initialReviewStatsParams(): ReviewStatsParams {
  const [since, end] = bangkokMonthRangeIso();
  const [prevSince, prevEnd] = bangkokMonthRangeIso(-1);
  return { since, until: untilIso(end), bucket: "day", prev_since: prevSince, prev_until: untilIso(prevEnd) };
}

/** params ของหน้าแรกเมื่อยังไม่กรองอะไร — ตรงกับ toParams(DEFAULT_FILTERS, "", 1, REVIEWS_PAGE_SIZE) */
export function initialReviewListParams(): ReviewListParams {
  return { page: 1, limit: REVIEWS_PAGE_SIZE, sort: REVIEWS_DEFAULT_SORT };
}
