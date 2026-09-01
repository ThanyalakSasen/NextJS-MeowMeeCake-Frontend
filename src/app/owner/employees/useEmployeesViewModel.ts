"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Employees List — โหลด users + roles, กรอง role customer ออก
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { EmploymentType } from "@/types/user";

export interface EmployeeRow {
  _id: string;
  name: string;
  phone: string;
  roleId: string;
  roleName: string;
  employmentType: EmploymentType | null;
  working: boolean;
}

type StatusFilter = "all" | "working" | "left";

export function useEmployeesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("employees");

  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list({ limit: 100 }),
  });
  const rolesQ = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesService.list(),
  });

  /** role ที่ไม่ใช่ลูกค้า — ใช้ทั้ง lookup ชื่อและ dropdown ตัวกรอง */
  const staffRoles = useMemo(
    () => (rolesQ.data?.data ?? []).filter((r) => r.role_type !== "customer"),
    [rolesQ.data],
  );

  const rows = useMemo<EmployeeRow[]>(() => {
    const roleMap = new Map((rolesQ.data?.data ?? []).map((r) => [r._id, r]));
    return (usersQ.data?.data ?? [])
      .filter((u) => {
        const role = u.role_id ? roleMap.get(u.role_id) : undefined;
        // ยังโหลด roles ไม่เสร็จ = แสดงไปก่อน · โหลดเสร็จแล้ว = ตัด customer ออก
        return roleMap.size === 0 || (role ? role.role_type !== "customer" : true);
      })
      .map((u) => ({
        _id: u._id,
        name: u.user_fullname,
        phone: u.user_phone || "—",
        roleId: u.role_id ?? "",
        roleName: (u.role_id && roleMap.get(u.role_id)?.role_name) || "—",
        employmentType: u.employment_type ?? null,
        working: u.emp_status,
      }));
  }, [usersQ.data, rolesQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.roleName.toLowerCase().includes(q);
      const matchRole = roleId === "all" || r.roleId === roleId;
      const matchStatus = status === "all" || (status === "working" ? r.working : !r.working);
      return matchSearch && matchRole && matchStatus;
    });
  }, [rows, search, roleId, status]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      working: rows.filter((r) => r.working).length,
      left: rows.filter((r) => !r.working).length,
      roles: new Set(rows.map((r) => r.roleName)).size,
    }),
    [rows],
  );

  const remove = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      alert.success(t("employees.deleted"));
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => alert.error(t("employees.deleteFailed")),
  });

  return {
    perm,
    rows: filtered,
    stats,
    staffRoles,
    isLoading: usersQ.isLoading || rolesQ.isLoading,
    isError: usersQ.isError,
    refetch: () => usersQ.refetch(),

    search, setSearch,
    roleId, setRoleId,
    status, setStatus,

    onDelete: (id: string) => remove.mutate(id),
  };
}
