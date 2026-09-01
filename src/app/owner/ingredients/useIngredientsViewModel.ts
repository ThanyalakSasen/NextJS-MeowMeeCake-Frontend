"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredients List — โหลด ingredients + categories + units ครั้งเดียว
// filter/count ฝั่ง client (แพทเทิร์นเดียวกับ Product Stock) · create/update/delete ผ่าน modal
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ingredientsService } from "@/services/ingredients";
import { ingredientCategoriesService } from "@/services/ingredientCategories";
import { unitsService } from "@/services/units";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isIngredientUnit } from "@/utils/unitContext";
import type { StockStatus } from "@/constants/enumConfig";
import type { IngredientInput } from "@/types/ingredient";
import { getIngredientStatus, stockPercent } from "./ingredientStatus";

export interface IngredientRow {
  _id: string;
  sku: string;
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

const skuOf = (id: string) => `ING-${id.slice(-6).toUpperCase()}`;

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
    queryKey: ["ingredients"],
    queryFn: () => ingredientsService.list({ limit: 100 }),
  });
  const categoriesQ = useQuery({
    queryKey: ["ingredient-categories"],
    queryFn: () => ingredientCategoriesService.list(),
  });
  const unitsQ = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsService.list(),
  });

  const categories = categoriesQ.data?.data ?? [];
  /** เฉพาะหน่วยที่ตั้งไว้ว่าใช้กับวัตถุดิบ — ป้อนให้ Select ในฟอร์ม */
  const ingredientUnits = useMemo(
    () => (unitsQ.data?.data ?? []).filter((u) => isIngredientUnit(u.usage_context)),
    [unitsQ.data],
  );

  const rows = useMemo<IngredientRow[]>(() => {
    const catMap = new Map((categoriesQ.data?.data ?? []).map((c) => [c._id, c.category_name]));
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    return (ingredientsQ.data?.data ?? []).map((i) => ({
      _id: i._id,
      sku: skuOf(i._id),
      name: i.ingredient_name,
      categoryId: i.ingredient_category_id ?? "",
      category: (i.ingredient_category_id && catMap.get(i.ingredient_category_id)) || "",
      unitId: i.unit_id ?? "",
      unitAbbr: (i.unit_id && unitMap.get(i.unit_id)) || "",
      currentStock: i.current_stock,
      reorderPoint: i.reorder_point,
      maxStock: i.max_stock ?? null,
      costPerUnit: i.cost_per_unit,
      supplier: i.supplier ?? "",
      updatedAt: i.updated_at,
      status: getIngredientStatus(i),
      pct: stockPercent(i),
    }));
  }, [ingredientsQ.data, categoriesQ.data, unitsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q);
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
    mutationFn: ({ id, body }: { id: string | null; body: IngredientInput }) =>
      id ? ingredientsService.update(id, body) : ingredientsService.create(body),
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("ingredients.saved") : t("ingredients.added"));
      invalidate();
      setFormOpen(false);
      setEditTarget(null);
    },
    onError: () => alert.error(t("ingredients.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => ingredientsService.remove(id),
    onSuccess: () => {
      alert.success(t("ingredients.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("ingredients.deleteFailed")),
  });

  return {
    perm,
    rows: filtered,
    stats,
    categories,
    ingredientUnits,
    isLoading: ingredientsQ.isLoading || categoriesQ.isLoading || unitsQ.isLoading,
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
