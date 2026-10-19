// ─────────────────────────────────────────────────────────────
// employeesQuery.ts — pure: query key/params ของหน้ารายชื่อพนักงาน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

/** เจ้าของ + พนักงานเท่านั้น — กรองที่ backend (key แยก ["users","staff"] — ดูเหตุผลใน useEmployeesViewModel) */
export const STAFF_PARAMS = { limit: LIST_ALL, role_type: "owner,staff" };
export const STAFF_KEY = ["users", "staff"] as const;
export const ROLES_KEY = ["roles"] as const;
/** แถวสิทธิ์ทั้งหมด (หน้าสิทธิ์ + เพดานสิทธิ์ usePermissionCeiling) */
export const PERMISSIONS_PARAMS = { limit: LIST_ALL };
export const PERMISSIONS_KEY = ["permissions"] as const;
/** บันทึกการทำงาน + ผู้ใช้ทั้งหมด (เติมชื่อผู้ทำรายการ — บันทึกมีของลูกค้าด้วย เช่น LOGIN จึงใช้ทั้งระบบ ไม่ใช่แค่พนักงาน) */
export const USER_LOGS_PARAMS = { limit: LIST_ALL };
export const USER_LOGS_KEY = ["user-logs"] as const;
export const ALL_USERS_PARAMS = { limit: LIST_ALL };
export const ALL_USERS_KEY = ["users"] as const;
/** พนักงาน 1 คน (หน้าแก้ไข) — key แยกจากรายการ (ดู useEditEmployeeViewModel) */
export const userKey = (id: string) => ["user", id] as const;
