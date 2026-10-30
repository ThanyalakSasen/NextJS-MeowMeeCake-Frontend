"use client";
// View ของ Ingredients List — JSX ล้วน รับ props จาก useIngredientsViewModel
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { Button, ProgressBar, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { ConfirmDeletePopup, LoadFailed } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, StatusFilterSelect, type Column, useStockStatusOptions, FilterField } from "@/components/shared/data";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import { DeleteButton, EditButton, actionIcon } from "@/components/shared/actions";
import { CategoryManagerButton } from "@/components/shared/categories";
import type { IngredientRow, useIngredientsViewModel } from "./useIngredientsViewModel";
import { sortOptionsThai } from "@/lib/thaiSort";
import { RestoreDeletedButton } from "@/components/shared/restore";

// ฟอร์ม/โมดัลแยก chunk — โหลดเมื่อเปิดครั้งแรก ไม่ต้อง parse/รันตอนเปิดหน้า (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const IngredientFormModal = dynamic(() => import("./_components/IngredientFormModal").then((m) => m.IngredientFormModal), { ssr: false });

type VM = ReturnType<typeof useIngredientsViewModel>;

export function IngredientsView(vm: VM) {
  const t = useTranslations();
  const formUsed = useOpenedOnce(vm.formOpen);
  const locale = useLocale();

  const columns: Column<IngredientRow>[] = [
    {
      key: "name",
      title: t("ingredients.colName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
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
          <ProgressBar percent={r.pct} color={STOCK_STATUS_CONFIG[r.status].dotColor} />
        </div>
      ),
    },
    {
      key: "reorder",
      title: t("ingredients.colReorder"),
      render: (r) => `${formatNumber(r.reorderPoint, locale)} ${r.unitAbbr}`,
    },
    {
      key: "cost",
      title: t("ingredients.colCost"),
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

  return (
    <ListPageLayout
      title={t("ingredients.title")}
      actions={
        <div className="flex flex-wrap gap-2">
          <CategoryManagerButton kind="ingredient" />
          <RestoreDeletedButton menu="ingredients" resources={["ingredients", "ingredientCategories"]} />
          {vm.perm.create && (
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openAdd}>
              {t("ingredients.addIngredient")}
            </Button>
          )}
        </div>
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
            </>
          }
          // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
          right={
            <>
              <FilterField label={t("filterLabel.ingredientCategory")} minWidth={170}>
                <Select
                  value={vm.categoryId}
                  onChange={(v) => vm.setCategoryId(v as string)}
                  options={[
                    { value: "all", label: t("common.all") },
                    ...sortOptionsThai(vm.categories.map((c) => ({ value: c._id, label: c.ingredient_category_name }))),
                  ]}
                />
              </FilterField>
              <StatusFilterSelect label={t("filterLabel.stockStatus")} value={vm.status} onChange={vm.setStatus} options={useStockStatusOptions()} />
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
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
                        <EditButton size="small" onClick={() => vm.openEdit(r)} />
                      )}
                      {vm.perm.delete && (
                        <ConfirmDeletePopup
                          title={t("ingredients.deleteConfirm", { name: r.name })}
                          onConfirm={() => vm.onDelete(r._id)}
                        >
                          <DeleteButton size="small" />
                        </ConfirmDeletePopup>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        </div>
      )}

      {formUsed && (
        <IngredientFormModal
          open={vm.formOpen}
          editTarget={vm.editTarget}
          categories={vm.categories}
          units={vm.ingredientUnits}
          saving={vm.saving}
          onClose={vm.closeForm}
          onSave={vm.onSave}
        />
      )}
    </ListPageLayout>
  );
}
