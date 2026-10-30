"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance Expenses — ค่าใช้จ่ายของเดือนที่เลือก (backend กรองช่วงวันที่ — ดู expensesQuery.ts)
// + รายจ่ายประจำทุกเดือน (แจ้งเตือนรอบถัดไป) + รายรับของเดือนที่เลือก (ไว้โชว์คู่เทียบ)
// ค้นหา/หมวด/แบ่งหน้า ฝั่ง client ภายในเดือนที่เลือก
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { usePermission } from "@/context/PermissionsContext";
import { useToday } from "@/hooks/useToday";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import type { ExpenseCategory } from "@/constants/enumConfig";
import type { Expense, ExpenseInput } from "@/types/expense";
import { isApiError } from "@/types/api";
import { toExpenseInput, type ExpenseFormValue } from "./expenseForm";
import type { RecurringReminder } from "./_components/RecurringRemindersList";
import { getRangeStartEnd } from "@/utils/period";
import { RECURRING_EXPENSES_KEY, RECURRING_EXPENSES_PARAMS, expensesRangeKey, expensesRangeParams } from "../expensesQuery";

export function useFinanceExpensesViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("finance_expenses");

  const [selectedMonthDate, setSelectedMonthDate] = useState<Dayjs>(dayjs());
  const selectedMonth = selectedMonthDate.format("YYYY-MM");
  const [monthStart, monthEnd] = useMemo(() => getRangeStartEnd("month", selectedMonthDate), [selectedMonthDate]);
  const from = monthStart.toISOString();
  const to = monthEnd.toISOString();

  // ค่าใช้จ่ายของเดือนที่เลือก — backend กรองตามเวลาไทย (เดิม startsWith("YYYY-MM") บนเวลา UTC: ต้นเดือนก่อน 7 โมงตกไปเดือนก่อน)
  const monthQ = useQuery({ queryKey: expensesRangeKey(from, to), queryFn: () => expensesService.list(expensesRangeParams(from, to)) });
  const monthExpenses = useMemo(() => monthQ.data?.data ?? [], [monthQ.data]);
  // รายจ่ายประจำทุกเดือน — การ์ดแจ้งเตือนรอบถัดไปไม่ขึ้นกับเดือนที่เลือก
  const recurringQ = useQuery({ queryKey: RECURRING_EXPENSES_KEY, queryFn: () => expensesService.list(RECURRING_EXPENSES_PARAMS) });

  // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
  const isLoading = monthQ.isPending;
  const isError = monthQ.isError;
  const refetch = () => { void monthQ.refetch(); void recurringQ.refetch(); };

  // รายรับของเดือน — คิดที่ backend (ชำระแล้ว ออเดอร์ + พรีออเดอร์) query key เดียวกับหน้าสรุปกำไร-ขาดทุน ·
  // เดิมโหลดออเดอร์ทั้งร้าน (LIST_ALL) มารวมเองในเครื่อง = JSON ก้อนใหญ่ + งานหนักบน main thread (Lighthouse TBT)
  const revenueQ = useQuery({
    queryKey: ["reports", "revenue-by-channel", from, to],
    queryFn: () => reportsService.revenueByChannel({ date_from: from, date_to: to }),
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthExpenses.filter((e) => {
      const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.vendor ?? "").toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [monthExpenses, search, categoryFilter]);

  const rows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const noReceiptCount = monthExpenses.filter((e) => !e.receipt_url).length;

  const categoryBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    monthExpenses.forEach((e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  const topCategory = categoryBreakdown[0] ?? null;

  const monthIncome = revenueQ.data?.total ?? 0;
  const netProfit = monthIncome - monthTotal;

  /** รายจ่ายประจำที่ยังไม่ถึงกำหนด — วันครบกำหนดถัดไป = วันตั้งต้น + n เดือน (n น้อยสุดที่ไม่ก่อนวันนี้)
   *  บวกจากวันตั้งต้นทุกครั้ง ไม่บวกต่อจากเดือนก่อน — เดิม 31 ม.ค. → 28 ก.พ. แล้วค้างวันที่ 28 ทุกเดือนหลังจากนั้น
   *  today จาก useToday — เปิดหน้าค้างข้ามคืน กำหนดถัดไป/ป้ายใกล้ครบกำหนดเลื่อนตาม */
  const today = useToday();
  const recurringReminders: RecurringReminder[] = useMemo(() => {
    return (recurringQ.data?.data ?? [])
      .filter((e) => e.is_recurring)
      .map((e) => {
        const start = dayjs(e.date);
        let due = start;
        for (let n = 1; due.isBefore(today, "day"); n++) due = start.add(n, "month");
        return {
          _id: e._id,
          description: e.description,
          dueDate: due.toISOString(),
          amount: e.amount,
          isUrgent: due.startOf("day").diff(today, "day") <= 7,
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [recurringQ.data, today]);

  // ── mutations ──
  const invalidate = () => qc.invalidateQueries({ queryKey: ["expenses"] });

  const saveExpense = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: ExpenseInput }) =>
      (id ? expensesService.update(id, body) : expensesService.create(body)),
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("finance.saved") : t("finance.added"));
      invalidate();
      setFormOpen(false);
      setEditTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("finance.saveFailed")),
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesService.remove(id),
    onSuccess: () => { alert.success(t("finance.deleted")); invalidate(); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("finance.deleteFailed")),
  });

  const onExport = () => {
    if (filtered.length === 0) {
      alert.info(t("finance.exportEmpty"));
      return;
    }
    const headers = [
      t("finance.colDate"), t("finance.fieldDescription"), t("finance.fieldCategory"),
      t("finance.fieldAmount"), t("finance.fieldPaymentMethod"), t("finance.fieldVendor"),
      t("finance.fieldRecurring"), t("finance.fieldReceipt"), t("finance.fieldNote"),
    ];
    const rowsCsv = filtered.map((e) => [
      forceText(formatDate(e.date, locale)),
      e.description,
      t(`enums.expenseCategory.${e.category}`),
      e.amount,
      t(`enums.expensePaymentMethod.${e.payment_method}`),
      e.vendor ?? "",
      e.is_recurring ? t("common.yes") : t("common.no"),
      e.receipt_url ? t("common.yes") : t("common.no"),
      e.note ?? "",
    ]);
    exportToCsv(`expenses_${selectedMonth}`, headers, rowsCsv);
    alert.success(t("finance.exportSuccess", { n: filtered.length }));
  };

  return {
    perm,
    isLoading, isError, refetch,

    selectedMonth, selectedMonthDate, setSelectedMonthDate: (d: Dayjs) => { setSelectedMonthDate(d); setPage(1); },
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    categoryFilter, setCategoryFilter: (v: ExpenseCategory | "all") => { setCategoryFilter(v); setPage(1); },
    page, pageSize, setPagination: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
    rows, total: filtered.length,

    monthTotal, monthCount: monthExpenses.length, noReceiptCount, topCategory,
    categoryBreakdown, monthIncome, netProfit, recurringReminders,

    formOpen, editTarget,
    openAdd: () => { setEditTarget(null); setFormOpen(true); },
    openEdit: (e: Expense) => { setEditTarget(e); setFormOpen(true); },
    closeForm: () => { setFormOpen(false); setEditTarget(null); },
    onSave: (v: ExpenseFormValue) => saveExpense.mutate({ id: editTarget?._id ?? null, body: toExpenseInput(v) }),
    saving: saveExpense.isPending,
    onDelete: (id: string) => deleteExpense.mutate(id),
    onExport,
  };
}
