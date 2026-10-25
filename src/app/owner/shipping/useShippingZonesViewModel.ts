"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ค่าจัดส่งหน้าร้านออนไลน์" (BACKLOG4 F2 · ต้นแบบ FrontOffice owner/shipping) — MVVM + i18n
// เพิ่ม/แก้/ลบโซนผ่าน /admin/shipping-zones (สิทธิ์ store_info.view / create / update / delete · backend Q-BE2)
// โซน D = จังหวัดที่ไม่อยู่ในโซนอื่น (ลบไม่ได้ · ใส่จังหวัดไม่ได้)
// ใช้คิดค่าส่งออเดอร์/พรีออเดอร์ที่ลูกค้าสั่งจากหน้าเว็บ · ค่าส่งของออเดอร์ที่สร้างจากหลังร้านอยู่ที่ "โซนค่าจัดส่ง" (delivery-zones)
// ขอบเขตจัดส่งรายหมวด (ส่งทั่วประเทศ/เฉพาะจังหวัดร้าน) อยู่ที่ปุ่ม <CategoryShippingButton> มุมขวาบน
// (ปุ่มเดียวกันในหน้าจัดการข้อมูลสินค้า · ข้อมูลจาก hooks/useCategoryShipping — ไม่ผ่าน ViewModel นี้)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shippingZonesService } from "@/services/shippingZones";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ShippingZone, ShippingZoneCode } from "@/types/shippingZone";
import { shippingZonesKey } from "@/app/customer/lib/catalogQueries";
import {
  EMPTY_ZONE_FORM, FALLBACK_ZONE, provinceOwners, resolveShippingZone, toShippingZoneCreate, toShippingZoneForm, toShippingZoneUpdate,
  validateShippingZone,
  type ShippingZoneErrors, type ShippingZoneForm,
} from "./shippingZoneForm";
import { SHIPPING_ZONES_KEY as KEY } from "./shippingQuery";


export function useShippingZonesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("shipping");

  // page.tsx ดึงไว้ฝั่ง server แล้ว (key ที่ shippingQuery.ts)
  const q = useQuery({ queryKey: KEY, queryFn: () => shippingZonesService.list() });
  const zones = useMemo(() => q.data ?? [], [q.data]);

  // ── เพิ่ม/แก้ไข (modal) — code null = เพิ่มโซนใหม่ ──
  const [editing, setEditing] = useState<{ code: ShippingZoneCode | null; form: ShippingZoneForm } | null>(null);
  const [errors, setErrors] = useState<ShippingZoneErrors>({});
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: KEY });
    void qc.invalidateQueries({ queryKey: shippingZonesKey });
  };

  const save = useMutation({
    mutationFn: ({ code, form }: { code: ShippingZoneCode | null; form: ShippingZoneForm }) =>
      code ? shippingZonesService.update(code, toShippingZoneUpdate(code, form)) : shippingZonesService.create(toShippingZoneCreate(form)),
    onSuccess: (zone, { code }) => {
      alert.success(t(code ? "shippingZones.saved" : "shippingZones.added", { code: zone.zone_code }));
      setEditing(null);
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.saveFailed")),
  });

  const remove = useMutation({
    mutationFn: (code: ShippingZoneCode) => shippingZonesService.remove(code),
    onSuccess: (_r, code) => {
      alert.success(t("shippingZones.removed", { code }));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.removeFailed")),
  });

  const onSave = () => {
    if (!editing) return;
    const errs = validateShippingZone(editing.form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate(editing);
  };

  // ── ตรวจว่าจังหวัดไหนใช้โซนอะไร ──
  const [checkProvince, setCheckProvince] = useState("");

  return {
    perm,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: q.isPending,
    isError: q.isError,
    refetch: () => q.refetch(),
    zones,

    editing,
    /** จังหวัดที่อยู่โซนอื่นแล้ว → ปิดในตัวเลือก (backend ตอบ 409 ถ้าซ้ำ) */
    takenProvinces: editing ? provinceOwners(zones, editing.code) : new Map<string, ShippingZoneCode>(),
    openEdit: (z: ShippingZone) => {
      setErrors({});
      setEditing({ code: z.zone_code, form: toShippingZoneForm(z) });
    },
    openCreate: () => {
      setErrors({});
      setEditing({ code: null, form: { ...EMPTY_ZONE_FORM } });
    },
    /** ลบได้ทุกโซนยกเว้น D */
    canRemove: (z: ShippingZone) => perm.delete && z.zone_code !== FALLBACK_ZONE,
    onRemove: async (z: ShippingZone) => {
      const ok = await confirmAlert(t("shippingZones.removeConfirm", { code: z.zone_code, label: z.zone_label }), {
        title: t("shippingZones.removeTitle"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        danger: true,
      });
      if (ok) remove.mutate(z.zone_code);
    },
    closeEdit: () => setEditing(null),
    setForm: (form: ShippingZoneForm) => {
      setEditing((e) => (e ? { ...e, form } : e));
      setErrors({});
    },
    errors: Object.fromEntries(
      Object.entries(errors).map(([k, v]) => [k, t(`shippingZones.errors.${v}` as Parameters<typeof t>[0])]),
    ) as Partial<Record<keyof ShippingZoneErrors, string>>,
    saving: save.isPending,
    onSave,

    checkProvince,
    setCheckProvince,
    checkResult: checkProvince.trim() ? resolveShippingZone(checkProvince, zones) : null,
  };
}
