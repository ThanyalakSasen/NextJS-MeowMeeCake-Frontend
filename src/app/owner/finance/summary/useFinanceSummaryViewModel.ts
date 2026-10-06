"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance P&L — รายรับจาก backend (revenue-by-channel: ออเดอร์เว็บ/หน้าร้าน + พรีออเดอร์ ที่ชำระแล้ว)
// + ค่าใช้จ่ายจาก expenses (โหลดครั้งเดียว) → คำนวณต้นทุน/กำไรตามช่วงเวลาที่เลือก
// เดิมรวมรายรับเองจาก /admin/orders (limit 200, ไม่นับพรีออเดอร์ = 0 ตายตัว) และแยกยอดออนไลน์ด้วย
// revenue-by-type ที่ backend #52 เปลี่ยน shape ไปแล้ว (ไม่มี .online → NaN ทั้งตาราง) — BACKLOG2 §3
//
// **ตัดจากต้นทาง:** ไม่ประมาณต้นทุนวัตถุดิบจากสูตร (recipe cost) เพราะ `Order.items` (types/order.ts)
// เก็บแค่ `product_name` ไม่มี `product_id` ผูกกลับ — join ไปยัง Recipe ไม่ได้แม่นยำ (ต้อง refactor
// Order vertical ก่อน — บันทึกเป็น follow-up เดียวกับที่ Production ยังไม่ผูก recipe_id)
// COGS ที่นี่ = เฉพาะค่าใช้จ่ายหมวด "วัตถุดิบ"/"บรรจุภัณฑ์" ที่บันทึกจริงใน Expenses เท่านั้น
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { formatCurrency, formatDate } from "@/i18n/format";
import { COGS_EXPENSE_CATEGORIES } from "@/constants/enumConfig";
import type { ExpenseCategory } from "@/constants/enumConfig";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { LIST_ALL } from "@/lib/http";

export interface PnLRow {
  key: string;
  label: string;
  amount: number;
  kind: "header" | "line" | "subtotal" | "gross" | "net";
}

export function useFinanceSummaryViewModel() {
  const t = useTranslations();
  const locale = useLocale();

  const expensesQ = useQuery({ queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: LIST_ALL }) });
  const expenses = useMemo(() => expensesQ.data?.data ?? [], [expensesQ.data]);

  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const [rangeStart, rangeEnd] = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);

  // รายรับแยกตามช่องทาง (คิดที่ backend ทั้งหมด — ชำระแล้ว, ช่วงวันที่ตาม created_at เหมือนที่หน้านี้เคยกรองเอง)
  const revenueQ = useQuery({
    queryKey: ["reports", "revenue-by-channel", rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () => reportsService.revenueByChannel({ date_from: rangeStart.toISOString(), date_to: rangeEnd.toISOString() }),
  });
  const isLoading = expensesQ.isLoading || revenueQ.isLoading;
  // รายรับมาจาก revenueQ อย่างเดียว — ถ้าโหลดไม่ได้ต้องบอกผู้ใช้ ห้ามโชว์รายรับ 0 / กำไรติดลบที่ผิดเงียบ ๆ
  const isError = expensesQ.isError || revenueQ.isError;

  const expensesInRange = useMemo(
    () => expenses.filter((e) => {
      const d = dayjs(e.date);
      return !d.isBefore(rangeStart) && !d.isAfter(rangeEnd);
    }),
    [expenses, rangeStart, rangeEnd],
  );

  const revenue = revenueQ.data;
  const webIncome = revenue?.web ?? 0;
  const posIncome = revenue?.pos ?? 0;
  const preorderIncome = revenue?.preorder ?? 0;
  // ออเดอร์เลขรุ่นเก่า (ก่อนแยก ORD-/POS-) — โชว์แถวเฉพาะเมื่อมียอด
  const otherIncome = revenue?.other ?? 0;
  const totalIncome = revenue?.total ?? 0;
  const orderCount = revenue?.orders ?? 0;

  const expenseByCategory = useMemo(() => {
    const m = new Map<ExpenseCategory, number>();
    expensesInRange.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount));
    return m;
  }, [expensesInRange]);

  const totalCogs = COGS_EXPENSE_CATEGORIES.reduce((s, c) => s + (expenseByCategory.get(c) ?? 0), 0);
  const grossProfit = totalIncome - totalCogs;

  const opexEntries = Array.from(expenseByCategory.entries()).filter(([cat]) => !COGS_EXPENSE_CATEGORIES.includes(cat));
  const totalOpex = opexEntries.reduce((s, [, v]) => s + v, 0);
  const netProfit = grossProfit - totalOpex;

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

  // ── เปรียบเทียบรายเดือน (6 เดือนล่าสุด) ──
  // รายรับต่อเดือนจาก revenue-by-channel เดือนละ 1 request (นับพรีออเดอร์ด้วย ตัวเลขชุดเดียวกับตาราง P&L)
  const [trendMonths] = useState(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = dayjs().subtract(5 - i, "month");
      return { key: d.format("YYYY-MM"), from: d.startOf("month").toISOString(), to: d.endOf("month").toISOString() };
    }),
  );
  const trendQs = useQueries({
    queries: trendMonths.map((m) => ({
      queryKey: ["reports", "revenue-by-channel", m.from, m.to],
      queryFn: () => reportsService.revenueByChannel({ date_from: m.from, date_to: m.to }),
    })),
  });
  const trendIncome = trendQs.map((q) => q.data?.total ?? 0);
  const trendIncomeKey = trendIncome.join(",");

  const monthlyTrend = useMemo(() => {
    const months = trendMonths.map((m, i) => ({
      key: m.key,
      label: dayjs(m.from).format("MMM YYYY"),
      income: trendIncome[i],
      expense: 0,
    }));
    const byKey = new Map(months.map((m) => [m.key, m]));
    expenses.forEach((e) => {
      const m = byKey.get(dayjs(e.date).format("YYYY-MM"));
      if (m) m.expense += e.amount;
    });
    return months.map((m) => ({ ...m, profit: m.income - m.expense }));
    // trendIncome เป็น array ใหม่ทุก render — ใช้ trendIncomeKey แทน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendMonths, trendIncomeKey, expenses]);

  // ── KPI ──
  const daysInPeriod = Math.max(1, rangeEnd.diff(rangeStart, "day") + 1);
  const kpis = [
    { key: "margin", label: t("finance.kpiNetMargin"), value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : "—" },
    { key: "avgRevenue", label: t("finance.kpiAvgRevenuePerDay"), value: formatCurrency(Math.round(totalIncome / daysInPeriod), locale) },
    { key: "avgOrders", label: t("finance.kpiAvgOrdersPerDay"), value: (orderCount / daysInPeriod).toFixed(1) },
    { key: "avgOrderValue", label: t("finance.kpiAvgOrderValue"), value: orderCount > 0 ? formatCurrency(Math.round(totalIncome / orderCount), locale) : "—" },
  ];

  const periodLabel = useMemo(() => {
    if (period === "day") return formatDate(selectedDate.toISOString(), locale);
    if (period === "week") return `${formatDate(rangeStart.toISOString(), locale)} – ${formatDate(rangeEnd.toISOString(), locale)}`;
    if (period === "quarter") return t("finance.quarterLabel", { n: selectedDate.quarter(), year: selectedDate.year() });
    if (period === "year") return String(selectedDate.year());
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "th-TH", { month: "long", year: "numeric" }).format(selectedDate.toDate());
  }, [period, selectedDate, rangeStart, rangeEnd, locale, t]);

  return {
    isLoading,
    isError,
    refetch: () => { revenueQ.refetch(); expensesQ.refetch(); },
    period, setPeriod,
    selectedDate, setSelectedDate,
    rangeStart, rangeEnd, periodLabel,

    totalIncome, totalCogs, totalOpex, netProfit, orderCount,
    hasData: totalIncome > 0 || expensesInRange.length > 0,

    pnlRows, monthlyTrend, kpis,
  };
}
