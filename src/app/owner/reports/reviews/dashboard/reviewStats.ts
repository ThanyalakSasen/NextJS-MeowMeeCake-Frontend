// ─────────────────────────────────────────────────────────────
// reviewStats.ts — pure: แปลงผลจาก GET /admin/reviews/stats เป็นข้อมูลของแดชบอร์ด
// backend คำนวณจากทุกรีวิวในช่วง (เดิมหน้าโหลดรีวิวมาคำนวณเองทีละ 100 — ช้า + มีเพดาน)
// ที่นี่ทำแค่: คิดช่วงก่อนหน้า · จำนวนครั้งที่ถูกติของแต่ละหัวข้อในช่วงก่อนหน้า · แถว/การเรียงตารางรายสินค้า
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import type {
  AdminReviewStats, ReviewStatsAspect, ReviewStatsCategory, ReviewStatsProduct, ReviewStatsSummary,
} from "@/types/review";

export type CategoryStat = ReviewStatsCategory;
export type AspectStat = ReviewStatsAspect;

/** แถวตาราง "วิเคราะห์รายสินค้า" */
export interface ProductRow extends ReviewStatsProduct {
  /** % รีวิวแย่ 0–100 */
  negativeRate: number;
  /** คะแนนเฉลี่ยเทียบช่วงก่อนหน้า · null = ช่วงก่อนหน้าไม่มีรีวิว */
  avgDelta: number | null;
}

/** แจ้งเตือน "สินค้าที่คะแนนตก": เฉลี่ยลดลงอย่างน้อยเท่านี้ (ดาว) จากช่วงก่อนหน้า */
export const DROP_ALERT_STARS = 0.5;
/** ต้องมีรีวิวอย่างน้อยเท่านี้ทั้งสองช่วง — รีวิวเดียวทำให้ค่าเฉลี่ยแกว่งแรงเกินจริง (เท่ากับ backend MIN_REVIEWS_FOR_LOW) */
export const DROP_ALERT_MIN_REVIEWS = 2;

/** สินค้าที่คะแนนเฉลี่ยตกแรงจากช่วงก่อนหน้า — ตกมากสุดก่อน */
export function droppedProducts(rows: ProductRow[]): ProductRow[] {
  return rows
    .filter(
      (p) =>
        p.avgDelta != null &&
        p.avgDelta <= -DROP_ALERT_STARS &&
        p.count >= DROP_ALERT_MIN_REVIEWS &&
        p.prev_count >= DROP_ALERT_MIN_REVIEWS,
    )
    .sort((a, b) => a.avgDelta! - b.avgDelta! || b.count - a.count);
}

export type ProductSortKey = "count" | "avg" | "avgDelta" | "negativeRate" | "name";
export interface ProductSort {
  key: ProductSortKey;
  dir: "asc" | "desc";
}

/** เรียงตาราง — ค่าที่ไม่มี (avgDelta = null) อยู่ท้ายเสมอ ไม่ว่าจะเรียงทางไหน */
export function sortProductRows(rows: ProductRow[], sort: ProductSort): ProductRow[] {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === "name") return sign * a.name.localeCompare(b.name, "th");
    const x = a[sort.key];
    const y = b[sort.key];
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    return sign * (x - y) || b.count - a.count;
  });
}

export interface UnrepliedReview {
  _id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  productName: string;
  userName: string;
}

export interface ReviewStats extends ReviewStatsSummary {
  /** ช่วงก่อนหน้า (ยาวเท่ากันตามชนิดช่วง) · null = backend ไม่ส่ง */
  previous: ReviewStatsSummary | null;
  /** index 0 = 1 ดาว … 4 = 5 ดาว */
  ratingCounts: number[];
  aspects: AspectStat[];
  /** ชื่อหัวข้อ → จำนวนครั้งที่ถูกติในช่วงก่อนหน้า · null = ไม่มีข้อมูลช่วงก่อนหน้า */
  prevAspectNegative: Map<string, number> | null;
  categories: CategoryStat[];
  products: ProductRow[];
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบทั้งหมด */
  unrepliedNegativeCount: number;
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบ 5 รายการใหม่สุด */
  unrepliedNegative: UnrepliedReview[];
}

/** ช่วงก่อนหน้าที่ชนิดเดียวกัน — ช่วงที่มีวินาทีสุดท้ายก่อนช่วงนี้ (เดือน/ไตรมาสยาวไม่เท่ากัน จึงไม่ลบเป็นจำนวนวัน) */
export function previousRange(period: PeriodType, range: [Dayjs, Dayjs]): [Dayjs, Dayjs] {
  return getRangeStartEnd(period, range[0].subtract(1, "millisecond"));
}

export function toReviewStats(raw: AdminReviewStats): ReviewStats {
  return {
    ...raw.summary,
    previous: raw.previous,
    ratingCounts: raw.rating_counts,
    aspects: raw.aspects,
    prevAspectNegative: raw.previous_aspects ? new Map(raw.previous_aspects.map((a) => [a.name, a.negative])) : null,
    categories: raw.categories,
    products: (raw.products ?? []).map((p) => ({
      ...p,
      negativeRate: p.count ? (p.negative / p.count) * 100 : 0,
      avgDelta: p.prev_avg != null ? p.avg - p.prev_avg : null,
    })),
    unrepliedNegativeCount: raw.unreplied_negative_count,
    unrepliedNegative: raw.unreplied_negative.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review_text: r.review_text,
      created_at: dayjs(r.created_at).toISOString(),
      productName: r.product_name,
      userName: r.user_name,
    })),
  };
}
