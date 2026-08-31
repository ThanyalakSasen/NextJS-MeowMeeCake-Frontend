"use client";
import { useTranslations } from "next-intl";
import { Button, Form } from "@/components/base";
import { ProductFormFields } from "../_components/ProductFormFields";
import type { useAddProductViewModel } from "./useAddProductViewModel";

export function AddProductView(vm: ReturnType<typeof useAddProductViewModel>) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium text-brown-900">{t("nav.productsAdd")}</h1>
      <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
        <ProductFormFields />
        <div className="flex gap-2 mt-4">
          <Button type="primary" htmlType="submit" loading={vm.submitting}>
            {t("common.save")}
          </Button>
          <Button onClick={vm.onCancel}>{t("common.cancel")}</Button>
        </div>
      </Form>
    </div>
  );
}
