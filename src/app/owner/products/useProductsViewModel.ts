"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Products List — state, query, mutation, permission
// (reference: หน้ารายการอื่น copy โครงนี้)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { Product, ProductType } from "@/types/product";

type TypeFilter = "all" | ProductType;

export type SortValue = "-created_at" | "product_price" | "-product_price" | "-avg_rating";

export function useProductsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("products");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortValue>("-created_at");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      category_id: categoryId ?? undefined,
      product_type: type === "all" ? undefined : type,
      sort,
      page,
      limit: pageSize,
    }),
    [search, categoryId, type, sort, page, pageSize],
  );

  const productsQ = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.list(params),
  });

  const categoriesQ = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  const toggleVisible = useMutation({
    mutationFn: (p: Product) => productsService.update(p._id, { is_visible: !p.is_visible }),
    onSuccess: () => {
      alert.success(t("products.saved"));
      invalidate();
    },
    onError: () => alert.error(t("products.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      alert.success(t("products.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("products.deleteFailed")),
  });

  return {
    perm,
    products: productsQ.data?.data ?? [],
    total: productsQ.data?.meta.total ?? 0,
    isLoading: productsQ.isLoading,
    isError: productsQ.isError,
    refetch: () => productsQ.refetch(),
    categories: categoriesQ.data?.data ?? [],

    // filters
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    categoryId, setCategoryId: (v: string | null) => { setCategoryId(v); setPage(1); },
    type, setType: (v: TypeFilter) => { setType(v); setPage(1); },
    sort, setSort: (v: SortValue) => { setSort(v); setPage(1); },
    page, pageSize,
    setPagination: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
    viewMode, setViewMode,

    // actions
    onToggleVisible: (p: Product) => toggleVisible.mutate(p),
    onDelete: (id: string) => remove.mutate(id),
  };
}
