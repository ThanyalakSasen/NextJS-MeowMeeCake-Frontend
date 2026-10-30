"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredients List — โหลด ingredients + categories + units ครั้งเดียว
// filter/count ฝั่ง client (แพทเทิร์นเดียวกับ Product Stock) · create/update/delete ผ่าน modal
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { INGREDIENTS_KEY, INGREDIENTS_PARAMS, INGREDIENT_CATEGORIES_KEY, UNITS_KEY } from "./ingredientsQuery";
import { useTranslations } from "next-intl";
import { ingredientsService } from "@/services/ingredients";
import { ingredientCategoriesService } from "@/services/ingredientCategories";
import { unitsService } from "@/services/units";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { unitLabel } from "@/utils/unitContext";
import type { StockStatus } from "@/constants/enumConfig";
import type { IngredientInput } from "@/types/ingredient";
import { getIngredientStatus, stockPercent } from "./ingredientStatus";
import { refId } from "@/lib/refId";
import { isApiError } from "@/types/api";

export interface IngredientRow {
  _id: string;
  name: string;
  categoryId: string;
  category: string;
  unitId: string;
  unitAbbr: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number | null;
  costPerUnit: number;
  supplier: string;
  updatedAt: string;
  status: StockStatus;
  pct: number;
}

type StatusFilter = "all" | StockStatus;


export function useIngredientsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("ingredients");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IngredientRow | null>(null);

  const ingredientsQ = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => ingredientsService.list(INGREDIENTS_PARAMS),
  });
  const categoriesQ = useQuery({
    queryKey: INGREDIENT_CATEGORIES_KEY,
    queryFn: () => ingredientCategoriesService.list(),
  });
  const unitsQ = useQuery({
    queryKey: UNITS_KEY,
    queryFn: () => unitsService.list(),
  });

  const categories = categoriesQ.data?.data ?? [];
  /** รายการหน่วยนับทั้งหมด — ให้ IngredientFormModal กรอง/ล็อกตามหมวดหมู่วัตถุดิบ */
  const ingredientUnits = useMemo(
    () => unitsQ.data?.data ?? [],
    [unitsQ.data],
  );

  const rows = useMemo<IngredientRow[]>(() => {
    const catMap = new Map((categoriesQ.data?.data ?? []).map((c) => [c._id, c.ingredient_category_name]));
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, unitLabel(u)]));
    return (ingredientsQ.data?.data ?? []).map((i) => {
      const categoryId = refId(i.ingredient_category_id);
      const unitId = refId(i.unit_id);
      return {
      _id: i._id,
      name: i.ingredient_name,
      categoryId,
      category: (categoryId && catMap.get(categoryId)) || "",
      unitId,
      unitAbbr: (unitId && unitMap.get(unitId)) || "",
      currentStock: i.current_stock,
      reorderPoint: i.reorder_point,
      maxStock: i.max_stock ?? null,
      costPerUnit: i.cost_per_unit,
      supplier: i.supplier ?? "",
      updatedAt: i.updated_at,
      status: getIngredientStatus(i),
      pct: stockPercent(i),
      };
    });
  }, [ingredientsQ.data, categoriesQ.data, unitsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q || r.name.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q);
      const matchCategory = categoryId === "all" || r.categoryId === categoryId;
      const matchStatus = status === "all" || r.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [rows, search, categoryId, status]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      ok: rows.filter((r) => r.status === "ok").length,
      low: rows.filter((r) => r.status === "low").length,
      out: rows.filter((r) => r.status === "out").length,
    }),
    [rows],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ingredients"] });

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: IngredientInput }) => {
      if (!id) return ingredientsService.create(body);
      const patch: Partial<IngredientInput> = { ...body };
      delete patch.current_stock;
      return ingredientsService.update(id, patch);
    },
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("ingredients.saved") : t("ingredients.added"));
      invalidate();
      setFormOpen(false);
      setEditTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("ingredients.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => ingredientsService.remove(id),
    onSuccess: () => {
      alert.success(t("ingredients.deleted"));
      invalidate();
    },
    // 409 = ยังมีสูตร/ส่วนประกอบใช้วัตถุดิบนี้อยู่ — backend ส่งรายชื่อสูตรมาในข้อความ → เตือน (ไม่ใช่ error)
    onError: (e) =>
      isApiError(e) && e.status === 409
        ? alert.warning(e.message, { title: t("ingredients.deleteInUseTitle") })
        : alert.error(isApiError(e) ? e.message : t("ingredients.deleteFailed")),
  });

  return {
    perm,
    rows: filtered,
    stats,
    categories,
    ingredientUnits,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: ingredientsQ.isPending || categoriesQ.isPending || unitsQ.isPending,
    isError: ingredientsQ.isError,
    refetch: () => ingredientsQ.refetch(),

    search, setSearch,
    categoryId, setCategoryId,
    status, setStatus,

    formOpen,
    editTarget,
    openAdd: () => { setEditTarget(null); setFormOpen(true); },
    openEdit: (r: IngredientRow) => { setEditTarget(r); setFormOpen(true); },
    closeForm: () => { setFormOpen(false); setEditTarget(null); },
    onSave: (body: IngredientInput) => save.mutate({ id: editTarget?._id ?? null, body }),
    onDelete: (id: string) => remove.mutate(id),
    saving: save.isPending,
  };
}
