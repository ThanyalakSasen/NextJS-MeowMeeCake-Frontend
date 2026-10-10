"use client";
import { useTranslations } from "next-intl";
import { Form } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
import { EmployeeFormFields } from "../_components/EmployeeFormFields";
import type { useAddEmployeeViewModel } from "./useAddEmployeeViewModel";
import { FormActions, FormPageLayout } from "@/components/shared/layout";

export function AddEmployeeView(vm: ReturnType<typeof useAddEmployeeViewModel>) {
  const t = useTranslations();
  if (!vm.allowed) return null; // กำลังเด้งไป access-denied
  return (
    <FormPageLayout title={t("nav.employeesAdd")}>
      <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
        <EmployeeFormFields />
        <FormActions>
          <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
          <CancelButton onClick={vm.onCancel} />
        </FormActions>
      </Form>
    </FormPageLayout>
  );
}
