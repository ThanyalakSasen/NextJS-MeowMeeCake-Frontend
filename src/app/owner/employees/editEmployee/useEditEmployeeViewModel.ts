"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersService } from "@/services/users";
import { usePermission } from "@/context/PermissionsContext";
import { ACCESS_DENIED_PATH } from "@/constants/auth";
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

  // OwnerLayout กั้นหน้าด้วย employees.view เท่านั้น — หน้านี้ต้องมี employees.update ด้วย
  // (backend: PATCH /admin/users/:id ต้องการ employees.update)
  const perm = usePermission("employees");
  useEffect(() => {
    if (!perm.update) router.replace(ACCESS_DENIED_PATH);
  }, [perm.update, router]);

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
    /** false = ไม่มีสิทธิ์แก้ไข กำลังเด้งไป access-denied — View ไม่ต้อง render ฟอร์ม (กันภาพแวบ) */
    allowed: perm.update,
    isLoading: !!id && q.isLoading,
    isError: !id || q.isError,
    // Form mount หลังโหลดเสร็จ → ใช้ initialValues ตรง ๆ ได้ ไม่ต้อง setFieldsValue
    initialValues: q.data ? fromUser(q.data.data) : undefined,
    submitting: update.isPending,
    onSubmit: (v: EmployeeFormValue) => update.mutate(v),
    onCancel: () => router.push(LIST),
  };
}
