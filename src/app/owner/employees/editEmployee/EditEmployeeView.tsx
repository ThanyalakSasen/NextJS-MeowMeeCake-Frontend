"use client";
import { useTranslations } from "next-intl";
import { Card, Form, EmptyState } from "@/components/base";
import { CancelButton } from "@/components/shared/actions";
import { FormSaveButton } from "@/components/shared/form";
import { LoadingSpin } from "@/components/shared/feedback";
import { EmployeeFormFields } from "../_components/EmployeeFormFields";
import type { useEditEmployeeViewModel } from "./useEditEmployeeViewModel";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function EditEmployeeView(vm: ReturnType<typeof useEditEmployeeViewModel>) {
  const t = useTranslations();

  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  if (vm.isLoading) return <LoadingSpin />;
  if (vm.isError || !vm.initialValues) return <EmptyState description={t("errors.notFound")} />;

  return (
    <FormPageLayout title={t("nav.employeesEdit")}>
      {/* พื้นขาวให้ฟอร์ม — เหมือนการ์ดอื่นในหลังร้าน (พื้นหน้าเป็นสีครีม) */}
      <Card className="p-6">
        <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
          <EmployeeFormFields isEdit currentRoleId={vm.initialValues.role_id} />
          <FormActions>
            <FormSaveButton loading={vm.submitting} />
            <CancelButton onClick={vm.onCancel} />
          </FormActions>
        </Form>
      </Card>
    </FormPageLayout>
  );
}
