"use client";
import { useTranslations } from "next-intl";
import { Card, Form } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
import { ProductFormFields } from "../_components/ProductFormFields";
import type { useAddProductViewModel } from "./useAddProductViewModel";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function AddProductView(vm: ReturnType<typeof useAddProductViewModel>) {
  const t = useTranslations();
  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  return (
    <FormPageLayout title={t("nav.productsAdd")}>
      {/* พื้นขาวให้ฟอร์ม — เหมือนการ์ดอื่นในหลังร้าน (พื้นหน้าเป็นสีครีม) */}
      <Card className="p-6">
        <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
          <ProductFormFields />
          <FormActions>
            <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
            <CancelButton onClick={vm.onCancel} />
          </FormActions>
        </Form>
      </Card>
    </FormPageLayout>
  );
}
