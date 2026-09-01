"use client";
// View ของ Ingredients List — JSX ล้วน รับ props จาก useIngredientsViewModel
import { Progress } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import type { IngredientRow, useIngredientsViewModel } from "./useIngredientsViewModel";
import { IngredientFormModal } from "./_components/IngredientFormModal";

type VM = ReturnType<typeof useIngredientsViewModel>;

export function IngredientsView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<IngredientRow>[] = [
    {
      key: "name",
      title: t("ingredients.colName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
          <p className="text-sm text-gray-600">{r.sku}</p>
        </div>
      ),
    },
    { key: "category", title: t("ingredients.colCategory"), render: (r) => r.category || "—" },
    {
      key: "stock",
      title: t("ingredients.colStock"),
      render: (r) => (
        <div className="min-w-[130px]">
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
      title: t("ingredients.colReorder"),
      align: "right",
      render: (r) => `${formatNumber(r.reorderPoint, locale)} ${r.unitAbbr}`,
    },
    {
      key: "cost",
      title: t("ingredients.colCost"),
      align: "right",
      render: (r) => formatCurrency(r.costPerUnit, locale, { decimals: 2 }),
    },
    { key: "supplier", title: t("ingredients.colSupplier"), render: (r) => r.supplier || "—" },
    {
      key: "updated",
      title: t("ingredients.colUpdated"),
      render: (r) => formatDate(r.updatedAt, locale),
    },
    {
      key: "status",
      title: t("ingredients.colStatus"),
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
      title={t("ingredients.title")}
      description={t("ingredients.description")}
      actions={
        vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAdd}>
            {t("ingredients.addIngredient")}
          </Button>
        )
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput
                value={vm.search}
                onChange={vm.setSearch}
                placeholder={t("ingredients.searchPlaceholder")}
              />
              <div style={{ minWidth: 170 }}>
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
            <StatCard label={t("ingredients.statTotal")} value={vm.stats.total} sub={t("ingredients.statTotalSub")} />
            <StatCard label={t("enums.stockStatus.ok")} value={vm.stats.ok} sub={t("ingredients.statOkSub")} tone="up" />
            <StatCard label={t("enums.stockStatus.low")} value={vm.stats.low} sub={t("ingredients.statLowSub")} tone="warn" />
            <StatCard label={t("enums.stockStatus.out")} value={vm.stats.out} sub={t("ingredients.statOutSub")} tone="down" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("ingredients.empty")}
            actions={
              vm.perm.update || vm.perm.delete
                ? (r) => (
                    <div className="flex justify-end gap-2">
                      {vm.perm.update && (
                        <Button size="small" onClick={() => vm.openEdit(r)}>
                          {t("common.edit")}
                        </Button>
                      )}
                      {vm.perm.delete && (
                        <ConfirmDeletePopup
                          title={t("ingredients.deleteConfirm", { name: r.name })}
                          onConfirm={() => vm.onDelete(r._id)}
                        >
                          <Button size="small" danger>
                            {t("common.delete")}
                          </Button>
                        </ConfirmDeletePopup>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        </div>
      )}

      <IngredientFormModal
        open={vm.formOpen}
        editTarget={vm.editTarget}
        categories={vm.categories}
        units={vm.ingredientUnits}
        saving={vm.saving}
        onClose={vm.closeForm}
        onSave={vm.onSave}
      />
    </ListPageLayout>
  );
}
