"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersService } from "@/services/users";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { fromUser, toInput, type EmployeeFormValue } from "../employeeForm";

const LIST = "/owner/employees";

export function useEditEmployeeViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const qc = useQueryClient();
  // route เป็น /owner/employees/editEmployee?id=... (query param ไม่ใช่ dynamic segment)
  const id = useSearchParams().get("id") ?? "";

  const q = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersService.get(id),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (v: EmployeeFormValue) => usersService.update(id, toInput(v)),
    onSuccess: () => {
      alert.success(t("employees.saved"));
      qc.invalidateQueries({ queryKey: ["users"] });
      router.push(LIST);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.saveFailed")),
  });

  return {
    isLoading: !!id && q.isLoading,
    isError: !id || q.isError,
    // Form mount หลังโหลดเสร็จ → ใช้ initialValues ตรง ๆ ได้ ไม่ต้อง setFieldsValue
    initialValues: q.data ? fromUser(q.data.data) : undefined,
    submitting: update.isPending,
    onSubmit: (v: EmployeeFormValue) => update.mutate(v),
    onCancel: () => router.push(LIST),
  };
}
