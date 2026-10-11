"use client";
import { useTranslations } from "next-intl";
import { Card, Form } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
import { EmployeeFormFields } from "../_components/EmployeeFormFields";
import type { useAddEmployeeViewModel } from "./useAddEmployeeViewModel";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function AddEmployeeView(vm: ReturnType<typeof useAddEmployeeViewModel>) {
  const t = useTranslations();
  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  return (
    <FormPageLayout title={t("nav.employeesAdd")}>
      {/* พื้นขาวให้ฟอร์ม — เหมือนการ์ดอื่นในหลังร้าน (พื้นหน้าเป็นสีครีม) */}
      <Card className="p-6">
        <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
          <EmployeeFormFields />
          <FormActions>
            <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
            <CancelButton onClick={vm.onCancel} />
          </FormActions>
        </Form>
      </Card>
    </FormPageLayout>
  );
}
