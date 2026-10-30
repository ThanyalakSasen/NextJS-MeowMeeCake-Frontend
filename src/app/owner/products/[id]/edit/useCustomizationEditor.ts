"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ตัวเลือกสินค้า" (BACKLOG3-merge E1) — ใช้ 2 หน้า:
//  - หน้าแก้สินค้า (มี :id): โหลดชุดปัจจุบัน → แก้ในหน่วยความจำ → ปุ่มบันทึกของการ์ดเอง PUT /admin/products/:id/customization
//  - หน้าเพิ่มสินค้า (ไม่มี :id): เริ่มว่าง แก้เป็นร่าง → หน้าเพิ่มสินค้าบันทึกให้หลังสร้างสินค้าแล้ว (saveFor) ไม่มีปุ่มบันทึกแยก
// ดู = products.view · แก้ = products.update (หน้าเพิ่มต้องมี products.create ด้วย — กั้นที่หน้าแล้ว)
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
import { customizationKey } from "../../productFormQuery";

// key อยู่ไฟล์ pure (server prefetch ใช้ได้) — export ต่อจากที่นี่ให้ที่ import เดิม (POS) ใช้ได้เหมือนเดิม
export { customizationKey } from "../../productFormQuery";

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
    /** false = หน้าเพิ่มสินค้า — ไม่มีปุ่มบันทึกของการ์ด บันทึกพร้อมสินค้าผ่าน saveFor */
    standalone: !!id,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: !!id && q.isPending,
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
    /** หน้าเพิ่มสินค้า: บันทึกร่างให้สินค้าที่เพิ่งสร้าง · ไม่ได้เพิ่มอะไร = ไม่ยิง (คืน true) */
    saveFor: async (productId: string): Promise<boolean> => {
      if (!dirty || (state.groups.length === 0 && state.options.length === 0)) return true;
      try {
        await productCustomizationService.save(productId, toInput(state));
        return true;
      } catch {
        return false;
      }
    },

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
