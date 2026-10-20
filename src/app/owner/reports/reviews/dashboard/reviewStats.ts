// ─────────────────────────────────────────────────────────────
// reviewStats.ts — pure: แปลงผลจาก GET /admin/reviews/stats เป็นข้อมูลของแดชบอร์ด
// backend คำนวณจากทุกรีวิวในช่วง (เดิมหน้าโหลดรีวิวมาคำนวณเองทีละ 100 — ช้า + มีเพดาน)
// ที่นี่ทำแค่: เติมช่วงว่างของกราฟ · คิดช่วงก่อนหน้า · เทียบหัวข้อที่ถูกติกับช่วงก่อนหน้า · แถว/การเรียงตารางรายสินค้า
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import type {
  AdminReviewStats, ReviewStatsAspect, ReviewStatsCategory, ReviewStatsItem, ReviewStatsProduct, ReviewStatsSummary,
} from "@/types/review";

/** สินค้าคะแนนต่ำสุด — backend นับเฉพาะที่มีรีวิวอย่างน้อยเท่านี้ (reviewStatsService.MIN_REVIEWS_FOR_LOW) */
export const MIN_REVIEWS_FOR_LOW = 2;
/** แนวโน้มหัวข้อที่ถูกติ — แสดงสูงสุดกี่หัวข้อ */
const ASPECT_TREND_N = 6;

export interface Bucket {
  key: string;
  /** วันแรกของช่วงย่อย */
  start: Dayjs;
  count: number;
  avg: number | null;
}

export type ProductStat = ReviewStatsItem;
export type CategoryStat = ReviewStatsCategory;
export type AspectStat = ReviewStatsAspect;

/** หัวข้อที่ถูกติ: ช่วงนี้ เทียบช่วงก่อนหน้า */
export interface AspectTrend {
  name: string;
  negative: number;
  prevNegative: number;
  /** negative − prevNegative */
  delta: number;
}

/** แถวตาราง "วิเคราะห์รายสินค้า" */
export interface ProductRow extends ReviewStatsProduct {
  /** % รีวิวแย่ 0–100 */
  negativeRate: number;
  /** คะแนนเฉลี่ยเทียบช่วงก่อนหน้า · null = ช่วงก่อนหน้าไม่มีรีวิว */
  avgDelta: number | null;
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
  buckets: Bucket[];
  bucketUnit: "day" | "month";
  aspects: AspectStat[];
  /** เรียงหัวข้อที่ถูกติเพิ่มขึ้นมากสุดก่อน · null = ไม่มีข้อมูลช่วงก่อนหน้า */
  aspectTrends: AspectTrend[] | null;
  topProducts: ProductStat[];
  lowProducts: ProductStat[];
  categories: CategoryStat[];
  products: ProductRow[];
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบทั้งหมด */
  unrepliedNegativeCount: number;
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบ 5 รายการใหม่สุด */
  unrepliedNegative: UnrepliedReview[];
}

/** ช่วงย่อยของกราฟ: วัน/สัปดาห์/เดือน → รายวัน · ไตรมาส/ปี → รายเดือน */
export function bucketUnitFor(period: PeriodType): "day" | "month" {
  return period === "quarter" || period === "year" ? "month" : "day";
}

/** ช่วงก่อนหน้าที่ชนิดเดียวกัน — ช่วงที่มีวินาทีสุดท้ายก่อนช่วงนี้ (เดือน/ไตรมาสยาวไม่เท่ากัน จึงไม่ลบเป็นจำนวนวัน) */
export function previousRange(period: PeriodType, range: [Dayjs, Dayjs]): [Dayjs, Dayjs] {
  return getRangeStartEnd(period, range[0].subtract(1, "millisecond"));
}

/** หัวข้อที่ถูกติในช่วงใดช่วงหนึ่ง เทียบกัน — เรียงที่เพิ่มขึ้นมากสุดก่อน แล้วตามจำนวนช่วงนี้ */
export function aspectTrendsOf(current: AspectStat[], previous: AspectStat[]): AspectTrend[] {
  const prev = new Map(previous.map((a) => [a.name, a.negative]));
  const names = new Set([...current.filter((a) => a.negative > 0).map((a) => a.name), ...previous.filter((a) => a.negative > 0).map((a) => a.name)]);
  const now = new Map(current.map((a) => [a.name, a.negative]));
  return [...names]
    .map((name) => {
      const negative = now.get(name) ?? 0;
      const prevNegative = prev.get(name) ?? 0;
      return { name, negative, prevNegative, delta: negative - prevNegative };
    })
    .sort((a, b) => b.delta - a.delta || b.negative - a.negative || a.name.localeCompare(b.name, "th"))
    .slice(0, ASPECT_TREND_N);
}

export function toReviewStats(raw: AdminReviewStats, range: [Dayjs, Dayjs], period: PeriodType): ReviewStats {
  const unit = bucketUnitFor(period);
  const fmt = unit === "day" ? "YYYY-MM-DD" : "YYYY-MM";
  // backend ส่งเฉพาะช่วงที่มีรีวิว — เติมช่วงว่างให้กราฟต่อเนื่อง
  const got = new Map(raw.buckets.map((b) => [b.key, b]));
  const buckets: Bucket[] = [];
  for (let d = range[0].startOf(unit); !d.isAfter(range[1]); d = d.add(1, unit)) {
    const key = d.format(fmt);
    const b = got.get(key);
    buckets.push({ key, start: d, count: b?.count ?? 0, avg: b ? b.avg : null });
  }

  return {
    ...raw.summary,
    previous: raw.previous,
    ratingCounts: raw.rating_counts,
    buckets,
    bucketUnit: unit,
    aspects: raw.aspects,
    aspectTrends: raw.previous_aspects ? aspectTrendsOf(raw.aspects, raw.previous_aspects) : null,
    topProducts: raw.top_products,
    lowProducts: raw.low_products,
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
