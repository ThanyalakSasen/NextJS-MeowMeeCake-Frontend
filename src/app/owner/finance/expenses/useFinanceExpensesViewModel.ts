"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Finance Expenses — โหลด expenses + orders (ไว้โชว์รายรับคู่เทียบ) ครั้งเดียว
// filter/pagination ฝั่ง client ภายในเดือนที่เลือก (แพทเทิร์นเดียวกับ Production/Ingredient History)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import { expensesService } from "@/services/expenses";
import { ordersService } from "@/services/orders";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import { buildMonthOptions } from "@/utils/dateRange";
import type { ExpenseCategory } from "@/constants/enumConfig";
import type { Expense, ExpenseInput } from "@/types/expense";
import { toExpenseInput, type ExpenseFormValue } from "./expenseForm";
import type { RecurringReminder } from "./_components/RecurringRemindersList";

export function useFinanceExpensesViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("reports");

  const expensesQ = useQuery({ queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: 200 }) });
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => ordersService.list({ limit: 200 }) });

  const expenses = useMemo(() => expensesQ.data?.data ?? [], [expensesQ.data]);
  const orders = useMemo(() => ordersQ.data?.data ?? [], [ordersQ.data]);

  const isLoading = expensesQ.isLoading;
  const isError = expensesQ.isError;
  const refetch = () => expensesQ.refetch();

  const monthOptions = useMemo(() => buildMonthOptions(locale), [locale]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
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

  const monthIncome = useMemo(
    () => orders
      .filter((o) => o.payment_status === "paid" && o.created_at.startsWith(selectedMonth))
      .reduce((s, o) => s + o.total_amount, 0),
    [orders, selectedMonth],
  );
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
    onError: () => alert.error(t("finance.saveFailed")),
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesService.remove(id),
    onSuccess: () => { alert.success(t("finance.deleted")); invalidate(); },
    onError: () => alert.error(t("finance.deleteFailed")),
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

    monthOptions, selectedMonth, setSelectedMonth,
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
