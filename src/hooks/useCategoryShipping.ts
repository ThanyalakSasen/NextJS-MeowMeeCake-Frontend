"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useCategoryShipping.ts
// ขอบเขตจัดส่งรายหมวดหมู่สินค้า (ส่งทั่วประเทศ / เฉพาะจังหวัดร้าน) ของออเดอร์เว็บ — ใช้คู่กับ <CategoryShippingButton>
// ใช้ 2 ที่: ปุ่ม "จัดส่งนอกจังหวัด" หน้าค่าจัดส่งหน้าร้านออนไลน์ · แถวในหน้าต่าง "จัดการหมวดหมู่สินค้า" หน้าสินค้า
// API /admin/shipping-zones/categories · สิทธิ์ store_info (เดียวกับโซนค่าส่ง) — ไม่มี store_info.view = ไม่แสดงสวิตช์
// ─────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shippingZonesService } from "@/services/shippingZones";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { catalogCategoriesKey, shippingExceptionsKey } from "@/app/customer/lib/catalogQueries";
import { PRODUCT_SHIPPING_KEY } from "@/hooks/useProductShipping";

/** export ให้ useCategoryManager ล้างด้วยตอนเพิ่ม/เปลี่ยนชื่อ/ลบหมวดสินค้า (แถวใหม่จะได้มีสวิตช์) */
export const CATEGORY_SHIPPING_KEY = ["admin", "shipping-zones", "categories"] as const;
const KEY = CATEGORY_SHIPPING_KEY;

export function useCategoryShipping({ enabled = true }: { enabled?: boolean } = {}) {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("shipping");

  const q = useQuery({ queryKey: KEY, queryFn: shippingZonesService.listCategories, enabled: enabled && perm.view });

  const save = useMutation({
    mutationFn: ({ id, value, resetProducts }: { id: string; value: boolean; resetProducts?: boolean }) =>
      shippingZonesService.setCategoryShipping(id, value, resetProducts),
    // ไม่แจ้งเตือนตอนสำเร็จ (สวิตช์เปลี่ยนให้เห็นเองอยู่แล้ว — ผู้ใช้ขอเอาออก) · แจ้งเฉพาะตอนบันทึกไม่สำเร็จ
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      // หมวดสินค้าที่หน้าอื่น cache ไว้ — หลังร้าน + หน้าร้าน "ค่าจัดส่ง" (อ่าน ships_nationwide จาก /catalog/categories)
      void qc.invalidateQueries({ queryKey: ["product-categories"] });
      void qc.invalidateQueries({ queryKey: catalogCategoriesKey });
      // ค่าที่ใช้จริงของสินค้าที่ "ตามหมวด" เปลี่ยนตาม — แท็บรายสินค้าต้องดึงใหม่
      void qc.invalidateQueries({ queryKey: PRODUCT_SHIPPING_KEY });
      void qc.invalidateQueries({ queryKey: shippingExceptionsKey }); // สินค้าที่ "ต่างจากหมวด" เปลี่ยนตาม
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("shippingZones.categories.saveFailed")),
  });

  return {
    perm,
    items: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
    onToggle: (id: string, value: boolean) => save.mutate({ id, value }),
    /** เปิด/ปิดทั้งหมวด — ตั้งค่าหมวด + ล้างค่ารายสินค้าในหมวด (สวิตช์หัวหมวดในหน้า "จัดส่งนอกจังหวัด") */
    onToggleWholeCategory: (id: string, value: boolean) => save.mutate({ id, value, resetProducts: true }),
    /** หมวดที่กำลังบันทึก (แสดง loading ที่สวิตช์นั้น) */
    savingId: save.isPending ? save.variables?.id ?? null : null,
  };
}
