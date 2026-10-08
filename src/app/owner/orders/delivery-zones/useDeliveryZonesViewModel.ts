"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "โซนค่าจัดส่ง" (BACKLOG4 I8) — ไม่มีในต้นแบบ FrontOffice · MVVM + i18n
// CRUD ผ่าน /admin/delivery-zones (สิทธิ์ orders.*) + ภาพรวมค่าส่งที่ใช้อยู่จาก /admin/delivery-fee
// ใช้กับออเดอร์/พรีออเดอร์ "ส่งตามที่อยู่" ที่สร้างจากหลังร้าน · หน้าร้านออนไลน์ใช้ค่าส่งอีกชุด (F2)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { deliveryZonesService } from "@/services/deliveryZones";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { DeliveryZone, DeliveryZoneInput } from "@/types/deliveryZone";
import {
  EMPTY_ZONE_FORM, activeZones, cleanZoneInput, duplicateProvinces, resolveZone, toZoneForm, validateZone, type ZoneErrors,
} from "./deliveryZoneForm";

const KEY = ["delivery-zones"] as const;
const OVERVIEW_KEY = ["delivery-fee"] as const;

export function useDeliveryZonesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("orders");

  const q = useQuery({ queryKey: KEY, queryFn: deliveryZonesService.list });
  const overviewQ = useQuery({ queryKey: OVERVIEW_KEY, queryFn: deliveryZonesService.overview });
  const zones = useMemo(() => q.data ?? [], [q.data]);
  const live = useMemo(() => zones.filter((z) => !z.deleted_at).sort((a, b) => a.sort_order - b.sort_order), [zones]);
  const deleted = useMemo(() => zones.filter((z) => z.deleted_at), [zones]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: KEY });
    void qc.invalidateQueries({ queryKey: OVERVIEW_KEY });
  };
  const failText = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback);

  // ── เพิ่ม/แก้ไข (modal เดียว · id null = เพิ่ม) ──
  const [editing, setEditing] = useState<{ id: string | null; form: DeliveryZoneInput } | null>(null);
  const [errors, setErrors] = useState<ZoneErrors>({});

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: DeliveryZoneInput }) =>
      id ? deliveryZonesService.update(id, body) : deliveryZonesService.create(body),
    onSuccess: (doc, { id }) => {
      alert.success(t(id ? "deliveryZones.saved" : "deliveryZones.added", { name: doc.zone_name }));
      setEditing(null);
      refresh();
    },
    onError: (e) => alert.error(failText(e, t("deliveryZones.saveFailed"))),
  });

  const toggleActive = useMutation({
    mutationFn: (z: DeliveryZone) => deliveryZonesService.update(z._id, { is_active: !z.is_active }),
    onSuccess: refresh,
    onError: (e) => alert.error(failText(e, t("deliveryZones.saveFailed"))),
  });

  const remove = useMutation({
    mutationFn: (z: DeliveryZone) => deliveryZonesService.remove(z._id),
    onSuccess: (_, z) => {
      alert.success(t("deliveryZones.deleted", { name: z.zone_name }));
      refresh();
    },
    onError: (e) => alert.error(failText(e, t("deliveryZones.deleteFailed"))),
  });

  const restore = useMutation({
    mutationFn: (z: DeliveryZone) => deliveryZonesService.restore(z._id),
    onSuccess: (doc) => {
      alert.success(t("deliveryZones.restored", { name: doc.zone_name }));
      refresh();
    },
    onError: (e) => alert.error(failText(e, t("deliveryZones.saveFailed"))),
  });

  const onSave = () => {
    if (!editing) return;
    const body = cleanZoneInput(editing.form);
    const errs = validateZone(body);
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate({ id: editing.id, body });
  };

  // ── ตรวจว่าจังหวัดไหนใช้โซนอะไร ──
  const [checkProvince, setCheckProvince] = useState("");
  const active = activeZones(zones);
  const currentCatchAll = active.find((z) => z.is_catch_all) ?? null;

  return {
    perm,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
    overview: overviewQ.data ?? null,
    zones: live,
    deleted,
    activeCount: active.length,
    hasCatchAll: !!currentCatchAll,
    duplicates: duplicateProvinces(zones),
    togglingId: toggleActive.isPending ? toggleActive.variables?._id : undefined,
    onToggleActive: (z: DeliveryZone) => toggleActive.mutate(z),
    onDelete: (z: DeliveryZone) => remove.mutate(z),
    restoringId: restore.isPending ? restore.variables?._id : undefined,
    onRestore: (z: DeliveryZone) => restore.mutate(z),

    editing,
    /** โซนอื่นที่เป็น catch-all อยู่ — เปิด catch-all ที่โซนนี้แล้ว backend จะปลดโซนนั้นให้เอง */
    otherCatchAll: editing && currentCatchAll && currentCatchAll._id !== editing.id ? currentCatchAll.zone_name : null,
    openAdd: () => {
      setErrors({});
      const nextOrder = live.length ? Math.max(...live.map((z) => z.sort_order)) + 1 : 1;
      setEditing({ id: null, form: { ...EMPTY_ZONE_FORM, sort_order: nextOrder } });
    },
    openEdit: (z: DeliveryZone) => {
      setErrors({});
      setEditing({ id: z._id, form: toZoneForm(z) });
    },
    closeEdit: () => setEditing(null),
    setForm: (form: DeliveryZoneInput) => {
      setEditing((e) => (e ? { ...e, form } : e));
      setErrors({});
    },
    errors: Object.fromEntries(
      Object.entries(errors).map(([k, v]) => [k, t(`deliveryZones.errors.${v}` as Parameters<typeof t>[0])]),
    ) as Partial<Record<keyof ZoneErrors, string>>,
    saving: save.isPending,
    onSave,

    checkProvince,
    setCheckProvince,
    checkResult: checkProvince.trim() ? { zone: resolveZone(checkProvince, zones), freeMin: overviewQ.data?.free_shipping_min ?? null } : null,
  };
}
