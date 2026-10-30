"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Sales Report — จัดอันดับสินค้าตามยอดขาย/จำนวนที่ขายได้ในช่วงเวลาที่เลือก
// ข้อมูลจาก /admin/dashboard/top-products (เรียงตาม quantity_sold, จำกัด 50 รายการ, ไม่มีกำไร/
// ต้นทุน/หมวดหมู่/แยกช่องทางออนไลน์-หน้าร้าน — ดูเหตุผลที่ salesReport.ts) enrich หมวดหมู่โดย join
// กับ products list ที่โหลดแยกอยู่แล้ว (ไม่เพิ่ม request)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { thaiCompare } from "@/lib/thaiSort";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { reportsService } from "@/services/reports";
import { usePermission } from "@/context/PermissionsContext";
import { productsService } from "@/services/products";
import { LIST_ALL } from "@/lib/http";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { revenueKey } from "@/app/owner/finance/summary/summaryRanges";
import {
  enrichWithCategory, valueOf, CATEGORY_ALL, TOP_PRODUCTS_LIMIT,
  salesTopProductsKey, type SalesMode, type SortDir, type ProductSalesStat,
} from "./salesReport";

export function useSalesReportViewModel() {
  const [mode, setMode] = useState<SalesMode>("revenue");
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [categoryId, setCategoryId] = useState<string>(CATEGORY_ALL);
  const [sort, setSort] = useState<SortDir>("desc");

  const [rangeStart, rangeEnd] = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);

  const topProductsQ = useQuery({
    queryKey: salesTopProductsKey(mode, rangeStart.toISOString(), rangeEnd.toISOString()),
    queryFn: () =>
      reportsService.topProducts({
        limit: TOP_PRODUCTS_LIMIT,
        date_from: rangeStart.toISOString(),
        date_to: rangeEnd.toISOString(),
        sort: mode,
      }),
    // สลับโหมดแล้วยังเห็นตารางเดิมระหว่างโหลด (ไม่กระพริบเป็นหน้าว่าง)
    placeholderData: keepPreviousData,
  });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => productsService.list({ limit: LIST_ALL }) });

  // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
  const isLoading = topProductsQ.isPending || productsQ.isPending;
  const isError = topProductsQ.isError;

  const stats = useMemo<ProductSalesStat[]>(
    () => enrichWithCategory(topProductsQ.data ?? [], productsQ.data?.data ?? []),
    [topProductsQ.data, productsQ.data],
  );

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    stats.forEach((s) => { if (s.category_id && !seen.has(s.category_id)) seen.set(s.category_id, s.category_name); });
    // เรียง ก-ฮ (collation ภาษาไทย — สระหน้าอย่าง เ/แ ไม่นับ: "เค้กชิ้น" อยู่หมวด ค) · "ทุกหมวดหมู่" View ใส่ไว้หน้าสุดเอง
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => thaiCompare(a.label, b.label));
  }, [stats]);

  const filtered = useMemo(
    () => (categoryId === CATEGORY_ALL ? stats : stats.filter((s) => s.category_id === categoryId)),
    [stats, categoryId],
  );
  const rows = useMemo(() => {
    return [...filtered].sort((a, b) =>
      sort === "desc" ? valueOf(b, mode) - valueOf(a, mode) : valueOf(a, mode) - valueOf(b, mode),
    );
  }, [filtered, sort, mode]);

  const maxVal = useMemo(() => Math.max(...rows.map((r) => valueOf(r, mode)), 1), [rows, mode]);

  const totalRevenue = useMemo(() => stats.reduce((s, r) => s + r.revenue, 0), [stats]);
  const totalQty = useMemo(() => stats.reduce((s, r) => s + r.qty, 0), [stats]);
  // อันดับ 1 = ค่ามากสุดตามโหมดเสมอ — เดิมใช้ rows[0] พอเรียง "น้อยไปมาก" การ์ดอันดับ 1 กลายเป็นตัวที่ขายน้อยสุด
  const topProduct = useMemo(
    () => filtered.reduce<ProductSalesStat | null>((best, r) => (!best || valueOf(r, mode) > valueOf(best, mode) ? r : best), null),
    [filtered, mode],
  );
  // ได้ครบเพดาน = อาจมีสินค้าที่ขายได้แต่ไม่ติดรายงาน → ยอดรวมในการ์ดนับเฉพาะ N อันดับแรก
  // บอกรายรับทั้งร้านของช่วงเดียวกันไว้เทียบ (key เดียวกับหน้าสรุปการเงิน — แคชใช้ร่วมกัน)
  const capped = stats.length >= TOP_PRODUCTS_LIMIT;
  // revenue-by-channel ต้องมีสิทธิ์ดูการเงิน (สรุป/ค่าใช้จ่าย) — ไม่มี = ไม่ยิง (ไม่งั้น 403 ทุกครั้ง) และไม่แสดงตัวเลขนี้
  // เรียก hook ทั้งคู่เสมอ (|| ตัดทางจะทำให้ลำดับ hook เปลี่ยนตามสิทธิ์)
  const financeSummaryView = usePermission("finance_summary").view;
  const financeExpensesView = usePermission("finance_expenses").view;
  const canSeeRevenue = financeSummaryView || financeExpensesView;
  const from = rangeStart.toISOString();
  const to = rangeEnd.toISOString();
  const shopRevenueQ = useQuery({
    queryKey: revenueKey(from, to),
    queryFn: () => reportsService.revenueByChannel({ date_from: from, date_to: to }),
    enabled: capped && canSeeRevenue,
  });

  return {
    mode, setMode,
    period, setPeriod,
    selectedDate, setSelectedDate,
    categoryId, setCategoryId,
    sort, setSort,

    isLoading, isError, refetch: () => topProductsQ.refetch(),

    categories, rows, maxVal,
    totalRevenue, totalQty, topProduct,
    capped,
    /** รายรับทั้งร้าน (รวมค่าส่ง หักส่วนลด) — มีเฉพาะตอน capped · null = ยังโหลดไม่เสร็จ/โหลดไม่ได้ */
    shopRevenue: capped ? (shopRevenueQ.data?.total ?? null) : null,
  };
}
