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

export function useAddProductViewModel() {
  const t = useTranslations();
  const router = useRouter();

  // OwnerLayout กั้นหน้าด้วย products.view เท่านั้น — หน้านี้ต้องมี products.create ด้วย
  // (backend: POST /admin/products ต้องการ products.create)
  const perm = usePermission("products");
  useEffect(() => {
    if (!perm.create) router.replace(ACCESS_DENIED_PATH);
  }, [perm.create, router]);

  const saveShippingScope = useShippingScopeSaver();

  // สร้างสินค้าก่อน แล้วตั้งขอบเขตจัดส่ง (endpoint แยก) — ขั้นที่ 2 พลาด สินค้ายังถูกสร้าง แจ้งให้ไปตั้งที่หน้าค่าจัดส่ง
  const create = useMutation({
    mutationFn: async (v: ProductFormValue) => {
      const res = await productsService.create(toInput(v));
      return { shippingSaved: await saveShippingScope(res.data._id, v.shipping_scope) };
    },
    onSuccess: ({ shippingSaved }) => {
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
    onSubmit: (v: ProductFormValue) => create.mutate(v), // antd Form ยิงมาหลัง validate ผ่านแล้ว
    onCancel: () => router.push("/owner/products"),
  };
}
