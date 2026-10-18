"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance Expenses — โหลด expenses ครั้งเดียว + รายรับของเดือนที่เลือก (ไว้โชว์คู่เทียบ)
// filter/pagination ฝั่ง client ภายในเดือนที่เลือก (แพทเทิร์นเดียวกับ Production/Ingredient History)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import type { ExpenseCategory } from "@/constants/enumConfig";
import type { Expense, ExpenseInput } from "@/types/expense";
import { isApiError } from "@/types/api";
import { toExpenseInput, type ExpenseFormValue } from "./expenseForm";
import type { RecurringReminder } from "./_components/RecurringRemindersList";
import { LIST_ALL } from "@/lib/http";
import { getRangeStartEnd } from "@/utils/period";

export function useFinanceExpensesViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("reports");

  const expensesQ = useQuery({ queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: LIST_ALL }) });
  const expenses = useMemo(() => expensesQ.data?.data ?? [], [expensesQ.data]);

  // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
  const isLoading = expensesQ.isPending;
  const isError = expensesQ.isError;
  const refetch = () => expensesQ.refetch();

  const [selectedMonthDate, setSelectedMonthDate] = useState<Dayjs>(dayjs());
  const selectedMonth = selectedMonthDate.format("YYYY-MM");

  // รายรับของเดือน — คิดที่ backend (ชำระแล้ว ออเดอร์ + พรีออเดอร์) query key เดียวกับหน้าสรุปกำไร-ขาดทุน ·
  // เดิมโหลดออเดอร์ทั้งร้าน (LIST_ALL) มารวมเองในเครื่อง = JSON ก้อนใหญ่ + งานหนักบน main thread (Lighthouse TBT)
  const [monthStart, monthEnd] = useMemo(() => getRangeStartEnd("month", selectedMonthDate), [selectedMonthDate]);
  const revenueQ = useQuery({
    queryKey: ["reports", "revenue-by-channel", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () => reportsService.revenueByChannel({ date_from: monthStart.toISOString(), date_to: monthEnd.toISOString() }),
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

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

  /** รายจ่ายประจำที่ยังไม่ถึงกำหนด — เลื่อนวันครบกำหนดไปเรื่อย ๆ ทีละเดือนจนกว่าจะถึงอนาคต */
  const recurringReminders: RecurringReminder[] = useMemo(() => {
    const today = dayjs();
    return expenses
      .filter((e) => e.is_recurring)
      .map((e) => {
        let due = dayjs(e.date);
        while (due.isBefore(today, "day")) due = due.add(1, "month");
        return {
          _id: e._id,
          description: e.description,
          dueDate: due.toISOString(),
          amount: e.amount,
          isUrgent: due.diff(today, "day") <= 7,
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [expenses]);

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
