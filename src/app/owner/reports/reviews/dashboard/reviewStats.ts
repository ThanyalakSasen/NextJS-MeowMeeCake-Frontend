// ─────────────────────────────────────────────────────────────
// reviewStats.ts — pure: สรุปรีวิวของช่วงเวลาสำหรับแดชบอร์ด (backend ไม่มี endpoint สรุป — คำนวณจาก /admin/reviews)
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { PeriodType } from "@/utils/period";
import type { ReviewRow } from "../reviewRow";

/** สินค้าคะแนนต่ำสุด — นับเฉพาะที่มีรีวิวอย่างน้อยเท่านี้ (1 รีวิวเดียวไม่ใช่ภาพรวม) */
export const MIN_REVIEWS_FOR_LOW = 2;

export interface Bucket {
  key: string;
  /** วันแรกของช่วงย่อย */
  start: Dayjs;
  count: number;
  avg: number | null;
}

export interface AspectStat {
  name: string;
  positive: number;
  negative: number;
}

export interface ProductStat {
  id: string;
  name: string;
  count: number;
  avg: number;
}

export interface ReviewStats {
  total: number;
  avg: number | null;
  negative: number;
  replied: number;
  unread: number;
  withMedia: number;
  /** index 0 = 1 ดาว … 4 = 5 ดาว */
  ratingCounts: number[];
  buckets: Bucket[];
  bucketUnit: "day" | "month";
  aspects: AspectStat[];
  topProducts: ProductStat[];
  lowProducts: ProductStat[];
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบทั้งหมด */
  unrepliedNegativeCount: number;
  /** รีวิว 1–2 ดาวที่ยังไม่ตอบ 5 รายการใหม่สุด */
  unrepliedNegative: ReviewRow[];
}

const avgOf = (sum: number, n: number) => (n ? sum / n : null);

/** ช่วงย่อยของกราฟ: วัน/สัปดาห์/เดือน → รายวัน · ไตรมาส/ปี → รายเดือน */
export function bucketUnitFor(period: PeriodType): "day" | "month" {
  return period === "quarter" || period === "year" ? "month" : "day";
}

export function computeReviewStats(rows: ReviewRow[], range: [Dayjs, Dayjs], period: PeriodType): ReviewStats {
  const unit = bucketUnitFor(period);
  const ratingCounts = [0, 0, 0, 0, 0];
  let sum = 0;
  let negative = 0;
  let replied = 0;
  let unread = 0;
  let withMedia = 0;

  const buckets = new Map<string, Bucket & { sum: number }>();
  for (let d = range[0].startOf(unit); !d.isAfter(range[1]); d = d.add(1, unit)) {
    const key = d.format(unit === "day" ? "YYYY-MM-DD" : "YYYY-MM");
    buckets.set(key, { key, start: d, count: 0, avg: null, sum: 0 });
  }

  const aspects = new Map<string, AspectStat>();
  const products = new Map<string, ProductStat & { sum: number }>();

  for (const r of rows) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingCounts[rating - 1]++;
    sum += r.rating;
    if (r.rating <= 2) negative++;
    if (r.shop_reply?.text) replied++;
    if (!r.isRead) unread++;
    if (r.images.length || r.videoUrl) withMedia++;

    const b = buckets.get(dayjs(r.created_at).format(unit === "day" ? "YYYY-MM-DD" : "YYYY-MM"));
    if (b) {
      b.count++;
      b.sum += r.rating;
    }

    for (const topic of r.topics) {
      if (topic.sentiment === "neutral" || !topic.label) continue;
      // ประโยคสำเร็จรูปของรีวิวเก่า = "หัวข้อ: ข้อความ" — นับตามหัวข้อ
      const name = topic.label.split(":")[0].trim();
      const a = aspects.get(name) ?? { name, positive: 0, negative: 0 };
      a[topic.sentiment]++;
      aspects.set(name, a);
    }

    const pid = r.product_id && typeof r.product_id === "object" ? r.product_id._id : typeof r.product_id === "string" ? r.product_id : "";
    if (pid) {
      const p = products.get(pid) ?? { id: pid, name: r.productName, count: 0, avg: 0, sum: 0 };
      p.count++;
      p.sum += r.rating;
      products.set(pid, p);
    }
  }

  const unrepliedNegative = rows.filter((r) => r.rating <= 2 && !r.shop_reply?.text);
  const productList = [...products.values()].map(({ sum: s, ...p }) => ({ ...p, avg: s / p.count }));

  return {
    total: rows.length,
    avg: avgOf(sum, rows.length),
    negative,
    replied,
    unread,
    withMedia,
    ratingCounts,
    bucketUnit: unit,
    buckets: [...buckets.values()].map(({ sum: s, ...b }) => ({ ...b, avg: avgOf(s, b.count) })),
    aspects: [...aspects.values()].sort((a, b) => b.positive + b.negative - (a.positive + a.negative)),
    topProducts: [...productList].sort((a, b) => b.count - a.count || b.avg - a.avg).slice(0, 5),
    lowProducts: productList
      .filter((p) => p.count >= MIN_REVIEWS_FOR_LOW)
      .sort((a, b) => a.avg - b.avg || b.count - a.count)
      .slice(0, 5),
    unrepliedNegativeCount: unrepliedNegative.length,
    unrepliedNegative: unrepliedNegative
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5),
  };
}
