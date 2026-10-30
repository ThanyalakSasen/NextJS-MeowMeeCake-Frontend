"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { ACCESS_DENIED_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { fromProduct, toUpdateInput, type ProductFormValue } from "../../productForm";
import { productKey } from "../../productFormQuery";
import { useShippingScopeSaver } from "../../useShippingScopeSaver";
import type { useCustomizationEditor } from "./useCustomizationEditor";

/** customization = การ์ดตัวเลือกสินค้าใต้ฟอร์ม — ร่างที่ยังไม่ได้กดบันทึกของการ์ด บันทึกพร้อมกดบันทึกสินค้า
 *  (เดิมกดบันทึกสินค้าแล้วออกจากหน้า ร่างตัวเลือกหายเงียบ ๆ) */
export function useEditProductViewModel(
  customization: Pick<ReturnType<typeof useCustomizationEditor>, "dirty" | "problems" | "saveFor">,
) {
  const t = useTranslations();
  const qc = useQueryClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // OwnerLayout กั้นหน้าด้วย products.view เท่านั้น — หน้านี้ต้องมี products.update ด้วย
  // (backend: PATCH /admin/products/:id ต้องการ products.update)
  const perm = usePermission("products");
  useEffect(() => {
    if (!perm.update) router.replace(ACCESS_DENIED_PATH);
  }, [perm.update, router]);

  const q = useQuery({
    queryKey: productKey(id),
    queryFn: () => productsService.get(id),
    enabled: !!id,
  });

  const saveShippingScope = useShippingScopeSaver();
  const initialValues = q.data ? fromProduct(q.data.data) : undefined;

  const update = useMutation({
    // ไม่ส่งสต็อกใน PATCH — ปรับสต็อกที่หน้าสต็อกสินค้า (PUT …/stock) เท่านั้น
    // ขอบเขตจัดส่งบันทึกแยก (endpoint ของเมนูจัดส่ง) เฉพาะเมื่อเปลี่ยนจากค่าเดิม
    mutationFn: async (v: ProductFormValue) => {
      await productsService.update(id, toUpdateInput(v));
      const [shippingSaved, customizationSaved] = await Promise.all([
        saveShippingScope(id, v.shipping_scope, initialValues?.shipping_scope),
        customization.saveFor(id),
      ]);
      return { shippingSaved, customizationSaved };
    },
    onSuccess: ({ shippingSaved, customizationSaved }) => {
      // รายการ/หน้าแก้/POS/ตั้งราคา ใช้ข้อมูลสินค้าที่ cache ไว้ (สดอยู่ 30 วิ) — ให้ดึงใหม่
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: productKey(id) });
      // ตัวเลือกบันทึกไม่สำเร็จ — สินค้าบันทึกแล้ว อยู่หน้าเดิมให้กดบันทึกตัวเลือกอีกครั้ง (ร่างยังอยู่)
      if (!customizationSaved) {
        alert.warning(t("customization.saveFailed"));
        return;
      }
      if (shippingSaved) alert.success(t("products.saved"));
      else alert.warning(t("products.shippingScopeFailed"));
      router.push("/owner/products");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("products.saveFailed")),
  });

  return {
    /** false = ไม่มีสิทธิ์แก้ไข กำลังเด้งไป access-denied — View ไม่ต้อง render ฟอร์ม (กันภาพแวบ) */
    allowed: perm.update,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: !!id && q.isPending,
    isError: q.isError,
    // Form mount หลังโหลดเสร็จ → ใช้ initialValues ตรง ๆ ได้ ไม่ต้อง setFieldsValue
    initialValues,
    submitting: update.isPending,
    onSubmit: (v: ProductFormValue) => {
      if (customization.dirty && customization.problems.length > 0) {
        alert.warning(t("customization.fixBeforeSave"));
        return;
      }
      update.mutate(v);
    },
    onCancel: () => router.push("/owner/products"),
  };
}
