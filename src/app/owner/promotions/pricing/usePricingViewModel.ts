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
  /** บันทึกไม่ได้: ราคาปกติ ≤ 0 หรือราคาลดไม่น้อยกว่าราคาปกติ (กฎเดียวกับฟอร์มสินค้า) */
  isInvalid: boolean;
}

type DiscFilter = "all" | "has" | "none";
type TypeFilter = "all" | ProductKind;
type DraftPatch = Partial<Pick<PricingRow, "basePrice" | "salePrice" | "isVisible">> & {
  /** % ส่วนลดที่ตั้งไว้ (ช่องส่วนลด / ช่องราคาลด / ค่าที่บันทึกไว้เดิม) — แก้ราคาปกติแล้วคิดราคาลดใหม่จากค่านี้
   *  ไม่ใช่จาก % ของแถวตอนนี้: ช่องราคาส่งค่าทุกครั้งที่กดแป้น ค่าระหว่างพิมพ์ (เช่น "2" ของ "200") ทำให้ % เพี้ยน
   *  แล้วติดไปถึงค่าสุดท้าย (150/120 พิมพ์ใหม่เป็น 200 เคยได้ราคาลด 0 หรือ 20 บาท) · null = ไม่มีส่วนลด */
  percent?: number | null;
};

/** ราคาปกติต้อง > 0 · ราคาลดว่างได้ แต่ถ้ามีต้องมากกว่า 0 และน้อยกว่าราคาปกติ (ProductFormFields saleRule)
 *  — ราคาลด 0 (ลด 100%) = ขายฟรี backend ยอม จึงกันไว้ที่นี่ */
const isValidPrice = (base: number, sale: number | null) => base > 0 && (sale === null || (sale > 0 && sale < base));

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
        isInvalid: !isValidPrice(basePrice, salePrice),
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

  /** % ส่วนลดที่ใช้คิดราคาลดใหม่ตอนแก้ราคาปกติ — ที่ตั้งไว้ใน draft ก่อน ไม่งั้น % จากราคาที่บันทึกไว้ */
  const anchorPercent = (id: string): number | null => {
    const draft = drafts[id];
    if (draft && "percent" in draft) return draft.percent ?? null;
    const p = productsQ.data?.data.find((x) => x._id === id);
    return p ? discountFromSalePrice(p.product_price, p.sale_price ?? null) : null;
  };

  const onChangeBasePrice = (row: PricingRow, value: number | null) => {
    const basePrice = value ?? 0;
    // มีส่วนลดตั้งไว้อยู่แล้ว → คำนวณราคาลดใหม่ตามส่วนลดเดิม กันราคาลดค้างผิดตามราคาปกติใหม่
    const percent = anchorPercent(row._id);
    const salePrice = percent != null ? calcSalePrice(basePrice, percent) : row.salePrice;
    setDraft(row._id, { basePrice, salePrice, percent });
  };

  const onChangeSalePrice = (row: PricingRow, value: number | null) =>
    setDraft(row._id, { salePrice: value, percent: discountFromSalePrice(row.basePrice, value) });

  const onChangeDiscount = (row: PricingRow, percent: number | null) =>
    setDraft(row._id, { salePrice: percent != null ? calcSalePrice(row.basePrice, percent) : null, percent });

  const onToggleVisible = (row: PricingRow) => setDraft(row._id, { isVisible: !row.isVisible });

  const invalidDirty = rows.filter((r) => r.isDirty && r.isInvalid);

  // ยิงทีละสินค้า (ไม่มี bulk) — บางแถวพลาดได้: ล้าง draft เฉพาะแถวที่บันทึกแล้ว แถวที่พลาดค้างไว้ให้กดใหม่
  // (เดิม Promise.all พลาดแถวเดียว = ไม่ล้าง draft เลย + ไม่โหลดใหม่ ทั้งที่แถวอื่นบันทึกไปแล้ว)
  const saveAll = useMutation({
    mutationFn: async () => {
      const ids = Object.keys(drafts);
      const results = await Promise.allSettled(
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
      const saved = ids.filter((_, i) => results[i].status === "fulfilled");
      const failed = ids.flatMap((id, i) => {
        const r = results[i];
        return r.status === "rejected" ? [{ id, reason: r.reason as unknown }] : [];
      });
      return { saved, failed };
    },
    onSuccess: ({ saved, failed }) => {
      setDrafts((prev) => {
        const next = { ...prev };
        for (const id of saved) delete next[id];
        return next;
      });
      if (saved.length > 0) {
        qc.invalidateQueries({ queryKey: ["products"] });
        alert.success(t("pricing.saved", { n: saved.length }));
      }
      if (failed.length > 0) {
        const names = failed.map((f) => rows.find((r) => r._id === f.id)?.name ?? f.id).join(", ");
        const first = failed[0].reason;
        alert.error(t("pricing.someFailed", { names, reason: isApiError(first) ? first.message : t("pricing.saveFailed") }));
      }
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
    onSaveAll: () => {
      if (invalidDirty.length > 0) {
        alert.warning(t("pricing.invalidRows", { names: invalidDirty.map((r) => r.name).join(", ") }));
        return;
      }
      saveAll.mutate();
    },
  };
}
