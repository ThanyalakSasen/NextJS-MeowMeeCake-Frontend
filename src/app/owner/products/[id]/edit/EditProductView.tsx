"use client";
import { useTranslations } from "next-intl";
import { Card, Form, EmptyState } from "@/components/base";
import { CancelButton } from "@/components/shared/actions";
import { FormSaveButton } from "@/components/shared/form";
import { LoadingSpin } from "@/components/shared/feedback";
import { ProductFormFields } from "../../_components/ProductFormFields";
import type { useEditProductViewModel } from "./useEditProductViewModel";
import type { useCustomizationEditor } from "./useCustomizationEditor";
import { CustomizationEditor } from "./_components/CustomizationEditor";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function EditProductView(
  vm: ReturnType<typeof useEditProductViewModel> & { customization: ReturnType<typeof useCustomizationEditor> },
) {
  const t = useTranslations();

  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  if (vm.isLoading) return <LoadingSpin />;
  if (vm.isError || !vm.initialValues) return <EmptyState description={t("errors.notFound")} />;

  return (
    <FormPageLayout title={t("common.edit")}>
      {/* พื้นขาวให้ฟอร์ม — เหมือนการ์ดอื่นในหลังร้าน (พื้นหน้าเป็นสีครีม) */}
      <Card className="p-6">
        <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
          <ProductFormFields mode="edit" />
          <FormActions>
            <FormSaveButton loading={vm.submitting} />
            <CancelButton onClick={vm.onCancel} />
          </FormActions>
        </Form>
      </Card>
      {/* ตัวเลือกสินค้า — บันทึกแยกจากฟอร์มสินค้า (PUT …/customization) */}
      <CustomizationEditor {...vm.customization} />
    </FormPageLayout>
  );
}
