"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ตัวเลือกสินค้า" ในหน้าแก้สินค้า (BACKLOG3-merge E1)
// โหลดชุดปัจจุบัน → แก้ในหน่วยความจำ → บันทึกทั้งชุดด้วย PUT /admin/products/:id/customization
// บันทึกแยกจากฟอร์มสินค้า (คนละ endpoint) · ดู = products.view · แก้ = products.update
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productCustomizationService } from "@/services/productCustomization";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { CUSTOMIZATION_LIMITS } from "@/types/productCustomization";
import {
  emptyGroup, emptyOption, emptyVariant, fromCustomization, move, toInput, validate,
  type CustomizationState, type GroupRow, type OptionRow, type VariantRow,
} from "./customizationForm";

export const customizationKey = (productId: string) => ["product-customization", productId] as const;

export function useCustomizationEditor() {
  const t = useTranslations();
  const qc = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const perm = usePermission("products");

  const q = useQuery({
    queryKey: customizationKey(id),
    queryFn: () => productCustomizationService.get(id),
    enabled: !!id,
  });

  // state ที่กำลังแก้ — null = ยังไม่แตะ (แสดงตามข้อมูลจาก server) · แก้ครั้งแรกค่อย copy มา
  const [draft, setDraft] = useState<CustomizationState | null>(null);
  const loaded = q.data ? fromCustomization(q.data) : null;
  const state: CustomizationState = draft ?? loaded ?? { groups: [], options: [] };
  const dirty = draft !== null;
  const problems = dirty ? validate(state) : [];

  const edit = (fn: (s: CustomizationState) => CustomizationState) => setDraft(fn(state));
  const editGroup = (key: string, fn: (g: GroupRow) => GroupRow) =>
    edit((s) => ({ ...s, groups: s.groups.map((g) => (g.key === key ? fn(g) : g)) }));
  const editOption = (key: string, fn: (o: OptionRow) => OptionRow) =>
    edit((s) => ({ ...s, options: s.options.map((o) => (o.key === key ? fn(o) : o)) }));

  const save = useMutation({
    mutationFn: () => productCustomizationService.save(id, toInput(state)),
    onSuccess: (saved) => {
      qc.setQueryData(customizationKey(id), saved);
      setDraft(null);
      alert.success(t("customization.saved"));
    },
    // backend ตรวจซ้ำเสมอ — ข้อความของ backend บอกลำดับที่ผิดเป็นภาษาไทยอยู่แล้ว
    onError: (e) => alert.error(isApiError(e) ? e.message : t("customization.saveFailed")),
  });

  return {
    canEdit: perm.update,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
    groups: state.groups,
    options: state.options,
    dirty,
    problems,
    limits: CUSTOMIZATION_LIMITS,
    saving: save.isPending,
    onSave: () => {
      if (problems.length) return;
      save.mutate();
    },
    onDiscard: () => setDraft(null),

    // ── กลุ่ม ──
    addGroup: () => edit((s) => ({ ...s, groups: [...s.groups, emptyGroup()] })),
    removeGroup: (key: string) => edit((s) => ({ ...s, groups: s.groups.filter((g) => g.key !== key) })),
    moveGroup: (index: number, dir: -1 | 1) => edit((s) => ({ ...s, groups: move(s.groups, index, dir) })),
    setGroup: (key: string, patch: Partial<Pick<GroupRow, "name" | "min" | "max">>) =>
      editGroup(key, (g) => ({ ...g, ...patch })),

    // ── ตัวเลือกในกลุ่ม ──
    addVariant: (groupKey: string) => editGroup(groupKey, (g) => ({ ...g, variants: [...g.variants, emptyVariant()] })),
    removeVariant: (groupKey: string, key: string) =>
      editGroup(groupKey, (g) => ({ ...g, variants: g.variants.filter((v) => v.key !== key) })),
    moveVariant: (groupKey: string, index: number, dir: -1 | 1) =>
      editGroup(groupKey, (g) => ({ ...g, variants: move(g.variants, index, dir) })),
    setVariant: (groupKey: string, key: string, patch: Partial<Pick<VariantRow, "name" | "price">>) =>
      editGroup(groupKey, (g) => ({ ...g, variants: g.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) })),

    // ── ออปชันเสริม ──
    addOption: () => edit((s) => ({ ...s, options: [...s.options, emptyOption()] })),
    removeOption: (key: string) => edit((s) => ({ ...s, options: s.options.filter((o) => o.key !== key) })),
    moveOption: (index: number, dir: -1 | 1) => edit((s) => ({ ...s, options: move(s.options, index, dir) })),
    setOption: (key: string, patch: Partial<Omit<OptionRow, "key" | "_id">>) => editOption(key, (o) => ({ ...o, ...patch })),
  };
}
