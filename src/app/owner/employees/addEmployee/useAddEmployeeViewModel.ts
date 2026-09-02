"use client";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersService } from "@/services/users";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { emptyEmployeeForm, toInput, type EmployeeFormValue } from "../employeeForm";

const LIST = "/owner/employees";

export function useAddEmployeeViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (v: EmployeeFormValue) => usersService.create(toInput(v)),
    onSuccess: () => {
      alert.success(t("employees.saved"));
      qc.invalidateQueries({ queryKey: ["users"] });
      router.push(LIST);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.saveFailed")),
  });

  return {
    initialValues: emptyEmployeeForm,
    submitting: create.isPending,
    onSubmit: (v: EmployeeFormValue) => create.mutate(v), // antd Form ยิงมาหลัง validate ผ่านแล้ว
    onCancel: () => router.push(LIST),
  };
}
