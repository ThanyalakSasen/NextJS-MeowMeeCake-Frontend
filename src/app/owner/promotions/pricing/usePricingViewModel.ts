"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Pricing — แก้ราคา/ราคาลด/แสดงผลของสินค้าแบบตาราง แก้ทีละแถวแล้วกด "บันทึกทั้งหมด"
// ทีเดียว (เหมือน Ingredient Stock #11) ยิงผ่าน productsService.update() (PATCH /admin/products/[id])
// ตรง ๆ — ไม่มี backend resource "แคมเปญส่วนลด" แยก (ดู pricingHelpers.ts)
//
// สิทธิ์เช็คจาก "pricing" (เมนูย่อยของหน้านี้เอง) ไม่ใช่ "promotions" — PATCH /admin/products/[id]
// ฝั่ง backend รับ products.update หรือ pricing.update อย่างใดอย่างหนึ่ง
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { refId } from "@/lib/refId";
import { productKindOf, type ProductKind } from "@/types/product";
import { isApiError } from "@/types/api";
import { calcSalePrice, discountFromSalePrice } from "./pricingHelpers";
import { PRICING_CATEGORIES_KEY, PRICING_PRODUCTS_KEY, PRICING_PRODUCTS_PARAMS } from "./pricingQuery";
import { sortOptionsThai } from "@/lib/thaiSort";

export interface PricingRow {
  _id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  productType: ProductKind;
  basePrice: number;
  salePrice: number | null;
  /** ส่วนลดเปอร์เซ็นต์ที่คิดจากราคาปกติ/ราคาลด · null = ไม่มีส่วนลด */
  discount: number | null;
  isVisible: boolean;
  isDirty: boolean;
}

type DiscFilter = "all" | "has" | "none";
type TypeFilter = "all" | ProductKind;
type DraftPatch = Partial<Pick<PricingRow, "basePrice" | "salePrice" | "isVisible">>;

export function usePricingViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("pricing");

  const productsQ = useQuery({ queryKey: PRICING_PRODUCTS_KEY, queryFn: () => productsService.list(PRICING_PRODUCTS_PARAMS) });
  const catsQ = useQuery({ queryKey: PRICING_CATEGORIES_KEY, queryFn: () => productCategoriesService.list() });

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [discFilter, setDiscFilter] = useState<DiscFilter>("all");
  // ค่าที่แก้ในตารางแต่ยังไม่กด "บันทึกทั้งหมด" — key = product _id (มี key = แถวนั้น dirty)
  const [drafts, setDrafts] = useState<Record<string, DraftPatch>>({});

  const rows: PricingRow[] = useMemo(() => {
    return (productsQ.data?.data ?? []).map((p) => {
      const draft = drafts[p._id];
      const basePrice = draft?.basePrice ?? p.product_price;
      const salePrice = draft && "salePrice" in draft ? draft.salePrice! : (p.sale_price ?? null);
      const isVisible = draft?.isVisible ?? p.is_visible;
      const categoryObj = typeof p.category_id === "object" ? p.category_id : undefined;
      return {
        _id: p._id,
        name: p.product_name_th,
        categoryId: refId(p.category_id),
        categoryName: categoryObj?.product_category_name ?? t("pricing.noCategory"),
        productType: productKindOf(p),
        basePrice,
        salePrice,
        discount: discountFromSalePrice(basePrice, salePrice),
        isVisible,
        isDirty: !!draft,
      };
    });
  }, [productsQ.data, drafts, t]);

  const categories = useMemo(
    () => sortOptionsThai((catsQ.data?.data ?? []).map((c) => ({ value: c._id, label: c.product_category_name }))),
    [catsQ.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryId !== "all" && r.categoryId !== categoryId) return false;
      if (typeFilter !== "all" && r.productType !== typeFilter) return false;
      if (discFilter === "has" && !r.discount) return false;
      if (discFilter === "none" && r.discount) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, categoryId, typeFilter, discFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const withDiscount = rows.filter((r) => r.discount).length;
    const avgPrice = total > 0 ? Math.round(rows.reduce((s, r) => s + r.basePrice, 0) / total) : 0;
    const top = rows.reduce<PricingRow | null>((max, r) => (!max || r.basePrice > max.basePrice ? r : max), null);
    return { total, withDiscount, avgPrice, top };
  }, [rows]);

  const dirtyCount = Object.keys(drafts).length;

  const setDraft = (id: string, patch: DraftPatch) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const onChangeBasePrice = (row: PricingRow, value: number | null) => {
    const basePrice = value ?? 0;
    // มีส่วนลดตั้งไว้อยู่แล้ว → คำนวณราคาลดใหม่ตามส่วนลดเดิม กันราคาลดค้างผิดตามราคาปกติใหม่
    const salePrice = row.discount != null ? calcSalePrice(basePrice, row.discount) : row.salePrice;
    setDraft(row._id, { basePrice, salePrice });
  };

  const onChangeSalePrice = (row: PricingRow, value: number | null) => setDraft(row._id, { salePrice: value });

  const onChangeDiscount = (row: PricingRow, percent: number | null) =>
    setDraft(row._id, { salePrice: percent != null ? calcSalePrice(row.basePrice, percent) : null });

  const onToggleVisible = (row: PricingRow) => setDraft(row._id, { isVisible: !row.isVisible });

  const saveAll = useMutation({
    mutationFn: async () => {
      const ids = Object.keys(drafts);
      await Promise.all(
        ids.map((id) => {
          const row = rows.find((r) => r._id === id);
          if (!row) return Promise.resolve();
          return productsService.update(id, {
            product_price: row.basePrice,
            sale_price: row.salePrice,
            is_visible: row.isVisible,
          });
        }),
      );
    },
    onSuccess: () => {
      alert.success(t("pricing.saved", { n: dirtyCount }));
      setDrafts({});
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pricing.saveFailed")),
  });

  return {
    perm,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: productsQ.isPending || catsQ.isPending,
    isError: productsQ.isError,
    refetch: () => productsQ.refetch(),

    rows: filtered,
    categories,
    stats,
    dirtyCount,
    saving: saveAll.isPending,

    search, setSearch,
    categoryId, setCategoryId,
    typeFilter, setTypeFilter,
    discFilter, setDiscFilter,

    onChangeBasePrice,
    onChangeSalePrice,
    onChangeDiscount,
    onToggleVisible,
    onSaveAll: () => saveAll.mutate(),
  };
}
