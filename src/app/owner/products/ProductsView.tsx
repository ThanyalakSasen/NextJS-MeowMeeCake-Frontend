"use client";
// View ของ Products List — JSX ล้วน รับ props จาก useProductsViewModel
// i18n: ใช้ t ตัวเดียว, key = path เต็มใน messages json (t("products.title"), t("common.all"))
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, EmptyState, Switch } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import {
  DataTable, FilterToolbar, SearchInput, SortDropdown, TypeTabBar, ViewToggle,
  type Column,
} from "@/components/shared/data";
import { formatCurrency } from "@/i18n/format";
import { productKindOf, type Product } from "@/types/product";
import { EditButton, DeleteButton, RetryButton } from "@/components/shared/actions";
import { CategoryManagerButton } from "@/components/shared/categories";
import type { useProductsViewModel } from "./useProductsViewModel";
import { ProductGrid } from "./_components/ProductGrid";
import { CategoryChip } from "./_components/CategoryChip";
import { RatingDisplay } from "./_components/RatingDisplay";

type VM = ReturnType<typeof useProductsViewModel>;

export function ProductsView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<Product>[] = [
    { key: "product_name_th", title: t("products.colName") },
    { key: "is_preorder", title: t("products.colType"), render: (p) => t(`enums.productType.${productKindOf(p)}`) },
    {
      key: "product_price", title: t("products.colPrice"), align: "right",
      render: (p) => formatCurrency(p.sale_price ?? p.product_price, locale),
    },
    { key: "product_stock_quantity", title: t("products.colStock"), align: "right", render: (p) => p.product_stock_quantity ?? "—" },
    { key: "avg_rating", title: t("products.colRating"), render: (p) => <RatingDisplay rating={p.avg_rating} count={p.review_count} /> },
    {
      key: "is_visible", title: t("products.colVisible"), align: "center",
      render: (p) => (
        <Switch size="small" checked={p.is_visible} disabled={!vm.perm.update}
          onChange={() => vm.onToggleVisible(p)} />
      ),
    },
  ];

  const sortOptions = [
    { value: "-created_at", label: t("products.sortNewest") },
    { value: "product_price", label: t("products.sortPriceAsc") },
    { value: "-product_price", label: t("products.sortPriceDesc") },
    { value: "-avg_rating", label: t("products.sortRating") },
  ];

  return (
    <ListPageLayout
      title={t("products.title")}
      description={t("products.description")}
      actions={
        <div className="flex flex-wrap gap-2">
          <CategoryManagerButton kind="product" />
          {vm.perm.create && (
            <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} href="/owner/products/addProducts">
              {t("products.addProduct")}
            </Button>
          )}
        </div>
      }
      toolbar={
        <div className="flex flex-col gap-3">
          <FilterToolbar
            left={
              <>
                <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("products.searchPlaceholder")} />
                <TypeTabBar
                  value={vm.type}
                  onChange={vm.setType}
                  options={[
                    { value: "all", label: t("common.all") },
                    { value: "normal", label: t("enums.productType.normal") },
                    { value: "preorder", label: t("enums.productType.preorder") },
                  ]}
                />
              </>
            }
            right={
              <>
                <SortDropdown value={vm.sort} onChange={(v) => vm.setSort(v as VM["sort"])} options={sortOptions} />
                <ViewToggle value={vm.viewMode} onChange={vm.setViewMode} />
              </>
            }
          />
          <div className="flex flex-wrap gap-2">
            <CategoryChip label={t("common.all")} active={!vm.categoryId} onClick={() => vm.setCategoryId(null)} />
            {[...vm.categories]
              .sort((a, b) => a.product_category_name.localeCompare(b.product_category_name, locale))
              .map((c) => (
              <CategoryChip
                key={c._id}
                label={c.product_category_name}
                active={vm.categoryId === c._id}
                onClick={() => vm.setCategoryId(c._id)}
              />
              ))}
          </div>
        </div>
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-500">{t("common.loadFailed")}</p>
          <RetryButton onClick={() => vm.refetch()} />
        </div>
      ) : vm.viewMode === "grid" ? (
        vm.isLoading ? (
          <DataTable columns={[]} rows={[]} loading />
        ) : vm.products.length === 0 ? (
          <EmptyState description={t("common.noData")} />
        ) : (
          <ProductGrid
            products={vm.products}
            canUpdate={vm.perm.update}
            canDelete={vm.perm.delete}
            onToggleVisible={vm.onToggleVisible}
            onDelete={vm.onDelete}
          />
        )
      ) : (
        <DataTable
          columns={columns}
          rows={vm.products}
          loading={vm.isLoading}
          actions={
            vm.perm.update || vm.perm.delete
              ? (p) => (
                  <>
                    {vm.perm.update && (
                      <EditButton size="small" href={`/owner/products/${p._id}/edit`} />
                    )}
                    {/* ถามยืนยันก่อนลบ เหมือนมุมมองกริด (ProductCard) — เดิมกดแล้วลบทันที */}
                    {vm.perm.delete && (
                      <ConfirmDeletePopup onConfirm={() => vm.onDelete(p._id)}>
                        <DeleteButton size="small" />
                      </ConfirmDeletePopup>
                    )}
                  </>
                )
              : undefined
          }
          pagination={{
            page: vm.page,
            pageSize: vm.pageSize,
            total: vm.total,
            onChange: vm.setPagination,
          }}
        />
      )}
    </ListPageLayout>
  );
}
