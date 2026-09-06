"use client";
// View ของ Finance Expenses — JSX ล้วน รับ props จาก useFinanceExpensesViewModel
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, BreakdownList } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency, formatDate } from "@/i18n/format";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_CONFIG } from "@/constants/enumConfig";
import type { ExpenseCategory } from "@/constants/enumConfig";
import type { Expense } from "@/types/expense";
import type { useFinanceExpensesViewModel } from "./useFinanceExpensesViewModel";
import { ExpenseFormModal } from "./_components/ExpenseFormModal";
import { RecurringRemindersList } from "./_components/RecurringRemindersList";

type VM = ReturnType<typeof useFinanceExpensesViewModel>;

export function FinanceExpensesView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<Expense>[] = [
    {
      key: "date",
      title: t("finance.colDate"),
      width: 100,
      render: (e) => <span className="whitespace-nowrap text-gray-600">{formatDate(e.date, locale)}</span>,
    },
    {
      key: "description",
      title: t("finance.colDescription"),
      render: (e) => (
        <div>
          <p className="font-medium text-brown-900">{e.description}</p>
          {e.vendor && <p className="text-sm text-gray-400">{e.vendor}</p>}
        </div>
      ),
    },
    {
      key: "category",
      title: t("finance.fieldCategory"),
      render: (e) => {
        const cfg = EXPENSE_CATEGORY_CONFIG[e.category];
        return <Tag style={{ background: cfg.bg, color: cfg.color, borderColor: "transparent" }}>{t(`enums.expenseCategory.${e.category}`)}</Tag>;
      },
    },
    {
      key: "payment_method",
      title: t("finance.fieldPaymentMethod"),
      render: (e) => <span className="text-gray-500">{t(`enums.expensePaymentMethod.${e.payment_method}`)}</span>,
    },
    {
      key: "amount",
      title: t("finance.fieldAmount"),
      align: "right",
      render: (e) => <span className="font-semibold text-red-500">-{formatCurrency(e.amount, locale)}</span>,
    },
    {
      key: "receipt",
      title: t("finance.fieldReceipt"),
      align: "center",
      render: (e) => (
        e.receipt_url ? (
          <a href={e.receipt_url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.receipt_url} alt={t("finance.fieldReceipt")} className="h-8 w-8 rounded object-cover" />
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )
      ),
    },
  ];

  return (
    <ListPageLayout
      title={t("finance.expensesTitle")}
      description={t("finance.expensesDescription", { n: vm.monthCount })}
      actions={
        <>
          <Button icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExport}>
            {t("common.export")}
          </Button>
          {vm.perm.create && (
            <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAdd}>
              {t("finance.addExpense")}
            </Button>
          )}
        </>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("finance.searchPlaceholder")} />
              <div style={{ minWidth: 160 }}>
                <Select
                  value={vm.categoryFilter}
                  onChange={(v) => vm.setCategoryFilter(v as ExpenseCategory | "all")}
                  options={[
                    { value: "all", label: t("common.all") },
                    ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.expenseCategory.${c}`) })),
                  ]}
                />
              </div>
            </>
          }
          right={
            <div style={{ minWidth: 170 }}>
              <Select value={vm.selectedMonth} onChange={vm.setSelectedMonth} options={vm.monthOptions} />
            </div>
          }
        />
      }
    >
      <div className="flex flex-col gap-5">
        <StatCardsGrid>
          <StatCard label={t("finance.statMonthTotal")} value={formatCurrency(vm.monthTotal, locale)} sub={t("finance.statMonthTotalSub", { n: vm.monthCount })} tone="down" />
          <StatCard label={t("common.all")} value={vm.monthCount} />
          <StatCard
            label={t("finance.statTopCategory")}
            value={vm.topCategory ? t(`enums.expenseCategory.${vm.topCategory[0] as ExpenseCategory}`) : "—"}
            sub={vm.topCategory && vm.monthTotal > 0 ? `${formatCurrency(vm.topCategory[1], locale)} (${Math.round((vm.topCategory[1] / vm.monthTotal) * 100)}%)` : t("finance.noExpenseYet")}
          />
          <StatCard label={t("finance.statNoReceipt")} value={vm.noReceiptCount} sub={t("finance.statNoReceiptSub")} tone={vm.noReceiptCount > 0 ? "warn" : "muted"} />
        </StatCardsGrid>

        <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}>
          <div>
            {vm.isError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-gray-600">{t("common.loadFailed")}</p>
                <Button onClick={vm.refetch}>{t("common.retry")}</Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={vm.rows}
                loading={vm.isLoading}
                emptyText={t("finance.empty")}
                actions={
                  vm.perm.update || vm.perm.delete
                    ? (e) => (
                        <div className="flex justify-end gap-2">
                          {vm.perm.update && <Button size="small" onClick={() => vm.openEdit(e)}>{t("common.edit")}</Button>}
                          {vm.perm.delete && (
                            <ConfirmDeletePopup title={t("finance.deleteConfirm", { name: e.description })} onConfirm={() => vm.onDelete(e._id)}>
                              <Button size="small" danger>{t("common.delete")}</Button>
                            </ConfirmDeletePopup>
                          )}
                        </div>
                      )
                    : undefined
                }
                pagination={{ page: vm.page, pageSize: vm.pageSize, total: vm.total, onChange: vm.setPagination }}
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
              <p className="mb-2.5 text-sm font-semibold text-brown-900">{t("finance.monthSummaryTitle")}</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> {t("finance.totalIncome")}
                  </span>
                  <span className="font-semibold text-green-600">{formatCurrency(vm.monthIncome, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-red-400" /> {t("finance.totalExpense")}
                  </span>
                  <span className="font-semibold text-red-500">{formatCurrency(vm.monthTotal, locale)}</span>
                </div>
                <div className="my-1 border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t("finance.netProfit")}</span>
                  <span className={`font-bold ${vm.netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(vm.netProfit, locale)}</span>
                </div>
                <p className="text-right text-gray-400">
                  {vm.monthIncome > 0 ? t("finance.profitMargin", { pct: ((vm.netProfit / vm.monthIncome) * 100).toFixed(1) }) : t("finance.noIncomeThisMonth")}
                </p>
              </div>
            </div>

            <BreakdownList
              title={t("finance.categoryBreakdownTitle")}
              entries={vm.categoryBreakdown.map(([cat, amt]) => [t(`enums.expenseCategory.${cat as ExpenseCategory}`), amt])}
              emptyText={t("finance.noExpenseYet")}
              formatValue={(n) => formatCurrency(n, locale)}
            />

            <RecurringRemindersList reminders={vm.recurringReminders} locale={locale} />
          </div>
        </div>
      </div>

      <ExpenseFormModal
        key={vm.editTarget?._id ?? "new"}
        open={vm.formOpen}
        editTarget={vm.editTarget}
        saving={vm.saving}
        onClose={vm.closeForm}
        onSubmit={vm.onSave}
      />
    </ListPageLayout>
  );
}
