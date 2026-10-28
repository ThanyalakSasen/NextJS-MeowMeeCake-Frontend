"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของแท็บ "แดชบอร์ด" ในหน้ารายงานความคิดเห็น — สรุปรีวิวตามช่วงเวลา (แท็บ "จัดการรีวิว" = useReviewsViewModel)
// GET /admin/reviews/stats (backend คำนวณจากทุกรีวิวในช่วง) + ช่วงก่อนหน้าชนิดเดียวกันไว้เทียบ — แปลงที่ reviewStats.ts
// เลือกสินค้า (productId) = ทุกส่วนของแดชบอร์ดเหลือเฉพาะสินค้านั้น · ตาราง "วิเคราะห์รายสินค้า" เรียงฝั่ง client
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { exportToCsv } from "@/lib/exportCsv";
import { reviewsService } from "@/services/reviews";
import { sortByThai } from "@/lib/thaiSort";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { REVIEW_FILTER_OPTIONS_KEY, REVIEW_STATS_KEY } from "../reviewsQuery";
import { bucketUnitFor, previousRange, sortProductRows, toReviewStats, type ProductSort, type ProductSortKey } from "./reviewStats";

/** until ของ backend เป็น $lt → ส่งต้นช่วงถัดไป (ครอบมิลลิวินาทีสุดท้ายของ endOf) */
const untilOf = (end: Dayjs) => end.add(1, "millisecond").toISOString();

/** enabled = แท็บแดชบอร์ดเปิดอยู่ — ไม่โหลดตอนอยู่แท็บจัดการรีวิว */
export function useReviewDashboardViewModel({ enabled = true }: { enabled?: boolean } = {}) {
  const t = useTranslations();
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<ProductSort>({ key: "count", dir: "desc" });
  const range = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);
  const prev = useMemo(() => previousRange(period, range), [period, range]);

  const params = {
    since: range[0].toISOString(),
    until: untilOf(range[1]),
    bucket: bucketUnitFor(period),
    prev_since: prev[0].toISOString(),
    prev_until: untilOf(prev[1]),
    ...(productId ? { product_id: productId } : {}),
  };
  const q = useQuery({
    queryKey: [...REVIEW_STATS_KEY, params],
    queryFn: () => reviewsService.stats(params),
    enabled,
  });
  // สินค้าที่มีรีวิว — cache เดียวกับตัวกรองของแท็บจัดการรีวิว
  const optionsQ = useQuery({
    queryKey: REVIEW_FILTER_OPTIONS_KEY,
    queryFn: () => reviewsService.filterOptions(),
    staleTime: 60_000,
    enabled,
  });
  const products = optionsQ.data?.products ?? [];

  const stats = useMemo(() => (q.data ? toReviewStats(q.data, range, period) : null), [q.data, range, period]);
  const productRows = useMemo(() => (stats ? sortProductRows(stats.products, sort) : []), [stats, sort]);

  /** ส่งออกตาราง "วิเคราะห์รายสินค้า" ตามลำดับที่เรียงอยู่ · ชื่อไฟล์บอกช่วงเวลา */
  const exportProducts = () => {
    const day = (d: Dayjs) => d.format("YYYY-MM-DD");
    exportToCsv(
      `review_products_${day(range[0])}_${day(range[1])}.csv`,
      [
        t("reviewsDashboard.colProduct"), t("reviewsDashboard.csvCategory"), t("reviewsDashboard.colReviews"),
        t("reviewsDashboard.csvAvg"), t("reviewsDashboard.csvPrevAvg"), t("reviewsDashboard.csvAvgDelta"),
        t("reviewsDashboard.csvNegative"), t("reviewsDashboard.colNegative"), t("reviewsDashboard.colTopIssue"),
      ],
      productRows.map((p) => [
        p.name,
        p.category_name,
        p.count,
        p.avg.toFixed(2),
        p.prev_avg != null ? p.prev_avg.toFixed(2) : "",
        p.avgDelta != null ? p.avgDelta.toFixed(2) : "",
        p.negative,
        p.negativeRate.toFixed(1),
        p.top_issue ? `${p.top_issue.name} (${p.top_issue.count})` : "",
      ]),
    );
  };

  return {
    period,
    setPeriod,
    selectedDate,
    setSelectedDate,
    /** ช่วงที่แสดงอยู่ (บอกในกล่องสรุปว่าข้อมูลวันไหน) */
    range,
    /** ช่วงก่อนหน้า (แสดงในคำอธิบาย "เทียบกับ …") */
    prevRange: prev,

    /** สินค้าที่เลือก · undefined = ทั้งร้าน */
    productId,
    setProductId,
    productOptions: sortByThai(products, (p) => p.product_name_th).map((p) => ({ value: p.product_id, label: p.product_name_th })),

    /** ตาราง "วิเคราะห์รายสินค้า" (เรียงแล้ว) */
    productRows,
    onExportProducts: exportProducts,
    /** เปิดแดชบอร์ดของสินค้า (จากตาราง/อันดับสินค้า) — เลื่อนกลับขึ้นบนให้เห็นตัวเลขของสินค้านั้น */
    openProduct: (id: string) => {
      setProductId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    sort,
    /** กดหัวคอลัมน์: คอลัมน์เดิม = สลับทิศ · คอลัมน์ใหม่ = ชื่อเรียง ก–ฮ ส่วนตัวเลขเรียงมากไปน้อย */
    onSort: (key: ProductSortKey) =>
      setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" })),

    // isPending (เฉพาะตอนเปิดแท็บ — query ที่ปิดอยู่ pending ตลอด) · render ฝั่ง server ด้วย
    isLoading: enabled && q.isPending,
    isFetching: q.isFetching,
    isError: q.isError,
    refetch: () => q.refetch(),
    stats,
  };
}
