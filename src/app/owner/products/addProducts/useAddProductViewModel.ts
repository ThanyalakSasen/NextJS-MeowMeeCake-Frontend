"use client";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { emptyProductForm, toInput, type ProductFormValue } from "../productForm";

export function useAddProductViewModel() {
  const t = useTranslations();
  const router = useRouter();

  const create = useMutation({
    mutationFn: (v: ProductFormValue) => productsService.create(toInput(v)),
    onSuccess: () => {
      alert.success(t("products.saved"));
      router.push("/owner/products");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("products.saveFailed")),
  });

  return {
    initialValues: emptyProductForm,
    submitting: create.isPending,
    onSubmit: (v: ProductFormValue) => create.mutate(v), // antd Form ยิงมาหลัง validate ผ่านแล้ว
    onCancel: () => router.push("/owner/products"),
  };
}
