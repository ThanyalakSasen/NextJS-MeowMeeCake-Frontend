"use client";
// View ของ Product Stock — JSX ล้วน รับ props จาก useProductStockViewModel
import { useTranslations, useLocale } from "next-intl";
import { Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency } from "@/i18n/format";
import { LOW_STOCK_THRESHOLD } from "./stockStatus";
import type { StockProductRow, useProductStockViewModel } from "./useProductStockViewModel";
import { StockProgressRow } from "./_components/StockProgressRow";
import { AdjustStockModal } from "./_components/AdjustStockModal";

type VM = ReturnType<typeof useProductStockViewModel>;

export function ProductStockView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<StockProductRow>[] = [
    {
      key: "name",
      title: t("productStock.colProduct"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
          {r.category && <p className="text-sm text-gray-600">{r.category}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      title: t("productStock.colStock"),
      render: (r) => <StockProgressRow qty={r.stock} unit={r.unit} />,
    },
    {
      key: "status",
      title: t("productStock.colStatus"),
      render: (r) => <StatusBadge group="stockStatus" value={r.status} />,
    },
    {
      key: "price",
      title: t("productStock.colPrice"),
      align: "right",
      render: (r) => formatCurrency(r.price, locale),
    },
    {
      key: "value",
      title: t("productStock.colValue"),
      align: "right",
      render: (r) => formatCurrency(r.value, locale),
    },
  ];

  const statusOptions = [
    { value: "all", label: t("common.all") },
    { value: "ok", label: t("enums.stockStatus.ok") },
    { value: "low", label: t("enums.stockStatus.low") },
    { value: "out", label: t("enums.stockStatus.out") },
  ];

  return (
    <ListPageLayout
      title={t("productStock.title")}
      description={t("productStock.description")}
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput
                value={vm.search}
                onChange={vm.setSearch}
                placeholder={t("productStock.searchPlaceholder")}
              />
              <div style={{ minWidth: 160 }}>
                <Select
                  value={vm.categoryId}
                  onChange={(v) => vm.setCategoryId(v as string)}
                  options={[
                    { value: "all", label: t("common.all") },
                    ...vm.categories.map((c) => ({ value: c._id, label: c.category_name })),
                  ]}
                />
              </div>
              <div style={{ minWidth: 150 }}>
                <Select
                  value={vm.status}
                  onChange={(v) => vm.setStatus(v as VM["status"])}
                  options={statusOptions}
                />
              </div>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard
              label={t("productStock.statTracked")}
              value={vm.stats.tracked}
              sub={t("productStock.statTrackedSub")}
            />
            <StatCard
              label={t("productStock.statLow")}
              value={vm.stats.low}
              sub={t("productStock.statLowSub", { n: LOW_STOCK_THRESHOLD })}
              tone="warn"
            />
            <StatCard
              label={t("productStock.statOut")}
              value={vm.stats.out}
              sub={t("productStock.statOutSub")}
              tone="down"
            />
            <StatCard
              label={t("productStock.statValue")}
              value={formatCurrency(vm.stats.totalValue, locale)}
              sub={t("productStock.statValueSub")}
            />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("productStock.empty")}
            actions={
              vm.perm.update
                ? (r) => (
                    <Button size="small" onClick={() => vm.openAdjust(r)}>
                      {t("productStock.adjust")}
                    </Button>
                  )
                : undefined
            }
          />
        </div>
      )}

      <AdjustStockModal
        target={vm.adjustTarget}
        saving={vm.saving}
        onClose={vm.closeAdjust}
        onSave={vm.onSaveAdjust}
      />
    </ListPageLayout>
  );
}
