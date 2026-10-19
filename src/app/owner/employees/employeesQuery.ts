// ─────────────────────────────────────────────────────────────
// employeesQuery.ts — pure: query key/params ของหน้ารายชื่อพนักงาน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

/** เจ้าของ + พนักงานเท่านั้น — กรองที่ backend (key แยก ["users","staff"] — ดูเหตุผลใน useEmployeesViewModel) */
export const STAFF_PARAMS = { limit: LIST_ALL, role_type: "owner,staff" };
export const STAFF_KEY = ["users", "staff"] as const;
export const ROLES_KEY = ["roles"] as const;
