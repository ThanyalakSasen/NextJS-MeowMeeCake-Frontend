"use client";
// View ของ Ingredient Stock — ตาราง + ปุ่ม รับเข้า / เบิกใช้ / ปรับยอด ต่อแถว
import { Progress } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency, formatNumber } from "@/i18n/format";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import type { StockRow, useIngredientStockViewModel } from "./useIngredientStockViewModel";
import { StockActionModal } from "./_components/StockActionModal";

type VM = ReturnType<typeof useIngredientStockViewModel>;

export function IngredientStockView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<StockRow>[] = [
    {
      key: "name",
      title: t("ingredientStock.colName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
          <p className="text-sm text-gray-600">{r.sku}</p>
        </div>
      ),
    },
    {
      key: "stock",
      title: t("ingredientStock.colStock"),
      render: (r) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-semibold" style={{ color: STOCK_STATUS_CONFIG[r.status].text }}>
            {formatNumber(r.currentStock, locale)}{" "}
            <span className="font-normal text-gray-600">{r.unitAbbr}</span>
          </p>
          <Progress percent={r.pct} showInfo={false} size="small" strokeColor={STOCK_STATUS_CONFIG[r.status].dotColor} />
        </div>
      ),
    },
    {
      key: "reorder",
      title: t("ingredientStock.colReorder"),
      align: "right",
      render: (r) => `${formatNumber(r.reorderPoint, locale)} ${r.unitAbbr}`,
    },
    {
      key: "status",
      title: t("ingredientStock.colStatus"),
      render: (r) => <StatusBadge group="stockStatus" value={r.status} />,
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
      title={t("ingredientStock.title")}
      description={t("ingredientStock.description")}
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("ingredientStock.searchPlaceholder")} />
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
            <StatCard label={t("ingredientStock.statTracked")} value={vm.stats.tracked} sub={t("ingredientStock.statTrackedSub")} />
            <StatCard label={t("enums.stockStatus.low")} value={vm.stats.low} sub={t("ingredientStock.statLowSub")} tone="warn" />
            <StatCard label={t("enums.stockStatus.out")} value={vm.stats.out} sub={t("ingredientStock.statOutSub")} tone="down" />
            <StatCard label={t("ingredientStock.statValue")} value={formatCurrency(vm.stats.totalValue, locale)} sub={t("ingredientStock.statValueSub")} />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("ingredientStock.empty")}
            actions={
              vm.perm.update
                ? (r) => (
                    <div className="flex justify-end gap-2">
                      <Button size="small" onClick={() => vm.openAction(r, "receive")}>{t("ingredientStock.ok_receive")}</Button>
                      <Button size="small" onClick={() => vm.openAction(r, "use")}>{t("ingredientStock.ok_use")}</Button>
                      <Button size="small" onClick={() => vm.openAction(r, "adjust")}>{t("ingredientStock.ok_adjust")}</Button>
                    </div>
                  )
                : undefined
            }
          />
        </div>
      )}

      <StockActionModal
        target={vm.target}
        mode={vm.mode}
        saving={vm.submitting}
        onClose={vm.closeAction}
        onSubmit={vm.onSubmit}
      />
    </ListPageLayout>
  );
}
