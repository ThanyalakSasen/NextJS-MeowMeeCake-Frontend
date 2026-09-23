"use client";
import { useTranslations } from "next-intl";
import { Form } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
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
          <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
          <CancelButton onClick={vm.onCancel} />
        </div>
      </Form>
    </div>
  );
}
