"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersService } from "@/services/users";
import { usePermission } from "@/context/PermissionsContext";
import { ACCESS_DENIED_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { emptyEmployeeForm, toCreateInput, type EmployeeFormValue } from "../employeeForm";

const LIST = "/owner/employees";

export function useAddEmployeeViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const qc = useQueryClient();

  // OwnerLayout กั้นหน้าด้วย employees.view เท่านั้น — หน้านี้ต้องมี employees.create ด้วย
  // (backend: POST /admin/users ต้องการ employees.create) ไม่งั้นกรอกฟอร์มเสร็จแล้วเพิ่งได้ 403
  const perm = usePermission("employees");
  useEffect(() => {
    if (!perm.create) router.replace(ACCESS_DENIED_PATH);
  }, [perm.create, router]);

  const create = useMutation({
    mutationFn: (v: EmployeeFormValue) => usersService.create(toCreateInput(v)),
    onSuccess: () => {
      alert.success(t("employees.saved"));
      qc.invalidateQueries({ queryKey: ["users"] });
      router.push(LIST);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.saveFailed")),
  });

  return {
    /** false = ไม่มีสิทธิ์สร้าง กำลังเด้งไป access-denied — View ไม่ต้อง render ฟอร์ม (กันภาพแวบ) */
    allowed: perm.create,
    initialValues: emptyEmployeeForm,
    submitting: create.isPending,
    onSubmit: (v: EmployeeFormValue) => create.mutate(v), // antd Form ยิงมาหลัง validate ผ่านแล้ว
    onCancel: () => router.push(LIST),
  };
}
