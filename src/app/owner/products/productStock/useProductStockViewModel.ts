"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Product Stock — สต็อกสินค้าปกติ (is_preorder: false)
// รายการจาก GET /admin/products/stock-list (stock.view — Final-Backlog P12) · ชื่อหมวด/หน่วยมากับรายการ (populate)
// ปรับยอดผ่าน PUT /admin/products/:id/stock (stock.update)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { StockStatus } from "@/constants/enumConfig";
import { getStockStatus } from "./stockStatus";
import { refId } from "@/lib/refId";
import { unitLabel } from "@/utils/unitContext";
import { isApiError } from "@/types/api";
import { LIST_ALL } from "@/lib/http";

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

// backend ส่งเฉพาะสินค้าปกติ (ไม่ใช่พรีออเดอร์ · ไม่ถูกลบ) อยู่แล้ว
const STOCK_PARAMS = { limit: LIST_ALL } as const;

export function useProductStockViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("stock");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [adjustTarget, setAdjustTarget] = useState<StockProductRow | null>(null);

  const productsQ = useQuery({
    queryKey: ["products", "stock-list", STOCK_PARAMS],
    queryFn: () => productsService.stockList(STOCK_PARAMS),
  });

  // ตัวกรองหมวด = หมวดที่มีสินค้าในหน้านี้ (จาก category_id ที่ populate มา) — ไม่เรียก /admin/product-categories (products.view)
  const categories = useMemo(() => {
    const byId = new Map<string, { _id: string; product_category_name: string }>();
    for (const p of productsQ.data?.data ?? []) {
      const c = p.category_id;
      if (c && typeof c === "object") byId.set(c._id, { _id: c._id, product_category_name: c.product_category_name });
    }
    return [...byId.values()];
  }, [productsQ.data]);

  const rows = useMemo<StockProductRow[]>(() => {
    return (productsQ.data?.data ?? [])
      .filter((p) => !p.is_preorder) // กันซ้ำเผื่อ backend รุ่นเก่าที่ยังไม่รู้จัก ?is_preorder=
      .map((p) => {
        const stock = p.product_stock_quantity ?? 0;
        const categoryId = refId(p.category_id);
        return {
          _id: p._id,
          name: p.product_name_th,
          categoryId,
          category: typeof p.category_id === "object" && p.category_id ? p.category_id.product_category_name : "",
          unit: unitLabel(p.unit_id) || t("productStock.unitDefault"),
          price: p.product_price,
          stock,
          status: getStockStatus(stock),
          value: stock * p.product_price,
        };
      });
  }, [productsQ.data, t]);

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

  // ตั้งสต็อกเป็นค่าที่นับได้ผ่าน endpoint สต็อกโดยเฉพาะ (BACKLOG2 §15.2 ข้อ 5) — เดิมใช้ PATCH สินค้าทั่วไป
  // ซึ่งไม่แจ้งเตือนสินค้าใกล้หมด · ข้ามกติกาสินค้ามีตัวเลือก · เช็คสิทธิ์ products แทน stock · และ backend จะเลิกรับ
  const adjust = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => productsService.setStock(id, qty),
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
    categories,
    isLoading: productsQ.isLoading,
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
