"use client";
import { useTranslations } from "next-intl";
import { Button, Form } from "@/components/base";
import { EmployeeFormFields } from "../_components/EmployeeFormFields";
import type { useAddEmployeeViewModel } from "./useAddEmployeeViewModel";

export function AddEmployeeView(vm: ReturnType<typeof useAddEmployeeViewModel>) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium text-brown-900">{t("nav.employeesAdd")}</h1>
      <Form layout="vertical" initialValues={vm.initialValues} onFinish={vm.onSubmit}>
        <EmployeeFormFields />
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
