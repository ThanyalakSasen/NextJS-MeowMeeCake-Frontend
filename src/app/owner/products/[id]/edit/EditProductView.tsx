"use client";
import { useTranslations } from "next-intl";
import { Form, EmptyState } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
import { LoadingSpin } from "@/components/shared/feedback";
import { ProductFormFields } from "../../_components/ProductFormFields";
import type { useEditProductViewModel } from "./useEditProductViewModel";

export function EditProductView(vm: ReturnType<typeof useEditProductViewModel>) {
  const t = useTranslations();

  if (vm.isLoading) return <LoadingSpin />;
  if (vm.isError || !vm.initialValues) return <EmptyState description={t("errors.notFound")} />;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium text-brown-900">{t("common.edit")}</h1>
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
