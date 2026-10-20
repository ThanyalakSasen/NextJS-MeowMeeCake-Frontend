"use client";
// ─────────────────────────────────────────────────────────────
// usePermissionCeiling — คนที่ไม่ใช่ owner ให้หรือจัดการได้ไม่เกินสิทธิ์ที่ตัวเองมี (Final-Backlog P4)
// สำเนากติกาของ backend services/permissionCeiling.ts + ownerProtection.ts ไว้ซ่อน/ปิดปุ่มที่กดแล้วจะได้ 403
//   - roleWithin(roleId): สิทธิ์ของบทบาทนั้นไม่เกินของเรา (บทบาท owner = ทุกอย่าง → ไม่ใช่ owner จะเกินเสมอ)
//   - mayGrant(menuKey, field): เรามี flag นี้ในเมนูนี้ → เปิดให้คนอื่นได้ (ถอนสิทธิ์ไม่จำกัด)
// UX เท่านั้น — ตัวบังคับจริงคือ backend · ยังโหลดไม่เสร็จ = ปิด (fail closed) ยกเว้น owner ที่ผ่านทุกอย่าง
// ─────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { rolesService } from "@/services/roles";
import { permissionsService } from "@/services/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isUnrestrictedRole, type MenuKey } from "@/constants/menuKeys";
import type { Permission } from "@/types/permission";
import { PERM_FIELDS, PERM_MENU_KEYS, type PermField } from "./permissions/permissionGroups";
import { PERMISSIONS_KEY, PERMISSIONS_PARAMS, ROLES_KEY } from "./employeesQuery";

/** "can_view" → "view" (ชื่อ field ใน MenuAccess ของ /auth/me) */
const accessField = (f: PermField) => f.slice(4) as "view" | "create" | "update" | "delete" | "approve";

/** แถวที่มีผลอยู่ตอนนี้ — ตรงกับ backend getEffectivePermissions (ตัดที่หมดอายุออก) */
const isEffective = (p: Permission, now: number) => !p.expires_at || new Date(p.expires_at).getTime() > now;

export function usePermissionCeiling() {
  const { user } = useCurrentUser();
  const isOwner = isUnrestrictedRole(user?.roleType);

  // key + queryFn เดียวกับหน้าสิทธิ์/หน้าพนักงาน — ใช้แคชร่วมกัน · owner ไม่ต้องโหลดแถวสิทธิ์
  const rolesQ = useQuery({ queryKey: ROLES_KEY, queryFn: () => rolesService.list(), enabled: !!user && !isOwner });
  const permsQ = useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: () => permissionsService.list(PERMISSIONS_PARAMS),
    enabled: !!user && !isOwner,
  });

  const ready = !!user && (isOwner || (!!rolesQ.data && !!permsQ.data));

  /** roleId → จำนวน flag ที่บทบาทนั้นมีแต่เราไม่มี (0 = ไม่เกินเรา) */
  const beyondByRole = useMemo(() => {
    const out = new Map<string, number>();
    if (!user || isOwner || !rolesQ.data || !permsQ.data) return out;
    const mine = user.menuAccess;
    // เวลาที่โหลดแถวสิทธิ์มา (ไม่ใช้ Date.now() ระหว่าง render — react-hooks/purity) · หมดอายุระหว่างเปิดหน้า = backend ตัดสินเอง
    const now = permsQ.dataUpdatedAt;
    const missing = (has: (k: MenuKey, f: PermField) => boolean) => {
      let n = 0;
      for (const k of PERM_MENU_KEYS) for (const f of PERM_FIELDS) if (has(k, f) && !mine[k]?.[accessField(f)]) n++;
      return n;
    };
    for (const role of rolesQ.data.data) {
      if (role.role_type === "owner") {
        out.set(role._id, missing(() => true));
        continue;
      }
      const rows = permsQ.data.data.filter((p) => p.role_id === role._id && isEffective(p, now));
      out.set(role._id, missing((k, f) => rows.some((p) => p.menu_key === k && p[f])));
    }
    return out;
  }, [user, isOwner, rolesQ.data, permsQ.data, permsQ.dataUpdatedAt]);

  /** บทบาทนี้ไม่เกินสิทธิ์ของเรา — ไม่มีบทบาท / ไม่พบในรายการ = ปล่อยให้ backend ตัดสิน (backend ก็ข้ามเหมือนกัน) */
  const roleWithin = (roleId: string | null | undefined): boolean => {
    if (isOwner) return true;
    if (!ready) return false;
    return !roleId || (beyondByRole.get(roleId) ?? 0) === 0;
  };

  return {
    isOwner,
    roleWithin,
    /** เปิด flag นี้ให้คนอื่นได้ไหม */
    mayGrant: (menuKey: MenuKey, field: PermField): boolean =>
      isOwner || !!user?.menuAccess[menuKey]?.[accessField(field)],
    /** จัดการบัญชีนี้ได้ไหม (แก้ / ตั้งรหัสผ่าน / ปลดล็อก / ลบ) — บัญชีตัวเองไม่ตรวจบทบาทปัจจุบัน (backend เช่นกัน) */
    mayManageUser: (userId: string, roleId: string | null | undefined): boolean =>
      (!!user && userId === user.id) || roleWithin(roleId),
  };
}
