"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance P&L — รายรับจาก backend (revenue-by-channel: ออเดอร์เว็บ/หน้าร้าน + พรีออเดอร์ ที่ชำระแล้ว)
// + ค่าใช้จ่ายรวมตามหมวดจาก /admin/expenses/summary (backend รวมให้ตามช่วง — ไม่โหลดทุกรายการมารวมเอง
//   ซึ่งเกินเพดาน 1,000 รายการแล้วยอดหายเงียบ) → คำนวณต้นทุน/กำไรตามช่วงเวลาที่เลือก
// เดิมรวมรายรับเองจาก /admin/orders (limit 200, ไม่นับพรีออเดอร์ = 0 ตายตัว) และแยกยอดออนไลน์ด้วย
// revenue-by-type ที่ backend #52 เปลี่ยน shape ไปแล้ว (ไม่มี .online → NaN ทั้งตาราง) — BACKLOG2 §3
//
// ต้นทุนขาย (COGS) แสดง 2 วิธีคู่กัน (Final-Backlog Q1 — เจ้าของร้านเลือกดูทั้งสองแบบ):
//   ตามค่าใช้จ่าย = ค่าใช้จ่ายหมวด "วัตถุดิบ"/"บรรจุภัณฑ์" ที่บันทึกจริง (งบกำไร-ขาดทุนหลักใช้แบบนี้)
//   ตามสูตร      = recipe_cogs จาก revenue-by-channel (Σ cost_per_unit × จำนวนของสินค้าที่ขายได้)
// ค่าใช้จ่ายดำเนินงาน (หมวดอื่น) เท่ากันทั้งสองแบบ — แบบตามสูตรไม่หักค่าวัตถุดิบที่ซื้อเข้าซ้ำ
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { formatCurrency, formatDate } from "@/i18n/format";
import { COGS_EXPENSE_CATEGORIES } from "@/constants/enumConfig";
import type { ExpenseCategory } from "@/constants/enumConfig";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { financeTrendKey, revenueKey, trendBuckets as buildTrendBuckets } from "./summaryRanges";
import { FIRST_EXPENSE_KEY, FIRST_EXPENSE_PARAMS, expenseSummaryKey } from "../expensesQuery";

export interface PnLRow {
  key: string;
  label: string;
  amount: number;
  kind: "header" | "line" | "subtotal" | "gross" | "net";
}

export function useFinanceSummaryViewModel() {
  const t = useTranslations();
  const locale = useLocale();

  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // รายวันในหน้าสรุปกำไร-ขาดทุน เลือกเป็นรายเดือน (ตารางแสดงรายวันตั้งแต่วันที่ 1 ของเดือนนั้น)
  const [rangeStart, rangeEnd] = useMemo(
    () => getRangeStartEnd(period === "day" ? "month" : period, selectedDate),
    [period, selectedDate],
  );
  const rangeFrom = rangeStart.toISOString();
  const rangeTo = rangeEnd.toISOString();

  // ค่าใช้จ่ายรวมตามหมวดของช่วงที่เลือก (backend รวมให้)
  const summaryQ = useQuery({
    queryKey: expenseSummaryKey(rangeFrom, rangeTo),
    queryFn: () => expensesService.summary({ date_from: rangeFrom, date_to: rangeTo }),
  });

  // รายรับแยกตามช่องทาง (คิดที่ backend ทั้งหมด — ชำระแล้ว, ช่วงวันที่ตาม created_at เหมือนที่หน้านี้เคยกรองเอง)
  const revenueQ = useQuery({
    queryKey: revenueKey(rangeFrom, rangeTo),
    queryFn: () => reportsService.revenueByChannel({ date_from: rangeFrom, date_to: rangeTo }),
  });
  // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
  const isLoading = summaryQ.isPending || revenueQ.isPending;
  // รายรับมาจาก revenueQ อย่างเดียว — ถ้าโหลดไม่ได้ต้องบอกผู้ใช้ ห้ามโชว์รายรับ 0 / กำไรติดลบที่ผิดเงียบ ๆ
  const isError = summaryQ.isError || revenueQ.isError;

  const revenue = revenueQ.data;
  const webIncome = revenue?.web ?? 0;
  const posIncome = revenue?.pos ?? 0;
  const preorderIncome = revenue?.preorder ?? 0;
  // ออเดอร์เลขรุ่นเก่า (ก่อนแยก ORD-/POS-) — โชว์แถวเฉพาะเมื่อมียอด
  const otherIncome = revenue?.other ?? 0;
  const totalIncome = revenue?.total ?? 0;
  const orderCount = revenue?.orders ?? 0;

  const expenseByCategory = useMemo(
    () => new Map<ExpenseCategory, number>((summaryQ.data?.by_category ?? []).map((c) => [c.category, c.total])),
    [summaryQ.data],
  );

  const totalCogs = COGS_EXPENSE_CATEGORIES.reduce((s, c) => s + (expenseByCategory.get(c) ?? 0), 0);
  const grossProfit = totalIncome - totalCogs;

  const opexEntries = Array.from(expenseByCategory.entries()).filter(([cat]) => !COGS_EXPENSE_CATEGORIES.includes(cat));
  const totalOpex = opexEntries.reduce((s, [, v]) => s + v, 0);
  const netProfit = grossProfit - totalOpex;

  // วิธีตามสูตร — null = backend ยังไม่ส่ง recipe_cogs (แสดง "—" แทนตัวเลขผิด)
  const recipeCogs = revenue?.recipe_cogs ?? null;
  const cogsMethods = [
    { key: "expense", label: t("finance.cogsMethodExpense"), cogs: totalCogs as number | null },
    { key: "recipe", label: t("finance.cogsMethodRecipe"), cogs: recipeCogs },
  ].map((m) => ({
    ...m,
    gross: m.cogs == null ? null : totalIncome - m.cogs,
    net: m.cogs == null ? null : totalIncome - m.cogs - totalOpex,
  }));

  const pnlRows: PnLRow[] = useMemo(() => {
    const rows: PnLRow[] = [
      { key: "income_header", label: t("finance.rowIncomeHeader"), amount: 0, kind: "header" },
      { key: "web_sales", label: t("finance.rowWebSales"), amount: webIncome, kind: "line" },
      { key: "pos_sales", label: t("finance.rowPosSales"), amount: posIncome, kind: "line" },
      { key: "preorder_sales", label: t("finance.rowPreorderSales"), amount: preorderIncome, kind: "line" },
      ...(otherIncome > 0 ? [{ key: "other_sales", label: t("finance.rowOtherSales"), amount: otherIncome, kind: "line" as const }] : []),
      { key: "total_income", label: t("finance.rowTotalIncome"), amount: totalIncome, kind: "subtotal" },
      { key: "cogs_header", label: t("finance.rowCogsHeader"), amount: 0, kind: "header" },
      ...COGS_EXPENSE_CATEGORIES
        .filter((c) => (expenseByCategory.get(c) ?? 0) > 0)
        .map((c) => ({ key: `cogs_${c}`, label: t(`enums.expenseCategory.${c}`), amount: expenseByCategory.get(c) ?? 0, kind: "line" as const })),
      { key: "total_cogs", label: t("finance.rowTotalCogs"), amount: totalCogs, kind: "subtotal" },
      { key: "gross_profit", label: t("finance.rowGrossProfit"), amount: grossProfit, kind: "gross" },
      { key: "opex_header", label: t("finance.rowOpexHeader"), amount: 0, kind: "header" },
      ...opexEntries.map(([cat, amt]) => ({ key: `opex_${cat}`, label: t(`enums.expenseCategory.${cat}`), amount: amt, kind: "line" as const })),
      { key: "total_opex", label: t("finance.rowTotalOpex"), amount: totalOpex, kind: "subtotal" },
      { key: "net_profit", label: t("finance.rowNetResult"), amount: netProfit, kind: "net" },
    ];
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webIncome, posIncome, preorderIncome, otherIncome, totalIncome, totalCogs, grossProfit, totalOpex, netProfit, expenseByCategory, opexEntries, locale]);

  // ── ตารางเปรียบเทียบ — ตามช่วงเวลาที่เลือก (ช่วงของแต่ละแบบดู summaryRanges.trendBuckets) ──
  // รายรับ/รายจ่ายต่อช่วงจาก finance-trend (backend รวมให้ — ตัวเลขชุดเดียวกับ revenue-by-channel / expenses/summary)
  // ข้ามวันที่ที่อ่านไม่ได้ / ปีที่พิมพ์ผิด (เช่น 0202) — ไม่งั้นปีเป็น NaN (ตารางว่าง) หรือสร้างช่วงรายปีนับพันช่วง
  // ปีแรกที่มีค่าใช้จ่าย (ตารางรายปีเท่านั้น) — ขอรายการเก่าสุด 1 รายการ · ปีที่พิมพ์ผิด (ก่อน ค.ศ. 2000) ตัดด้วย date_from
  const firstExpenseQ = useQuery({
    queryKey: FIRST_EXPENSE_KEY,
    queryFn: () => expensesService.list(FIRST_EXPENSE_PARAMS),
    enabled: period === "year",
  });
  const firstExpenseDate = firstExpenseQ.data?.data[0]?.date;
  const firstExpenseYear = firstExpenseDate && dayjs(firstExpenseDate).isValid() ? dayjs(firstExpenseDate).year() : Infinity;
  const trendBuckets = useMemo(
    () => buildTrendBuckets(period, selectedDate, firstExpenseYear),
    [period, selectedDate, firstExpenseYear],
  );
  // ทุกช่วงในคำขอเดียว (finance-trend) — เดิมช่วงละ 2 คำขอ: รายวัน 31 วัน = 62 คำขอพร้อมกัน
  const trendQ = useQuery({
    queryKey: financeTrendKey(trendBuckets),
    queryFn: () => reportsService.financeTrend(trendBuckets),
    enabled: trendBuckets.length > 0,
  });
  // null = ยังโหลดไม่เสร็จ/โหลดไม่สำเร็จ — เดิม ?? 0 ทำให้ตารางโชว์ 0 บาทเหมือนไม่มียอดจริง
  const trendIncome = trendBuckets.map((_, i) => trendQ.data?.buckets[i]?.income ?? null);
  const trendExpense = trendBuckets.map((_, i) => trendQ.data?.buckets[i]?.expense ?? null);
  const trendFailed = trendQ.isError;
  const trendIncomeKey = [...trendIncome, "|", ...trendExpense].join(",");

  const monthlyTrend = useMemo(() => {
    const intlLocale = locale === "en" ? "en-US" : "th-TH";
    const label = (b: (typeof trendBuckets)[number]) => {
      if (period === "day") return formatDate(b.from, locale);
      if (period === "week") return `${formatDate(b.from, locale)} – ${formatDate(b.to, locale)}`;
      if (period === "quarter") return t("finance.quarterLabel", { n: b.start.quarter(), year: b.start.year() });
      if (period === "year") return String(b.start.year());
      return new Intl.DateTimeFormat(intlLocale, { month: "short", year: "numeric" }).format(b.start.toDate());
    };
    return trendBuckets.map((b, i) => {
      const expense = trendExpense[i];
      const income = trendIncome[i];
      return { key: b.key, label: label(b), income, expense, profit: income == null || expense == null ? null : income - expense };
    });
    // trendIncome/trendExpense เป็น array ใหม่ทุก render — ใช้ trendIncomeKey (รวมทั้งสองชุด) แทน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendBuckets, trendIncomeKey, period, locale]);

  // ── KPI ──
  // ช่วงที่ยังไม่จบ (เดือนนี้ ฯลฯ) หารด้วยวันที่ผ่านมาแล้ว — เดิมหารด้วยทั้งช่วง วันที่ 5 ของเดือนก็หาร 31 ค่าเฉลี่ยต่ำกว่าจริงมาก
  const now = dayjs();
  const countedEnd = rangeEnd.isAfter(now) ? now : rangeEnd;
  const daysInPeriod = Math.max(1, countedEnd.startOf("day").diff(rangeStart.startOf("day"), "day") + 1);
  const kpis = [
    { key: "margin", label: t("finance.kpiNetMargin"), value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : "—" },
    { key: "avgRevenue", label: t("finance.kpiAvgRevenuePerDay"), value: formatCurrency(Math.round(totalIncome / daysInPeriod), locale) },
    { key: "avgOrders", label: t("finance.kpiAvgOrdersPerDay"), value: (orderCount / daysInPeriod).toFixed(1) },
    { key: "avgOrderValue", label: t("finance.kpiAvgOrderValue"), value: orderCount > 0 ? formatCurrency(Math.round(totalIncome / orderCount), locale) : "—" },
  ];

  const periodLabel = useMemo(() => {
    if (period === "week") return `${formatDate(rangeStart.toISOString(), locale)} – ${formatDate(rangeEnd.toISOString(), locale)}`;
    if (period === "quarter") return t("finance.quarterLabel", { n: selectedDate.quarter(), year: selectedDate.year() });
    if (period === "year") return String(selectedDate.year());
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "th-TH", { month: "long", year: "numeric" }).format(selectedDate.toDate());
  }, [period, selectedDate, rangeStart, rangeEnd, locale, t]);

  const hasTrendData = monthlyTrend.some((r) => (r.income ?? 0) > 0 || (r.expense ?? 0) > 0);

  return {
    isLoading,
    isError,
    refetch: () => { revenueQ.refetch(); summaryQ.refetch(); },
    period, setPeriod,
    selectedDate, setSelectedDate,
    rangeStart, rangeEnd, periodLabel,

    totalIncome, totalCogs, totalOpex, netProfit, orderCount, cogsMethods,
    hasData: totalIncome > 0 || (summaryQ.data?.count ?? 0) > 0 || hasTrendData,

    pnlRows, monthlyTrend, kpis,
    trendFailed,
    refetchTrend: () => void trendQ.refetch(),
  };
}
