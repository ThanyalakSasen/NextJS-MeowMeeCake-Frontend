"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Manage Units — แบ่งหน่วยเป็น 2 กลุ่ม (วัตถุดิบ / สินค้า) + CRUD ผ่าน modal
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { unitsService } from "@/services/units";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isIngredientUnit, isProductUnit } from "@/utils/unitContext";
import type { Unit, UnitUsage } from "@/types/unit";

export type UnitContext = "ingredient" | "product";

export interface UnitFormValues {
  unit_name: string;
  unit_abbr: string;
  unit_type: string;
  forIngredient: boolean;
  forProduct: boolean;
}

export function useUnitsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("ingredients");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);
  const [defaultContext, setDefaultContext] = useState<UnitContext>("ingredient");

  const unitsQ = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsService.list(),
  });

  const ingredientUnits = useMemo(
    () => (unitsQ.data?.data ?? []).filter((u) => isIngredientUnit(u.usage_context)),
    [unitsQ.data],
  );
  const productUnits = useMemo(
    () => (unitsQ.data?.data ?? []).filter((u) => isProductUnit(u.usage_context)),
    [unitsQ.data],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["units"] });

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: Partial<Unit> }) =>
      id ? unitsService.update(id, body) : unitsService.create(body),
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("units.saved") : t("units.added"));
      invalidate();
      setModalOpen(false);
      setEditTarget(null);
    },
    onError: () => alert.error(t("units.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => unitsService.remove(id),
    onSuccess: () => {
      alert.success(t("units.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("units.deleteFailed")),
  });

  const onSubmit = (v: UnitFormValues) => {
    const usage_context: UnitUsage[] = [];
    if (v.forIngredient) usage_context.push("Ingredient");
    if (v.forProduct) usage_context.push("Product");
    if (usage_context.length === 0) {
      alert.error(t("units.pickContext"));
      return;
    }
    save.mutate({
      id: editTarget?._id ?? null,
      body: { unit_name: v.unit_name, unit_abbr: v.unit_abbr, unit_type: v.unit_type, usage_context },
    });
  };

  return {
    perm,
    ingredientUnits,
    productUnits,
    isLoading: unitsQ.isLoading,
    isError: unitsQ.isError,
    refetch: () => unitsQ.refetch(),

    modalOpen,
    editTarget,
    defaultContext,
    openAdd: (ctx: UnitContext) => { setEditTarget(null); setDefaultContext(ctx); setModalOpen(true); },
    openEdit: (u: Unit) => {
      setEditTarget(u);
      setDefaultContext(isIngredientUnit(u.usage_context) ? "ingredient" : "product");
      setModalOpen(true);
    },
    closeModal: () => { setModalOpen(false); setEditTarget(null); },
    onSubmit,
    onDelete: (id: string) => remove.mutate(id),
    saving: save.isPending,
  };
}
