"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Permissions Mgmt — matrix สิทธิ์ต่อ (role × menu_key)
// โหลด roles + users + permissions · แก้ในหน่วยความจำ (overrides) · Save = ยิงทีละแถว
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { rolesService } from "@/services/roles";
import { usersService } from "@/services/users";
import { permissionsService } from "@/services/permissions";
import { usePermission } from "@/context/PermissionsContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { alert, confirmAlert } from "@/lib/alert";
import type { MenuKey } from "@/constants/menuKeys";
import type { PermissionInput } from "@/types/permission";
import type { RoleInput, RoleType } from "@/types/role";
import {
  PERM_MENU_KEYS, emptyRolePerms, groupPermissions, countAll, countRow, rowHasAny,
  type RolePerms, type PermField, type PermRow,
} from "./permissionGroups";

export interface AddRoleValues {
  role_name: string;
  role_type: RoleType;
  copyFrom?: string;
}

export function usePermissionsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("employees");
  const { user } = useCurrentUser();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, RolePerms>>({});
  const [saving, setSaving] = useState(false);

  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list() });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => usersService.list({ limit: 200 }) });
  const permsQ = useQuery({ queryKey: ["permissions"], queryFn: () => permissionsService.list({ limit: 500 }) });

  const roles = useMemo(
    () => (rolesQ.data?.data ?? []).filter((r) => r.role_type !== "customer"),
    [rolesQ.data],
  );

  const memberCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of usersQ.data?.data ?? []) if (u.role_id) m[u.role_id] = (m[u.role_id] ?? 0) + 1;
    return m;
  }, [usersQ.data]);

  const serverByRole = useMemo(
    () => groupPermissions(roles.map((r) => r._id), permsQ.data?.data ?? []),
    [roles, permsQ.data],
  );

  const activeRoleId = selectedRoleId ?? roles[0]?._id ?? null;
  const selectedRole = roles.find((r) => r._id === activeRoleId) ?? null;

  const permsOf = (roleId: string): RolePerms =>
    overrides[roleId] ?? serverByRole[roleId] ?? emptyRolePerms();

  const selectedRows = activeRoleId ? permsOf(activeRoleId) : null;
  const dirty = activeRoleId != null && activeRoleId in overrides;
  const summary = selectedRows ? countAll(selectedRows) : { on: 0, total: 0 };

  // ── แก้ในหน่วยความจำ ──
  const patchRole = (roleId: string, next: RolePerms) =>
    setOverrides((prev) => ({ ...prev, [roleId]: next }));

  const setField = (menuKey: MenuKey, field: PermField, value: boolean) => {
    if (!activeRoleId || !selectedRows) return;
    patchRole(activeRoleId, {
      ...selectedRows,
      [menuKey]: { ...selectedRows[menuKey], [field]: value },
    });
  };

  const toggleSection = (menuKey: MenuKey) => {
    if (!activeRoleId || !selectedRows) return;
    const row = selectedRows[menuKey];
    const on = countRow(row) < 5;
    patchRole(activeRoleId, {
      ...selectedRows,
      [menuKey]: { ...row, can_view: on, can_create: on, can_update: on, can_delete: on, can_approve: on },
    });
  };

  // ── persist ──
  const createPerm = useMutation({ mutationFn: (b: PermissionInput) => permissionsService.create(b) });
  const updatePerm = useMutation({
    mutationFn: ({ id, b }: { id: string; b: Partial<PermissionInput> }) => permissionsService.update(id, b),
  });

  async function persistRows(roleId: string, rows: RolePerms): Promise<void> {
    for (const key of PERM_MENU_KEYS) {
      const row = rows[key];
      const payload = {
        can_view: row.can_view, can_create: row.can_create, can_update: row.can_update,
        can_delete: row.can_delete, can_approve: row.can_approve,
      };
      if (row.id) {
        await updatePerm.mutateAsync({ id: row.id, b: payload });
      } else if (rowHasAny(row)) {
        await createPerm.mutateAsync({
          role_id: roleId,
          menu_key: key,
          granted_by: user?.id ?? null,
          ...payload,
        });
      }
    }
  }

  const onSave = async () => {
    if (!activeRoleId || !selectedRows || !selectedRole) return;
    setSaving(true);
    try {
      await persistRows(activeRoleId, selectedRows);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[activeRoleId];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["permissions"] });
      alert.success(t("permissions.saveSuccess", { role: selectedRole.role_name }));
    } catch {
      alert.error(t("permissions.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!activeRoleId || !selectedRows) return;
    const ok = await confirmAlert(t("permissions.resetConfirm"), {
      title: t("permissions.reset"),
      confirmText: t("permissions.reset"),
      cancelText: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    const cleared = {} as RolePerms;
    for (const k of PERM_MENU_KEYS) cleared[k] = { id: selectedRows[k].id, ...emptyRow() };
    setSaving(true);
    try {
      await persistRows(activeRoleId, cleared);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[activeRoleId];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["permissions"] });
      alert.info(t("permissions.resetSuccess"));
    } catch {
      alert.error(t("permissions.resetFailed"));
    } finally {
      setSaving(false);
    }
  };

  // ── roles CRUD ──
  const onAddRole = async (values: AddRoleValues) => {
    try {
      const created = await rolesService.create({
        role_name: values.role_name.trim(),
        role_type: values.role_type,
      } satisfies RoleInput);
      const newId = created.data._id;
      if (values.copyFrom) {
        const src = permsOf(values.copyFrom);
        const copy = {} as RolePerms;
        for (const k of PERM_MENU_KEYS) copy[k] = { id: null, ...stripId(src[k]) };
        await persistRows(newId, copy);
      }
      await qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["permissions"] });
      setSelectedRoleId(newId);
      alert.success(t("permissions.createRoleSuccess", { role: created.data.role_name }));
      return true;
    } catch {
      alert.error(t("permissions.createRoleFailed"));
      return false;
    }
  };

  const onDeleteRole = async () => {
    if (!selectedRole) return;
    const ok = await confirmAlert(t("permissions.deleteRoleConfirm", { role: selectedRole.role_name }), {
      title: t("permissions.deleteRole"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await rolesService.remove(selectedRole._id);
      const remaining = roles.filter((r) => r._id !== selectedRole._id);
      setSelectedRoleId(remaining[0]?._id ?? null);
      qc.invalidateQueries({ queryKey: ["roles"] });
      alert.success(t("permissions.deleteRoleSuccess", { role: selectedRole.role_name }));
    } catch {
      alert.error(t("permissions.deleteRoleFailed"));
    }
  };

  return {
    perm,
    isLoading: rolesQ.isLoading || usersQ.isLoading || permsQ.isLoading,
    isError: rolesQ.isError || permsQ.isError,

    roles,
    memberCounts,
    activeRoleId,
    selectedRole,
    selectedRows,
    summary,
    dirty,
    saving,

    selectRole: setSelectedRoleId,
    setField,
    toggleSection,
    onSave,
    onReset,
    onAddRole,
    onDeleteRole,
  };
}

function emptyRow() {
  return { can_view: false, can_create: false, can_update: false, can_delete: false, can_approve: false };
}
function stripId(row: PermRow) {
  const { id: _omit, ...rest } = row;
  void _omit;
  return rest;
}
