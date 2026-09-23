"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Product Stock — สต็อกสินค้าสำเร็จรูป (product_type "ready")
// ไม่มี resource ใหม่: ใช้ productsService (list + update stock) + map category/unit
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { StockStatus } from "@/constants/enumConfig";
import { getStockStatus } from "./stockStatus";
import { refId } from "@/lib/refId";
import { isApiError } from "@/types/api";

export interface StockProductRow {
  _id: string;
  name: string;
  categoryId: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  status: StockStatus;
  value: number;
}

export type StatusFilter = "all" | StockStatus;

// backend ไม่มี product_type "ready" (จริง ๆ คือ "inStore"/"online") และ query filter ใช้ค่าเดียวไม่ได้
// สองค่าพร้อมกัน — โหลดทั้งหมดมาแล้วตัด "preorder" ออกฝั่ง client แทน (พรีออเดอร์ไม่มีสต็อกให้ปรับที่นี่)
const ALL_PARAMS = { limit: 200 } as const;

export function useProductStockViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("stock");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [adjustTarget, setAdjustTarget] = useState<StockProductRow | null>(null);

  const productsQ = useQuery({
    queryKey: ["products", ALL_PARAMS],
    queryFn: () => productsService.list(ALL_PARAMS),
  });
  const categoriesQ = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.list(),
  });
  const unitsQ = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsService.list(),
  });

  const rows = useMemo<StockProductRow[]>(() => {
    const catMap = new Map((categoriesQ.data?.data ?? []).map((c) => [c._id, c.product_category_name]));
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    return (productsQ.data?.data ?? [])
      .filter((p) => p.product_type !== "preorder")
      .map((p) => {
        const stock = p.product_stock_quantity ?? 0;
        const categoryId = refId(p.category_id);
        const unitId = refId(p.unit_id);
        return {
          _id: p._id,
          name: p.product_name_th,
          categoryId,
          category: (categoryId && catMap.get(categoryId)) || "",
          unit: (unitId && unitMap.get(unitId)) || t("productStock.unitDefault"),
          price: p.product_price,
          stock,
          status: getStockStatus(stock),
          value: stock * p.product_price,
        };
      });
  }, [productsQ.data, categoriesQ.data, unitsQ.data, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q);
      const matchCategory = categoryId === "all" || r.categoryId === categoryId;
      const matchStatus = status === "all" || r.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [rows, search, categoryId, status]);

  const stats = useMemo(
    () => ({
      tracked: rows.length,
      low: rows.filter((r) => r.status === "low").length,
      out: rows.filter((r) => r.status === "out").length,
      totalValue: rows.reduce((s, r) => s + r.value, 0),
    }),
    [rows],
  );

  const adjust = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      productsService.update(id, { product_stock_quantity: qty }),
    onSuccess: () => {
      alert.success(t("productStock.adjusted"));
      qc.invalidateQueries({ queryKey: ["products"] });
      setAdjustTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("productStock.adjustFailed")),
  });

  return {
    perm,
    rows: filtered,
    stats,
    categories: categoriesQ.data?.data ?? [],
    isLoading: productsQ.isLoading || categoriesQ.isLoading || unitsQ.isLoading,
    isError: productsQ.isError,
    refetch: () => productsQ.refetch(),

    search, setSearch,
    categoryId, setCategoryId,
    status, setStatus,

    adjustTarget,
    openAdjust: (r: StockProductRow) => setAdjustTarget(r),
    closeAdjust: () => setAdjustTarget(null),
    onSaveAdjust: (id: string, qty: number) => adjust.mutate({ id, qty }),
    saving: adjust.isPending,
  };
}
