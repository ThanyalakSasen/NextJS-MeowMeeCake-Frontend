"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ค่าจัดส่งหน้าร้านออนไลน์" (BACKLOG4 F2 · ต้นแบบ FrontOffice owner/shipping) — MVVM + i18n
// เพิ่ม/แก้/ลบโซนผ่าน /admin/shipping-zones (สิทธิ์ shipping.view/create/update/delete · backend Q-BE2) · โซน D ลบไม่ได้
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
import { CATALOG_PRODUCT_PARAMS, catalogProductsKey, shippingZonesKey } from "@/app/customer/lib/catalogQueries";
import { useLocalOnlyShipping } from "@/app/customer/hooks/useLocalOnlyShipping";
import { catalogService } from "@/services/catalog";
import { sortOptionsThai } from "@/lib/thaiSort";
import {
  EMPTY_SHIPPING_ZONE_FORM, FALLBACK_ZONE, displayZoneCode, provinceOwners, resolveShippingZone, toShippingZoneCreate, toShippingZoneForm, toShippingZoneUpdate,
  validateShippingZone,
  type ShippingZoneErrors, type ShippingZoneForm,
} from "./shippingZoneForm";
import { SHIPPING_ZONES_KEY as KEY } from "./shippingQuery";
import { changedKeys, touchedOnly } from "@/components/shared/form";


export function useShippingZonesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("shipping");

  // page.tsx ดึงไว้ฝั่ง server แล้ว (key ที่ shippingQuery.ts)
  const q = useQuery({ queryKey: KEY, queryFn: () => shippingZonesService.list() });
  const zones = useMemo(() => q.data ?? [], [q.data]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: KEY });
    void qc.invalidateQueries({ queryKey: shippingZonesKey });
  };

  // ── เพิ่ม/แก้ไข (modal) — code = null คือเพิ่มโซนใหม่ ──
  const [editing, setEditing] = useState<{ code: ShippingZoneCode | null; form: ShippingZoneForm } | null>(null);
  // ตรวจสดทุกครั้งที่แก้ — เตือนใต้ช่องที่แตะแล้วทันที · ปุ่มบันทึกกดได้เมื่อถูกครบ (ผู้ใช้ขอ 2026-10-31)
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const liveErrors: ShippingZoneErrors = editing ? validateShippingZone(editing.form, editing.code === null) : {};
  const errors = touchedOnly(liveErrors, touched);
  const canSave = !!editing && Object.keys(liveErrors).length === 0;

  const save = useMutation({
    mutationFn: ({ code, form }: { code: ShippingZoneCode | null; form: ShippingZoneForm }) =>
      code === null ? shippingZonesService.create(toShippingZoneCreate(form)) : shippingZonesService.update(code, toShippingZoneUpdate(code, form)),
    onSuccess: (zone, { code }) => {
      alert.success(t(code === null ? "shippingZones.added" : "shippingZones.saved", { code: displayZoneCode(zone.zone_code, zones) }));
      setEditing(null);
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.saveFailed")),
  });

  const onSave = () => {
    if (!editing) return;
    // ปุ่มถูก disable อยู่แล้วถ้ายังผิด — กันไว้อีกชั้น (เช่น กด Enter): โชว์เตือนทุกช่อง
    if (!canSave) return setTouched(new Set(Object.keys(liveErrors)));
    save.mutate(editing);
  };

  // ── ลบโซน (ยกเว้นโซน D) — จังหวัดของโซนที่ลบไปใช้ค่าส่งโซน D ──
  const remove = useMutation({
    mutationFn: (code: ShippingZoneCode) => shippingZonesService.remove(code),
    onSuccess: (_r, code) => {
      alert.success(t("shippingZones.deleted", { code: displayZoneCode(code, zones), fallback: displayZoneCode(FALLBACK_ZONE, zones) }));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.deleteFailed")),
  });

  // ── ลองเช็กค่าส่ง: จังหวัด + สินค้า (ไม่บังคับ) ──
  // ตรรกะเดียวกับ backend quoteStorefrontDelivery: มีสินค้าที่ส่งได้เฉพาะจังหวัดร้าน + ปลายทางคนละจังหวัด = ส่งไม่ได้
  // ขอบเขตจัดส่งรายสินค้าใช้ hook เดียวกับป้ายบนบัตรสินค้า (API สาธารณะ) · สินค้า = ที่เปิดขายในหน้าร้าน
  const [checkProvince, setCheckProvince] = useState("");
  const [checkProducts, setCheckProducts] = useState<string[]>([]);
  const productsQ = useQuery({ queryKey: catalogProductsKey, queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS), staleTime: 5 * 60_000 });
  const { isLocalOnly, province: storeProvince } = useLocalOnlyShipping();
  const products = useMemo(() => productsQ.data?.data ?? [], [productsQ.data]);
  const check = useMemo(() => {
    if (!checkProvince.trim()) return null;
    const picked = products.filter((p) => checkProducts.includes(p._id));
    const localOnlyNames = picked.filter((p) => isLocalOnly(p._id, p.category_id ?? null)).map((p) => p.product_name_th);
    const zone = resolveShippingZone(checkProvince, zones);
    const blocked = localOnlyNames.length > 0 && checkProvince.trim() !== storeProvince;
    return zone ? { zone, blocked, localOnlyNames } : null;
  }, [checkProvince, checkProducts, products, zones, isLocalOnly, storeProvince]);

  return {
    perm,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: q.isPending,
    isError: q.isError,
    refetch: () => q.refetch(),
    zones,

    editing,
    /** ตัวอักษรที่แสดงของโซน (โซนจังหวัดอื่นทั้งหมด = ตัวสุดท้าย) */
    showCode: (code: string) => displayZoneCode(code, zones),
    /** จังหวัดที่อยู่โซนอื่นแล้ว → ปิดในตัวเลือก (backend ตอบ 409 ถ้าซ้ำ) */
    takenProvinces: editing ? provinceOwners(zones, editing.code) : new Map<string, ShippingZoneCode>(),
    openEdit: (z: ShippingZone) => {
      setTouched(new Set());
      setEditing({ code: z.zone_code, form: toShippingZoneForm(z) });
    },
    openAdd: () => {
      setTouched(new Set());
      setEditing({ code: null, form: { ...EMPTY_SHIPPING_ZONE_FORM } });
    },
    onDelete: (z: ShippingZone) => remove.mutate(z.zone_code),
    deletingCode: remove.isPending ? remove.variables : null,
    closeEdit: () => setEditing(null),
    setForm: (form: ShippingZoneForm) => {
      if (editing) {
        const keys = changedKeys(editing.form, form);
        setTouched((s) => new Set([...s, ...keys]));
      }
      setEditing((e) => (e ? { ...e, form } : e));
    },
    errors: Object.fromEntries(
      Object.entries(errors).map(([k, v]) => [k, t(`shippingZones.errors.${v}` as Parameters<typeof t>[0])]),
    ) as Partial<Record<keyof ShippingZoneErrors, string>>,
    saving: save.isPending,
    canSave,
    onSave,

    checkProvince,
    setCheckProvince,
    checkProducts,
    setCheckProducts,
    productOptions: sortOptionsThai(products.map((p) => ({ value: p._id, label: p.product_name_th }))),
    check,
    /** จังหวัดร้าน (ขอบเขตของสินค้าที่ส่งทั่วประเทศไม่ได้) */
    storeProvince,
  };
}
