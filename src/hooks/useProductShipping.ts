"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useProductShipping.ts
// "จัดส่งนอกจังหวัด" ส่วนรายสินค้า — ใช้คู่กับ useCategoryShipping ใน <ShippingScopePanel> (หน้าเดียว: หัวข้อหมวด + สินค้าในหมวด)
// สวิตช์ต่อสินค้า กดแล้วบันทึกทันที: เปิด = ส่งทั่วประเทศ · ปิด = เฉพาะจังหวัดร้าน
// ค่าที่ตรงกับหมวดบันทึกเป็น null (= ตามหมวด) ไม่ใช่ยกเว้นซ้ำ
// API /admin/shipping-zones/products · สิทธิ์ store_info · ค่าที่ใช้จริง: backend lib/shipping.ts productShipsNationwide
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shippingZonesService } from "@/services/shippingZones";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ProductShipping } from "@/types/shippingZone";
import { shippingExceptionsKey } from "@/app/customer/lib/catalogQueries";

export const PRODUCT_SHIPPING_KEY = ["admin", "shipping-zones", "products"] as const;

/** ตัวกรองขอบเขตจัดส่ง (ค่าที่ใช้จริงของสินค้า) */
export type ShippingScopeFilter = "nationwide" | "province";

export function useProductShipping({ enabled = true }: { enabled?: boolean } = {}) {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("shipping");

  const q = useQuery({
    queryKey: PRODUCT_SHIPPING_KEY,
    queryFn: shippingZonesService.listProducts,
    enabled: enabled && perm.view,
  });
  const items = useMemo(() => q.data ?? [], [q.data]);

  // ── ค้นหา (ชื่อ/รหัสสินค้า) + กรองหมวด (ตัวเลือกหมวดมาจาก useCategoryShipping ที่ panel) + กรองขอบเขตจัดส่ง ──
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<ShippingScopeFilter | undefined>(undefined);
  const keyword = search.trim().toLowerCase();
  /** สินค้าที่ตรงคำค้น + ขอบเขตที่เลือก จัดกลุ่มตาม category_id ("" = ไม่มีหมวด) */
  const byCategory = useMemo(() => {
    const map = new Map<string, ProductShipping[]>();
    for (const p of items) {
      if (keyword && !p.product_name_th.toLowerCase().includes(keyword) && !(p.product_code ?? "").toLowerCase().includes(keyword)) continue;
      if (scope && (scope === "nationwide") !== p.effective_ships_nationwide) continue;
      const key = p.category_id ?? "";
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [items, keyword, scope]);
  const filtering = keyword.length > 0 || scope !== undefined;

  // ── กาง/ย่อหมวด — ตอนค้นหากางทุกหมวดให้เห็นสินค้าที่ตรงคำค้น ──
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** สินค้าทั้งหมดของหมวด (ไม่กรองคำค้น) — ใช้คิดสถานะหัวหมวด "เปิด x/n" */
  const allByCategory = useMemo(() => {
    const map = new Map<string, ProductShipping[]>();
    for (const p of items) map.set(p.category_id ?? "", [...(map.get(p.category_id ?? "") ?? []), p]);
    return map;
  }, [items]);

  const save = useMutation({
    mutationFn: ({ p, value }: { p: ProductShipping; value: boolean | null }) =>
      shippingZonesService.setProductShipping([p._id], value),
    // ไม่แจ้งเตือนตอนสำเร็จ (สวิตช์เปลี่ยนให้เห็นเองอยู่แล้ว — ผู้ใช้ขอเอาออก) · แจ้งเฉพาะตอนบันทึกไม่สำเร็จ
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRODUCT_SHIPPING_KEY });
      void qc.invalidateQueries({ queryKey: shippingExceptionsKey }); // หน้าค่าจัดส่งของลูกค้า
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.products.saveFailed")),
  });

  return {
    perm,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),

    search,
    setSearch,
    /** กรองให้เหลือหมวดเดียว · undefined = ทุกหมวด */
    categoryId,
    setCategoryId,
    /** ขอบเขตจัดส่งที่กรอง · undefined = ทั้งหมด */
    scope,
    setScope,
    /** กำลังค้นหาหรือกรองขอบเขต — กางทุกหมวด + ซ่อนหมวดที่ไม่มีสินค้าตรงเงื่อนไข */
    searching: filtering,
    /** ยอดรวมทั้งร้าน (ไม่สนตัวกรอง) */
    totals: { n: items.length, on: items.filter((p) => p.effective_ships_nationwide).length },
    /** สินค้า (ที่ตรงคำค้น) ของหมวดนี้ */
    productsOf: (categoryId: string) => byCategory.get(categoryId) ?? [],
    /** สินค้าทั้งหมดของหมวด ไม่สนคำค้น */
    allProductsOf: (categoryId: string) => allByCategory.get(categoryId) ?? [],
    /** category_id ที่มีสินค้าตรงคำค้น (รวมหมวดที่ไม่อยู่ในรายการหมวด เช่น หมวดถูกลบแล้ว) */
    categoryIdsWithProducts: [...byCategory.keys()],

    isExpanded: (categoryId: string) => filtering || expandedId === categoryId,
    /** กางได้ทีละหมวด — กางหมวดใหม่ = หมวดที่กางอยู่ย่อลงเอง · กดหมวดที่กางอยู่ = ย่อ */
    toggleGroup: (categoryId: string) => setExpandedId((cur) => (cur === categoryId ? null : categoryId)),

    /** สลับสวิตช์: เปิด = ส่งทั่วประเทศ · ปิด = เฉพาะจังหวัดร้าน — ตรงกับหมวดเก็บเป็น null (ตามหมวด) */
    onToggle: (p: ProductShipping, nationwide: boolean) =>
      save.mutate({ p, value: nationwide === p.category_ships_nationwide ? null : nationwide }),
    /** สินค้าที่กำลังบันทึก (แสดง loading ที่สวิตช์นั้น) */
    savingId: save.isPending ? save.variables?.p._id ?? null : null,
  };
}
