"use client";
// View ของ Ingredient History — ตาราง log การเคลื่อนไหวสต็อกวัตถุดิบ
import { useTranslations, useLocale } from "next-intl";
import { Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatDate, formatNumber } from "@/i18n/format";
import { INGREDIENT_TXN_CONFIG } from "@/constants/enumConfig";
import type { HistoryRow, useIngredientHistoryViewModel } from "./useIngredientHistoryViewModel";

type VM = ReturnType<typeof useIngredientHistoryViewModel>;

export function IngredientHistoryView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<HistoryRow>[] = [
    {
      key: "time",
      title: t("ingredientHistory.colTime"),
      render: (r) => formatDate(r.createdAt, locale, { withTime: true }),
    },
    { key: "ingredient", title: t("ingredientHistory.colIngredient"), render: (r) => r.ingredientName },
    {
      key: "type",
      title: t("ingredientHistory.colType"),
      render: (r) => {
        const cfg = INGREDIENT_TXN_CONFIG[r.type];
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {t(`enums.ingredientTxnType.${r.type}`)}
          </span>
        );
      },
    },
    {
      key: "quantity",
      title: t("ingredientHistory.colQty"),
      align: "right",
      render: (r) => {
        const cfg = INGREDIENT_TXN_CONFIG[r.type];
        const prefix = r.type === "receive" ? "+" : r.type === "use" ? "−" : "";
        return (
          <span className="font-semibold" style={{ color: cfg.color }}>
            {prefix}
            {formatNumber(r.quantity, locale)} <span className="font-normal text-gray-600">{r.unitAbbr}</span>
          </span>
        );
      },
    },
    { key: "note", title: t("ingredientHistory.colNote"), render: (r) => r.note || "—" },
    { key: "by", title: t("ingredientHistory.colBy"), render: (r) => r.performedBy },
  ];

  const typeOptions = [
    { value: "all", label: t("common.all") },
    { value: "receive", label: t("enums.ingredientTxnType.receive") },
    { value: "use", label: t("enums.ingredientTxnType.use") },
    { value: "adjust", label: t("enums.ingredientTxnType.adjust") },
  ];

  return (
    <ListPageLayout
      title={t("ingredientHistory.title")}
      description={t("ingredientHistory.description")}
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("ingredientHistory.searchPlaceholder")} />
              <div style={{ minWidth: 170 }}>
                <Select
                  value={vm.ingredientId}
                  onChange={(v) => vm.setIngredientId(v as string)}
                  options={[
                    { value: "all", label: t("ingredientHistory.allIngredients") },
                    ...vm.ingredients.map((i) => ({ value: i._id, label: i.ingredient_name })),
                  ]}
                />
              </div>
              <div style={{ minWidth: 140 }}>
                <Select
                  value={vm.typeFilter}
                  onChange={(v) => vm.setTypeFilter(v as VM["typeFilter"])}
                  options={typeOptions}
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
            <StatCard label={t("ingredientHistory.statTotal")} value={vm.stats.total} sub={t("ingredientHistory.statTotalSub")} />
            <StatCard label={t("enums.ingredientTxnType.receive")} value={vm.stats.receive} sub={t("ingredientHistory.statReceiveSub")} tone="up" />
            <StatCard label={t("enums.ingredientTxnType.use")} value={vm.stats.use} sub={t("ingredientHistory.statUseSub")} tone="muted" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("ingredientHistory.empty")}
          />
        </div>
      )}
    </ListPageLayout>
  );
}
