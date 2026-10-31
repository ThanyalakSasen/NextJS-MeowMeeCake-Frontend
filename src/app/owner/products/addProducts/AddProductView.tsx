"use client";
import { useTranslations } from "next-intl";
import { Card, Form, useAntForm, useFormValid } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
import { ProductFormFields } from "../_components/ProductFormFields";
import { CustomizationEditor } from "../[id]/edit/_components/CustomizationEditor";
import type { useCustomizationEditor } from "../[id]/edit/useCustomizationEditor";
import type { useAddProductViewModel } from "./useAddProductViewModel";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function AddProductView(
  vm: ReturnType<typeof useAddProductViewModel> & { customization: ReturnType<typeof useCustomizationEditor> },
) {
  const t = useTranslations();
  const [form] = useAntForm();
  // ปุ่มบันทึกกดได้เมื่อทุกช่องผ่าน rules — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);
  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  return (
    <FormPageLayout title={t("nav.productsAdd")}>
      {/* พื้นขาวให้ฟอร์ม — เหมือนการ์ดอื่นในหลังร้าน (พื้นหน้าเป็นสีครีม) */}
      <Card className="p-6">
        <Form form={form} layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
          <ProductFormFields />
        </Form>
      </Card>
      {/* ตัวเลือกสินค้า — กรอกเป็นร่าง บันทึกพร้อมสินค้าหลังสร้างแล้ว (PUT …/customization ต้องมี products.update) */}
      {vm.customization.canEdit && <CustomizationEditor {...vm.customization} />}
      {/* ปุ่มอยู่ใต้การ์ดตัวเลือก — กรอกครบทั้งสองการ์ดแล้วกดบันทึกครั้งเดียว (submit ฟอร์มผ่าน form.submit) */}
      <FormActions>
        <SaveButton type="primary" loading={vm.submitting} disabled={!valid} onClick={() => form.submit()} />
        <CancelButton onClick={vm.onCancel} />
      </FormActions>
    </FormPageLayout>
  );
}
