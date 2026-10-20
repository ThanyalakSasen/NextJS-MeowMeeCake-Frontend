"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ค่าจัดส่งหน้าร้านออนไลน์" (BACKLOG4 F2 · ต้นแบบ FrontOffice owner/shipping) — MVVM + i18n
// แก้โซน A–D ผ่าน /admin/shipping-zones (สิทธิ์ store_info.view / update · backend Q-BE2)
// ใช้คิดค่าส่งออเดอร์/พรีออเดอร์ที่ลูกค้าสั่งจากหน้าเว็บ · ค่าส่งของออเดอร์ที่สร้างจากหลังร้านอยู่ที่ "โซนค่าจัดส่ง" (delivery-zones)
// ขอบเขตจัดส่งรายหมวด (ส่งทั่วประเทศ/เฉพาะจังหวัดร้าน) อยู่ที่ปุ่ม <CategoryShippingButton> มุมขวาบน
// (ปุ่มเดียวกันในหน้าจัดการข้อมูลสินค้า · ข้อมูลจาก hooks/useCategoryShipping — ไม่ผ่าน ViewModel นี้)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shippingZonesService } from "@/services/shippingZones";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ShippingZone, ShippingZoneCode } from "@/types/shippingZone";
import { shippingZonesKey } from "@/app/customer/lib/catalogQueries";
import {
  provinceOwners, resolveShippingZone, toShippingZoneForm, toShippingZoneUpdate, validateShippingZone,
  type ShippingZoneErrors, type ShippingZoneForm,
} from "./shippingZoneForm";
import { SHIPPING_ZONES_KEY as KEY } from "./shippingQuery";


export function useShippingZonesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("store_info");

  // page.tsx ดึงไว้ฝั่ง server แล้ว (key ที่ shippingQuery.ts)
  const q = useQuery({ queryKey: KEY, queryFn: () => shippingZonesService.list() });
  const zones = useMemo(() => q.data ?? [], [q.data]);

  // ── แก้ไข (modal) ──
  const [editing, setEditing] = useState<{ code: ShippingZoneCode; form: ShippingZoneForm } | null>(null);
  const [errors, setErrors] = useState<ShippingZoneErrors>({});

  const save = useMutation({
    mutationFn: ({ code, form }: { code: ShippingZoneCode; form: ShippingZoneForm }) =>
      shippingZonesService.update(code, toShippingZoneUpdate(code, form)),
    onSuccess: (zone) => {
      alert.success(t("shippingZones.saved", { code: zone.zone_code }));
      setEditing(null);
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: shippingZonesKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.saveFailed")),
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
