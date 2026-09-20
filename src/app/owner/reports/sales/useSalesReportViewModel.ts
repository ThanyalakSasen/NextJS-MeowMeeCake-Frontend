"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Sales Report — จัดอันดับสินค้าตามยอดขาย/จำนวนที่ขายได้ในช่วงเวลาที่เลือก
// ข้อมูลจาก /admin/dashboard/top-products (เรียงตาม quantity_sold, จำกัด 50 รายการ, ไม่มีกำไร/
// ต้นทุน/หมวดหมู่/แยกช่องทางออนไลน์-หน้าร้าน — ดูเหตุผลที่ salesReport.ts) enrich หมวดหมู่โดย join
// กับ products list ที่โหลดแยกอยู่แล้ว (ไม่เพิ่ม request)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { reportsService } from "@/services/reports";
import { productsService } from "@/services/products";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import {
  enrichWithCategory, valueOf, CATEGORY_ALL,
  type SalesMode, type SortDir, type ProductSalesStat,
} from "./salesReport";

export function useSalesReportViewModel() {
  const [mode, setMode] = useState<SalesMode>("revenue");
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [categoryId, setCategoryId] = useState<string>(CATEGORY_ALL);
  const [sort, setSort] = useState<SortDir>("desc");

  const [rangeStart, rangeEnd] = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);

  const topProductsQ = useQuery({
    queryKey: ["dashboard", "top-products", rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () =>
      reportsService.topProducts({
        limit: 50,
        date_from: rangeStart.toISOString(),
        date_to: rangeEnd.toISOString(),
      }),
  });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => productsService.list({ limit: 200 }) });

  const isLoading = topProductsQ.isLoading || productsQ.isLoading;
  const isError = topProductsQ.isError;

  const stats = useMemo<ProductSalesStat[]>(
    () => enrichWithCategory(topProductsQ.data ?? [], productsQ.data?.data ?? []),
    [topProductsQ.data, productsQ.data],
  );

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    stats.forEach((s) => { if (s.category_id && !seen.has(s.category_id)) seen.set(s.category_id, s.category_name); });
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [stats]);

  const rows = useMemo(() => {
    const filtered = categoryId === CATEGORY_ALL ? stats : stats.filter((s) => s.category_id === categoryId);
    return [...filtered].sort((a, b) =>
      sort === "desc" ? valueOf(b, mode) - valueOf(a, mode) : valueOf(a, mode) - valueOf(b, mode),
    );
  }, [stats, categoryId, sort, mode]);

  const maxVal = useMemo(() => Math.max(...rows.map((r) => valueOf(r, mode)), 1), [rows, mode]);

  const totalRevenue = useMemo(() => stats.reduce((s, r) => s + r.revenue, 0), [stats]);
  const totalQty = useMemo(() => stats.reduce((s, r) => s + r.qty, 0), [stats]);
  const topProduct = rows[0] ?? null;

  return {
    mode, setMode,
    period, setPeriod,
    selectedDate, setSelectedDate,
    categoryId, setCategoryId,
    sort, setSort,

    isLoading, isError, refetch: () => topProductsQ.refetch(),

    categories, rows, maxVal,
    totalRevenue, totalQty, topProduct,
  };
}
