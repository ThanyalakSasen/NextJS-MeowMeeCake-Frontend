"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Coupons — CRUD คูปอง/ส่วนลด ผ่าน promotionsService (/admin/promotions จริง)
// โหลด products/product-categories แยกไว้ให้ตัวเลือก "ขอบเขตสินค้า/หมวดหมู่" ในฟอร์ม (ไม่ populate
// จาก backend — ดู types/promotion.ts)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { promotionsService } from "@/services/promotions";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { Promotion } from "@/types/promotion";
import type { CouponStatus, DiscountType } from "@/constants/enumConfig";
import { deriveCouponStatus, toInput, type CouponFormValue } from "./couponForm";

export interface CouponRow extends Promotion {
  status: CouponStatus;
}

type TabFilter = "all" | CouponStatus;
type TypeFilter = "all" | DiscountType;

export function useCouponsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("promotions");

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);

  const q = useQuery({ queryKey: ["promotions"], queryFn: () => promotionsService.list({ limit: 200 }) });
  const productsQ = useQuery({ queryKey: ["products", { limit: 200 }], queryFn: () => productsService.list({ limit: 200 }) });
  const categoriesQ = useQuery({ queryKey: ["product-categories"], queryFn: () => productCategoriesService.list() });

  const rows = useMemo<CouponRow[]>(
    () => (q.data?.data ?? []).map((p) => ({ ...p, status: deriveCouponStatus(p) })),
    [q.data],
  );

  const productOptions = useMemo(
    () => (productsQ.data?.data ?? []).map((p) => ({ value: p._id, label: p.product_name_th })),
    [productsQ.data],
  );
  const categoryOptions = useMemo(
    () => (categoriesQ.data?.data ?? []).map((c) => ({ value: c._id, label: c.product_category_name })),
    [categoriesQ.data],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      scheduled: rows.filter((r) => r.status === "scheduled").length,
      inactive: rows.filter((r) => r.status === "inactive").length,
      expired: rows.filter((r) => r.status === "expired").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchTab = tab === "all" || r.status === tab;
      const matchSearch = !kw || r.promotion_code.toLowerCase().includes(kw) || r.promotion_name.toLowerCase().includes(kw);
      const matchType = typeFilter === "all" || r.discount_type === typeFilter;
      return matchTab && matchSearch && matchType;
    });
  }, [rows, tab, search, typeFilter]);

  const totalUsed = useMemo(() => rows.reduce((s, r) => s + r.used_count, 0), [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["promotions"] });

  const save = useMutation({
    mutationFn: (v: CouponFormValue) =>
      editTarget ? promotionsService.update(editTarget._id, toInput(v)) : promotionsService.create(toInput(v)),
    onSuccess: () => {
      alert.success(editTarget ? t("coupons.updated") : t("coupons.created"));
      invalidate();
      setModalOpen(false);
      setEditTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("coupons.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => promotionsService.remove(id),
    onSuccess: () => {
      alert.success(t("coupons.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("coupons.deleteFailed")),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => promotionsService.update(id, { is_active }),
    onSuccess: invalidate,
    onError: () => alert.error(t("coupons.toggleFailed")),
  });

  return {
    perm,
    rows: filtered,
    counts,
    totalUsed,
    isLoading: q.isLoading || productsQ.isLoading || categoriesQ.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),

    productOptions,
    categoryOptions,

    tab, setTab,
    search, setSearch,
    typeFilter, setTypeFilter,

    modalOpen,
    editTarget,
    saving: save.isPending,
    openAdd: () => { setEditTarget(null); setModalOpen(true); },
    openEdit: (p: Promotion) => { setEditTarget(p); setModalOpen(true); },
    closeModal: () => { setModalOpen(false); setEditTarget(null); },
    onSubmit: (v: CouponFormValue) => save.mutate(v),
    onDelete: (id: string) => remove.mutate(id),
    onToggle: (r: CouponRow) => toggle.mutate({ id: r._id, is_active: !r.is_active }),
  };
}
