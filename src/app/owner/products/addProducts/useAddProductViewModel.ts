"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { ACCESS_DENIED_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { emptyProductForm, toInput, type ProductFormValue } from "../productForm";
import { useShippingScopeSaver } from "../useShippingScopeSaver";
import type { useCustomizationEditor } from "../[id]/edit/useCustomizationEditor";

/** customization = ร่างตัวเลือกสินค้าจากการ์ดใต้ฟอร์ม — บันทึกให้หลังสร้างสินค้า */
export function useAddProductViewModel(customization: Pick<ReturnType<typeof useCustomizationEditor>, "problems" | "saveFor">) {
  const t = useTranslations();
  const router = useRouter();

  // OwnerLayout กั้นหน้าด้วย products.view เท่านั้น — หน้านี้ต้องมี products.create ด้วย
  // (backend: POST /admin/products ต้องการ products.create)
  const perm = usePermission("products");
  useEffect(() => {
    if (!perm.create) router.replace(ACCESS_DENIED_PATH);
  }, [perm.create, router]);

  const saveShippingScope = useShippingScopeSaver();

  // สร้างสินค้าก่อน แล้วตั้งขอบเขตจัดส่ง + ตัวเลือกสินค้า (คนละ endpoint) — ขั้นหลังพลาด สินค้ายังถูกสร้าง
  // ขอบเขตจัดส่งพลาด → แจ้งให้ไปตั้งที่หน้าค่าจัดส่ง · ตัวเลือกพลาด → เปิดหน้าแก้สินค้าให้เพิ่มต่อ
  const create = useMutation({
    mutationFn: async (v: ProductFormValue) => {
      const res = await productsService.create(toInput(v));
      const id = res.data._id;
      const [shippingSaved, customizationSaved] = await Promise.all([
        saveShippingScope(id, v.shipping_scope),
        customization.saveFor(id),
      ]);
      return { id, shippingSaved, customizationSaved };
    },
    onSuccess: ({ id, shippingSaved, customizationSaved }) => {
      if (!customizationSaved) {
        alert.warning(t("customization.saveAfterCreateFailed"));
        router.push(`/owner/products/${id}/edit`);
        return;
      }
      if (shippingSaved) alert.success(t("products.saved"));
      else alert.warning(t("products.shippingScopeFailed"));
      router.push("/owner/products");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("products.saveFailed")),
  });

  return {
    /** false = ไม่มีสิทธิ์สร้าง กำลังเด้งไป access-denied — View ไม่ต้อง render ฟอร์ม (กันภาพแวบ) */
    allowed: perm.create,
    initialValues: emptyProductForm,
    submitting: create.isPending,
    // antd Form ยิงมาหลัง validate ผ่านแล้ว · ตัวเลือกสินค้ายังกรอกไม่ครบ = ไม่สร้าง (รายการที่ผิดแสดงใต้การ์ดตัวเลือกแล้ว)
    onSubmit: (v: ProductFormValue) => {
      if (customization.problems.length > 0) {
        alert.warning(t("customization.fixBeforeSave"));
        return;
      }
      create.mutate(v);
    },
    onCancel: () => router.push("/owner/products"),
  };
}
