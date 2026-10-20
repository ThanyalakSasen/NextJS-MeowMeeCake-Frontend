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
import { CURRENT_USER_KEY, useCurrentUser } from "@/hooks/useCurrentUser";
import { alert, confirmAlert } from "@/lib/alert";
import type { MenuKey } from "@/constants/menuKeys";
import type { PermissionInput } from "@/types/permission";
import type { RoleInput, RoleType } from "@/types/role";
import { isApiError } from "@/types/api";
import {
  PERM_FIELDS, PERM_MENU_KEYS, emptyRolePerms, groupPermissions, countAll, rowHasAny,
  type RolePerms, type PermField, type PermRow,
} from "./permissionGroups";
import { usePermissionCeiling } from "../usePermissionCeiling";
import { PERMISSIONS_KEY, PERMISSIONS_PARAMS, ROLES_KEY, STAFF_KEY, STAFF_PARAMS } from "../employeesQuery";

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
  const ceiling = usePermissionCeiling();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, RolePerms>>({});
  const [saving, setSaving] = useState(false);

  // page.tsx ดึงทั้ง 3 ก้อนไว้ฝั่ง server แล้ว (key ที่ employeesQuery.ts)
  const rolesQ = useQuery({ queryKey: ROLES_KEY, queryFn: () => rolesService.list() });
  // ใช้แค่นับจำนวนคนต่อตำแหน่ง (ตำแหน่งลูกค้าถูกตัดออกอยู่แล้ว) — ดึงเฉพาะเจ้าของ+พนักงาน ชุดเดียวกับหน้ารายชื่อ
  // เดิมดึงผู้ใช้ทั้งระบบ (รวมลูกค้าทุกคน) มาแค่นับ
  const usersQ = useQuery({ queryKey: STAFF_KEY, queryFn: () => usersService.list(STAFF_PARAMS) });
  const permsQ = useQuery({ queryKey: PERMISSIONS_KEY, queryFn: () => permissionsService.list(PERMISSIONS_PARAMS) });

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

  // ── เพดานสิทธิ์ (P4 · backend permissionCeiling / ownerProtection) ──
  // คนที่ไม่ใช่ owner: บทบาทประเภท owner แก้ไม่ได้เลย · เปิด flag ได้เฉพาะที่ตัวเองมี · ปิด (ถอน) ได้ทุกช่อง
  const roleLocked = !ceiling.isOwner && selectedRole?.role_type === "owner";

  /** ติ๊กช่องนี้ "เป็นเปิด" ได้ไหม — คืนค่าเดิมที่บันทึกไว้แล้วไม่นับเป็นการให้สิทธิ์ (PATCH ส่งเฉพาะที่เปลี่ยน) */
  const canSet = (menuKey: MenuKey, field: PermField): boolean =>
    !roleLocked &&
    (ceiling.mayGrant(menuKey, field) || (!!activeRoleId && !!serverByRole[activeRoleId]?.[menuKey][field]));

  /** ปุ่มทั้งหมวด: ยังมีช่องที่เปิดได้แต่ปิดอยู่ = "เปิดทั้งหมด" · ไม่งั้น = "ปิดทั้งหมด" */
  const sectionTurnsOn = (menuKey: MenuKey): boolean =>
    !!selectedRows && PERM_FIELDS.some((f) => canSet(menuKey, f) && !selectedRows[menuKey][f]);

  const setField = (menuKey: MenuKey, field: PermField, value: boolean) => {
    if (!activeRoleId || !selectedRows || roleLocked) return;
    if (value && !canSet(menuKey, field)) return;
    patchRole(activeRoleId, {
      ...selectedRows,
      [menuKey]: { ...selectedRows[menuKey], [field]: value },
    });
  };

  const toggleSection = (menuKey: MenuKey) => {
    if (!activeRoleId || !selectedRows || roleLocked) return;
    const row = selectedRows[menuKey];
    const on = sectionTurnsOn(menuKey);
    const next = { ...row };
    // เปิด = เฉพาะช่องที่เปิดได้ · ปิด = ทุกช่อง
    for (const f of PERM_FIELDS) if (!on || canSet(menuKey, f)) next[f] = on;
    patchRole(activeRoleId, { ...selectedRows, [menuKey]: next });
  };

  // ── persist ──
  const createPerm = useMutation({ mutationFn: (b: PermissionInput) => permissionsService.create(b) });
  const updatePerm = useMutation({
    mutationFn: ({ id, b }: { id: string; b: Partial<PermissionInput> }) => permissionsService.update(id, b),
  });

  // แถวที่มีอยู่แล้ว: PATCH เฉพาะช่องที่เปลี่ยน — backend ตรวจทุก flag ที่ส่งมาเป็น true กับสิทธิ์ของผู้ทำ
  // ถ้าส่งครบ 5 ช่อง คนที่ไม่ใช่ owner จะแก้แถวที่มีช่องเกินตัวเองไม่ได้เลย แม้แค่จะถอนสิทธิ์ (P4)
  // id ของแถวอ่านจากข้อมูล server ล่าสุดก่อน (ไม่ใช่จาก overrides) — บันทึกล้มกลางทางแล้วกดบันทึกซ้ำ
  // แถวที่สร้างไปแล้วรอบก่อนจะถูก PATCH แทนการสร้างซ้ำ (เดิมได้ 409 "มีสิทธิ์ของบทบาท+เมนูนี้แล้ว" ค้างตลอด)
  async function persistRows(roleId: string, rows: RolePerms): Promise<void> {
    for (const key of PERM_MENU_KEYS) {
      const row = rows[key];
      const server = serverByRole[roleId]?.[key];
      const id = server?.id ?? row.id;
      const payload = {
        can_view: row.can_view, can_create: row.can_create, can_update: row.can_update,
        can_delete: row.can_delete, can_approve: row.can_approve,
      };
      if (id) {
        const changed = Object.fromEntries(PERM_FIELDS.filter((f) => !server?.id || server[f] !== row[f]).map((f) => [f, row[f]]));
        if (Object.keys(changed).length) await updatePerm.mutateAsync({ id, b: changed });
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

  /**
   * หลังเขียนสิทธิ์ (สำเร็จหรือล้มกลางทาง) — โหลดแถวสิทธิ์ใหม่ให้ตรงกับที่บันทึกไปจริง
   * แก้บทบาทของตัวเอง → โหลดผู้ใช้ปัจจุบันใหม่ด้วย ให้เมนู/ปุ่มเปลี่ยนตามสิทธิ์ใหม่ทันที (เดิมรอ refetch ทุก 60 วิ)
   */
  const refreshAfterWrite = (roleId: string) => {
    qc.invalidateQueries({ queryKey: ["permissions"] });
    if (roleId === user?.roleId) qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
  };

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
      alert.success(t("permissions.saveSuccess", { role: selectedRole.role_name }));
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("permissions.saveFailed"));
    } finally {
      refreshAfterWrite(activeRoleId);
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
      alert.info(t("permissions.resetSuccess"));
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("permissions.resetFailed"));
    } finally {
      refreshAfterWrite(activeRoleId);
      setSaving(false);
    }
  };

  // ── roles CRUD ──
  const onAddRole = async (values: AddRoleValues) => {
    let created: Awaited<ReturnType<typeof rolesService.create>>;
    try {
      created = await rolesService.create({
        role_name: values.role_name.trim(),
        role_type: values.role_type,
      } satisfies RoleInput);
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("permissions.createRoleFailed"));
      return false;
    }
    const newId = created.data._id;
    // สร้างตำแหน่งแล้ว — คัดลอกสิทธิ์ล้มก็ยังต้องโชว์ตำแหน่งใหม่ (เดิมขึ้น "สร้างไม่สำเร็จ" ทั้งที่สร้างไปแล้ว
    // กดสร้างซ้ำได้ 409 ชื่อซ้ำ) · บอกให้ตรวจ/บันทึกสิทธิ์ที่ขาดต่อในตาราง
    let copyError: unknown = null;
    if (values.copyFrom) {
      const src = permsOf(values.copyFrom);
      const copy = {} as RolePerms;
      for (const k of PERM_MENU_KEYS) copy[k] = { id: null, ...stripId(src[k]) };
      try {
        await persistRows(newId, copy);
      } catch (e) {
        copyError = e;
      }
    }
    await qc.invalidateQueries({ queryKey: ["roles"] });
    qc.invalidateQueries({ queryKey: ["permissions"] });
    setSelectedRoleId(newId);
    if (copyError) {
      const reason = isApiError(copyError) ? ` — ${copyError.message}` : "";
      alert.warning(t("permissions.copyPermsFailed", { role: created.data.role_name }) + reason);
    } else {
      alert.success(t("permissions.createRoleSuccess", { role: created.data.role_name }));
    }
    return true;
  };

  // แก้ชื่อตำแหน่ง — ชื่อแสดงในหน้าพนักงาน + เมนูผู้ใช้ด้วย จึงโหลด users / ผู้ใช้ปัจจุบันใหม่
  const [renaming, setRenaming] = useState(false);
  const onRenameRole = async (name: string) => {
    if (!selectedRole) return false;
    if (name === selectedRole.role_name) return true;
    setRenaming(true);
    try {
      await rolesService.rename(selectedRole._id, name);
      await qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      alert.success(t("permissions.renameRoleSuccess", { from: selectedRole.role_name, to: name }));
      return true;
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("permissions.renameRoleFailed"));
      return false;
    } finally {
      setRenaming(false);
    }
  };

  // ยืนยันแล้วที่ <ConfirmDeletePopup> ของปุ่ม "ลบบทบาท" (PermissionsView) — ไม่ถาม confirmAlert ซ้ำอีกชั้น
  // (เดิมถาม 2 ครั้ง: Popconfirm แล้วตามด้วย popup กลางจอ)
  const onDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await rolesService.remove(selectedRole._id);
      const remaining = roles.filter((r) => r._id !== selectedRole._id);
      setSelectedRoleId(remaining[0]?._id ?? null);
      qc.invalidateQueries({ queryKey: ["roles"] });
      alert.success(t("permissions.deleteRoleSuccess", { role: selectedRole.role_name }));
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("permissions.deleteRoleFailed"));
    }
  };

  return {
    perm,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: rolesQ.isPending || usersQ.isPending || permsQ.isPending,
    isError: rolesQ.isError || permsQ.isError,

    roles,
    memberCounts,
    /** สิทธิ์ที่บันทึกแล้วของทุกตำแหน่ง — ตารางภาพรวม */
    permsByRole: serverByRole,
    viewMenuCount: (roleId: string) => PERM_MENU_KEYS.filter((k) => serverByRole[roleId]?.[k].can_view).length,
    activeRoleId,
    selectedRole,
    selectedRows,
    summary,
    dirty,
    saving,

    isOwnerActor: ceiling.isOwner,
    roleLocked,
    canSet,
    sectionTurnsOn,
    /** คัดลอกสิทธิ์ได้เฉพาะจากตำแหน่งที่ไม่เกินเรา — ไม่งั้นสร้างตำแหน่งได้แต่ให้สิทธิ์ไม่ผ่าน (403 กลางทาง) */
    canCopyFrom: ceiling.roleWithin,

    selectRole: setSelectedRoleId,
    setField,
    toggleSection,
    onSave,
    onReset,
    onAddRole,
    onRenameRole,
    renaming,
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
