"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { ACCESS_DENIED_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { fromProduct, toUpdateInput, type ProductFormValue } from "../../productForm";

export function useEditProductViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // OwnerLayout กั้นหน้าด้วย products.view เท่านั้น — หน้านี้ต้องมี products.update ด้วย
  // (backend: PATCH /admin/products/:id ต้องการ products.update)
  const perm = usePermission("products");
  useEffect(() => {
    if (!perm.update) router.replace(ACCESS_DENIED_PATH);
  }, [perm.update, router]);

  const q = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.get(id),
    enabled: !!id,
  });

  const update = useMutation({
    // ไม่ส่งสต็อกใน PATCH — ปรับสต็อกที่หน้าสต็อกสินค้า (PUT …/stock) เท่านั้น
    mutationFn: (v: ProductFormValue) => productsService.update(id, toUpdateInput(v)),
    onSuccess: () => {
      alert.success(t("products.saved"));
      router.push("/owner/products");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("products.saveFailed")),
  });

  return {
    /** false = ไม่มีสิทธิ์แก้ไข กำลังเด้งไป access-denied — View ไม่ต้อง render ฟอร์ม (กันภาพแวบ) */
    allowed: perm.update,
    isLoading: q.isLoading,
    isError: q.isError,
    // Form mount หลังโหลดเสร็จ → ใช้ initialValues ตรง ๆ ได้ ไม่ต้อง setFieldsValue
    initialValues: q.data ? fromProduct(q.data.data) : undefined,
    submitting: update.isPending,
    onSubmit: (v: ProductFormValue) => update.mutate(v),
    onCancel: () => router.push("/owner/products"),
  };
}
