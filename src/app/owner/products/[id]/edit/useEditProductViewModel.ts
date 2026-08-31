"use client";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { fromProduct, toInput, type ProductFormValue } from "../../productForm";

export function useEditProductViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const q = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.get(id),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (v: ProductFormValue) => productsService.update(id, toInput(v)),
    onSuccess: () => {
      alert.success(t("products.saved"));
      router.push("/owner/products");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("products.saveFailed")),
  });

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    // Form mount หลังโหลดเสร็จ → ใช้ initialValues ตรง ๆ ได้ ไม่ต้อง setFieldsValue
    initialValues: q.data ? fromProduct(q.data.data) : undefined,
    submitting: update.isPending,
    onSubmit: (v: ProductFormValue) => update.mutate(v),
    onCancel: () => router.push("/owner/products"),
  };
}
