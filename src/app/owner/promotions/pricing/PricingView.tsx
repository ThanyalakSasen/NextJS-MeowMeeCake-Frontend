"use client";
// View ของ Pricing — ตารางแก้ราคา/ราคาลด/แสดงผลของสินค้าแบบ inline ทีละแถว
import { useTranslations, useLocale } from "next-intl";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import { Button, Select, Switch, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency } from "@/i18n/format";
import type { PricingRow, usePricingViewModel } from "./usePricingViewModel";
import { tagColorFor } from "./pricingHelpers";
import { PriceCell } from "./_components/PriceCell";
import { DiscountCell } from "./_components/DiscountCell";

type VM = ReturnType<typeof usePricingViewModel>;

export function PricingView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<PricingRow>[] = [
    {
      key: "name",
      title: t("pricing.colProduct"),
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-brown-800">{r.name}</p>
          {r.isDirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" title={t("pricing.dirtyHint")} />}
        </div>
      ),
    },
    {
      key: "category",
      title: t("pricing.colCategory"),
      render: (r) => <Tag color={tagColorFor(r.categoryId)}>{r.categoryName}</Tag>,
    },
    {
      key: "product_type",
      title: t("pricing.colType"),
      render: (r) => <Tag color={r.productType === "preorder" ? "processing" : "success"}>{t(`enums.productType.${r.productType}`)}</Tag>,
    },
    {
      key: "basePrice",
      title: t("pricing.colBasePrice"),
      render: (r) => <PriceCell value={r.basePrice} onChange={(v) => vm.onChangeBasePrice(r, v)} highlight={r.isDirty} />,
    },
    {
      key: "salePrice",
      title: t("pricing.colSalePrice"),
      render: (r) => <PriceCell value={r.salePrice} onChange={(v) => vm.onChangeSalePrice(r, v)} highlight={r.isDirty && r.salePrice !== null} />,
    },
    {
      key: "discount",
      title: t("pricing.colDiscount"),
      render: (r) => <DiscountCell discount={r.discount} highlight={r.isDirty && r.discount !== null} onChange={(d) => vm.onChangeDiscount(r, d)} />,
    },
    {
      key: "is_visible",
      title: t("pricing.colVisible"),
      align: "center",
      render: (r) => <Switch size="small" checked={r.isVisible} onChange={() => vm.onToggleVisible(r)} />,
    },
  ];

  return (
    <ListPageLayout
      title={t("pricing.title")}
      description={t("pricing.description")}
      actions={
        vm.perm.update && (
          <Button
            type="primary"
            icon={<CurrencyDollarIcon className="h-4 w-4" />}
            disabled={vm.dirtyCount === 0}
            loading={vm.saving}
            onClick={vm.onSaveAll}
          >
            {vm.dirtyCount > 0 ? t("pricing.saveAllCount", { n: vm.dirtyCount }) : t("pricing.saveAll")}
          </Button>
        )
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("pricing.searchPlaceholder")} />
              <div style={{ minWidth: 160 }}>
                <Select
                  value={vm.categoryId}
                  onChange={(v) => vm.setCategoryId(v as string)}
                  options={[{ value: "all", label: t("pricing.allCategories") }, ...vm.categories]}
                />
              </div>
              <div style={{ minWidth: 140 }}>
                <Select
                  value={vm.typeFilter}
                  onChange={(v) => vm.setTypeFilter(v as VM["typeFilter"])}
                  options={[
                    { value: "all", label: t("common.all") },
                    { value: "inStore", label: t("enums.productType.inStore") },
                    { value: "online", label: t("enums.productType.online") },
                    { value: "preorder", label: t("enums.productType.preorder") },
                  ]}
                />
              </div>
              <div style={{ minWidth: 150 }}>
                <Select
                  value={vm.discFilter}
                  onChange={(v) => vm.setDiscFilter(v as VM["discFilter"])}
                  options={[
                    { value: "all", label: t("pricing.allDiscountStatus") },
                    { value: "has", label: t("pricing.hasDiscount") },
                    { value: "none", label: t("pricing.noDiscount") },
                  ]}
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
            <StatCard label={t("pricing.statTotal")} value={vm.stats.total} sub={t("pricing.statTotalSub")} />
            <StatCard label={t("pricing.statWithDiscount")} value={vm.stats.withDiscount} sub={t("pricing.statTotalSub")} tone="up" />
            <StatCard label={t("pricing.statAvgPrice")} value={formatCurrency(vm.stats.avgPrice, locale)} sub={t("pricing.statAvgPriceSub")} />
            <StatCard
              label={t("pricing.statTopPrice")}
              value={vm.stats.top ? formatCurrency(vm.stats.top.basePrice, locale) : "—"}
              sub={vm.stats.top?.name ?? ""}
            />
          </StatCardsGrid>

          <DataTable columns={columns} rows={vm.rows} loading={vm.isLoading} emptyText={t("pricing.empty")} />
        </div>
      )}
    </ListPageLayout>
  );
}
