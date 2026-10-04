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
import { alert, confirmAlert } from "@/lib/alert";
import { isUserLocked, type EmploymentType } from "@/types/user";
import { isApiError } from "@/types/api";

export interface EmployeeRow {
  _id: string;
  name: string;
  phone: string;
  roleId: string;
  roleName: string;
  employmentType: EmploymentType | null;
  working: boolean;
  /** ถูกล็อกจาก login ผิดหลายครั้งอยู่ตอนนี้ */
  locked: boolean;
  /** ล็อกถึงเมื่อไร (ISO) — มีเฉพาะตอน locked */
  lockedUntil: string | null;
}

type StatusFilter = "all" | "working" | "left";

export function useEmployeesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("employees");

  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  // หน้าพนักงาน = เจ้าของ + พนักงานเท่านั้น — กรองที่ backend (ไม่ดึงลูกค้ามา และไม่ให้ลูกค้าจำนวนมากดันพนักงานตกหน้า limit)
  // key แยก ["users","staff"] เพราะหน้าอื่นใช้ ["users"] เดิมกับชุดข้อมูล/limit ต่างกัน (แคชจะปนกัน) — invalidate ["users"] ยังครอบถึง
  const usersQ = useQuery({
    queryKey: ["users", "staff"],
    queryFn: () => usersService.list({ limit: 100, role_type: "owner,staff" }),
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
        locked: isUserLocked(u),
        lockedUntil: isUserLocked(u) ? (u.lockout_until ?? null) : null,
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
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.deleteFailed")),
  });

  // ── ปลดล็อก / ตั้งรหัสผ่านใหม่ (BACKLOG2 §15.2 ข้อ 4) — สิทธิ์ employees.update ทั้งคู่ ──
  // เดิมพนักงานที่ login ผิดจนโดนล็อก (5 ครั้ง → 15 นาที) หรือลืมรหัส เจ้าของร้านแก้ผ่านเว็บไม่ได้เลย
  const unlock = useMutation({
    mutationFn: (id: string) => usersService.unlock(id),
    onSuccess: () => {
      alert.success(t("employees.unlocked"));
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.unlockFailed")),
  });

  const onUnlock = async (r: EmployeeRow) => {
    const ok = await confirmAlert(t("employees.unlockConfirm", { name: r.name }), { title: t("employees.unlock") });
    if (ok) unlock.mutate(r._id);
  };

  const [passwordTarget, setPasswordTarget] = useState<{ id: string; name: string } | null>(null);
  const setPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => usersService.setPassword(id, password),
    onSuccess: () => {
      alert.success(t("employees.passwordReset"));
      setPasswordTarget(null);
      // backend ปลดล็อกให้ด้วย — ดึงสถานะล็อกใหม่
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("employees.passwordResetFailed")),
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

    onUnlock,
    unlockingId: unlock.isPending ? unlock.variables : null,
    passwordTarget,
    openPassword: (r: EmployeeRow) => setPasswordTarget({ id: r._id, name: r.name }),
    closePassword: () => setPasswordTarget(null),
    onSavePassword: (id: string, password: string) => setPassword.mutate({ id, password }),
    savingPassword: setPassword.isPending,
  };
}
