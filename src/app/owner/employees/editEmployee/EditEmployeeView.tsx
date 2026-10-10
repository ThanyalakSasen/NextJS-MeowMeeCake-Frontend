"use client";
import { useTranslations } from "next-intl";
import { Form, EmptyState } from "@/components/base";
import { SaveButton, CancelButton } from "@/components/shared/actions";
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
      <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
        <EmployeeFormFields isEdit />
        <FormActions>
          <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
          <CancelButton onClick={vm.onCancel} />
        </FormActions>
      </Form>
    </FormPageLayout>
  );
}
