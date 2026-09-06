"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance P&L — โหลด orders + expenses ครั้งเดียว คำนวณรายรับ/ต้นทุน/กำไรตามช่วงเวลาที่เลือก
//
// **ตัดจากต้นทาง:** ไม่ประมาณต้นทุนวัตถุดิบจากสูตร (recipe cost) เพราะ `Order.items` (types/order.ts)
// เก็บแค่ `product_name` ไม่มี `product_id` ผูกกลับ — join ไปยัง Recipe ไม่ได้แม่นยำ (ต้อง refactor
// Order vertical ก่อน — บันทึกเป็น follow-up เดียวกับที่ Production ยังไม่ผูก recipe_id)
// COGS ที่นี่ = เฉพาะค่าใช้จ่ายหมวด "วัตถุดิบ"/"บรรจุภัณฑ์" ที่บันทึกจริงใน Expenses เท่านั้น
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { ordersService } from "@/services/orders";
import { expensesService } from "@/services/expenses";
import { formatCurrency, formatDate } from "@/i18n/format";
import { COGS_EXPENSE_CATEGORIES } from "@/constants/enumConfig";
import type { ExpenseCategory } from "@/constants/enumConfig";
import { getRangeStartEnd, type PeriodType } from "./financePeriod";

export interface PnLRow {
  key: string;
  label: string;
  amount: number;
  kind: "header" | "line" | "subtotal" | "gross" | "net";
}

export function useFinanceSummaryViewModel() {
  const t = useTranslations();
  const locale = useLocale();

  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => ordersService.list({ limit: 200 }) });
  const expensesQ = useQuery({ queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: 200 }) });

  const orders = useMemo(() => ordersQ.data?.data ?? [], [ordersQ.data]);
  const expenses = useMemo(() => expensesQ.data?.data ?? [], [expensesQ.data]);
  const isLoading = ordersQ.isLoading || expensesQ.isLoading;

  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const [rangeStart, rangeEnd] = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);

  const ordersInRange = useMemo(
    () => orders.filter((o) => {
      if (o.payment_status !== "paid") return false;
      const d = dayjs(o.created_at);
      return !d.isBefore(rangeStart) && !d.isAfter(rangeEnd);
    }),
    [orders, rangeStart, rangeEnd],
  );
  const expensesInRange = useMemo(
    () => expenses.filter((e) => {
      const d = dayjs(e.date);
      return !d.isBefore(rangeStart) && !d.isAfter(rangeEnd);
    }),
    [expenses, rangeStart, rangeEnd],
  );

  const readyIncome = ordersInRange.filter((o) => o.order_type === "ready").reduce((s, o) => s + o.total_amount, 0);
  const preorderIncome = ordersInRange.filter((o) => o.order_type === "preorder").reduce((s, o) => s + o.total_amount, 0);
  const totalIncome = readyIncome + preorderIncome;

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
      { key: "ready_sales", label: t("finance.rowReadySales"), amount: readyIncome, kind: "line" },
      { key: "preorder_sales", label: t("finance.rowPreorderSales"), amount: preorderIncome, kind: "line" },
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
      { key: "net_profit", label: t("finance.rowNetProfit"), amount: netProfit, kind: "net" },
    ];
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyIncome, preorderIncome, totalIncome, totalCogs, grossProfit, totalOpex, netProfit, expenseByCategory, opexEntries, locale]);

  // ── เปรียบเทียบรายเดือน (6 เดือนล่าสุด) ──
  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = dayjs().subtract(5 - i, "month");
      return { key: d.format("YYYY-MM"), label: d.format("MMM YYYY"), income: 0, expense: 0 };
    });
    const byKey = new Map(months.map((m) => [m.key, m]));
    orders.filter((o) => o.payment_status === "paid").forEach((o) => {
      const m = byKey.get(dayjs(o.created_at).format("YYYY-MM"));
      if (m) m.income += o.total_amount;
    });
    expenses.forEach((e) => {
      const m = byKey.get(dayjs(e.date).format("YYYY-MM"));
      if (m) m.expense += e.amount;
    });
    return months.map((m) => ({ ...m, profit: m.income - m.expense }));
  }, [orders, expenses]);

  // ── KPI ──
  const daysInPeriod = Math.max(1, rangeEnd.diff(rangeStart, "day") + 1);
  const orderCount = ordersInRange.length;
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
    period, setPeriod,
    selectedDate, setSelectedDate,
    rangeStart, rangeEnd, periodLabel,

    totalIncome, totalCogs, totalOpex, netProfit, orderCount,
    hasData: totalIncome > 0 || expensesInRange.length > 0,

    pnlRows, monthlyTrend, kpis,
  };
}
