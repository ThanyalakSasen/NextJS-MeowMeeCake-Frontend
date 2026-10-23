// ─────────────────────────────────────────────────────────────
// employeesQuery.ts — pure: query key/params ของหน้ารายชื่อพนักงาน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import dayjs from "dayjs";
import { LIST_ALL } from "@/lib/http";
import type { UserLogAction } from "@/constants/enumConfig";

/** เจ้าของ + พนักงานเท่านั้น — กรองที่ backend (key แยก ["users","staff"] — ดูเหตุผลใน useEmployeesViewModel) */
export const STAFF_PARAMS = { limit: LIST_ALL, role_type: "owner,staff" };
export const STAFF_KEY = ["users", "staff"] as const;
export const ROLES_KEY = ["roles"] as const;
/** แถวสิทธิ์ทั้งหมด (หน้าสิทธิ์ + เพดานสิทธิ์ usePermissionCeiling) */
export const PERMISSIONS_PARAMS = { limit: LIST_ALL };
export const PERMISSIONS_KEY = ["permissions"] as const;
// ── บันทึกการทำงาน (userLog) — แบ่งหน้าที่ backend ──
// เดิมดึงทุกรายการ (หลายร้อย = หลายหน้า × ตัวเติมชื่อของ backend ต่อหน้า) ไม่ทันเพดาน 2.5 วิ ของ prefetch ฝั่ง server
// → หน้าว่างรอแล้ว browser ดึงซ้ำเอง · ตอนนี้ดึงทีละหน้า + นับสถิติด้วย meta.total (limit 1) — ยิงรอบเดียวทุกก้อน

export const USER_LOG_PAGE_SIZE = 10;

export interface UserLogFilters {
  employeeId: string; // "all" = ทุกคน
  actionType: "all" | UserLogAction;
  /** ISO ขอบเขตวันที่ (เริ่มวัน/สิ้นวันตามเวลาไทย) · null = ไม่กรอง */
  dateFrom: string | null;
  dateTo: string | null;
}

export const NO_USER_LOG_FILTERS: UserLogFilters = { employeeId: "all", actionType: "all", dateFrom: null, dateTo: null };

/** ตัวกรองที่ backend รองรับ (user_id · action_type · date_from/date_to) — ค้นหาข้อความ backend ไม่รองรับ (ดู ViewModel) */
export function userLogFilterParams(f: UserLogFilters) {
  return {
    user_id: f.employeeId === "all" ? undefined : f.employeeId,
    action_type: f.actionType === "all" ? undefined : f.actionType,
    date_from: f.dateFrom ?? undefined,
    date_to: f.dateTo ?? undefined,
  };
}

export const userLogPageParams = (f: UserLogFilters, page: number, pageSize: number) => ({
  ...userLogFilterParams(f),
  page,
  limit: pageSize,
});
export const userLogPageKey = (params: ReturnType<typeof userLogPageParams>) => ["user-logs", "page", params] as const;

/** ทั้งหมดที่ตรงตัวกรอง — ใช้ตอนค้นหาข้อความ (กรองฝั่ง browser) และตอนส่งออก CSV */
export const userLogAllParams = (f: UserLogFilters) => ({ ...userLogFilterParams(f), limit: LIST_ALL });
export const userLogAllKey = (params: ReturnType<typeof userLogAllParams>) => ["user-logs", "all", params] as const;

/** ช่วง "วันนี้" — เวลาเครื่อง (server ตั้ง TZ เป็นเวลาไทยแล้ว · browser ผู้ใช้อยู่ไทย) → key ตรงกันทั้งสองฝั่ง */
export const userLogTodayRange = () => ({ from: dayjs().startOf("day").toISOString(), to: dayjs().endOf("day").toISOString() });

/** การ์ดสถิติ — นับจาก meta.total (ขอแค่ 1 รายการ) · today = ช่วงวันนี้ ISO (server ตั้ง TZ เป็นเวลาไทยแล้ว — instrumentation.ts) */
export function userLogCountQueries(today: { from: string; to: string }) {
  const p = {
    total: { limit: 1 },
    today: { limit: 1, date_from: today.from, date_to: today.to },
    update: { limit: 1, action_type: "UPDATE" as const },
    remove: { limit: 1, action_type: "DELETE" as const },
  };
  return (Object.keys(p) as (keyof typeof p)[]).map((k) => ({ k, params: p[k], key: ["user-logs", "count", p[k]] as const }));
}
/** พนักงาน 1 คน (หน้าแก้ไข) — key แยกจากรายการ (ดู useEditEmployeeViewModel) */
export const userKey = (id: string) => ["user", id] as const;
