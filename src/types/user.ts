// ─────────────────────────────────────────────────────────────
// src/types/user.ts — DTO ของ /users (docs/API_CONTRACT.md §3) — พนักงาน/ผู้ใช้ระบบ
// (ต่างจาก CurrentUser ใน types/auth.ts ที่มาจาก GET /auth/me)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

export type EmploymentType = "full_time" | "part_time";

export interface AppUser {
  _id: string;
  user_fullname: string;
  email?: string;
  user_phone?: string | null;
  role_id?: string | null;
  employment_type?: EmploymentType;
  /** true = กำลังทำงาน · false = พ้นสภาพ — แค่สถานะการจ้างงาน "ไม่ใช่" ตัวคุมสิทธิ์ login */
  emp_status: boolean;
  /** true = login ได้ปกติ · false = ถูกระงับ (backend เช็คจากตัวนี้ตอน login เท่านั้น ไม่ใช่ emp_status) */
  is_active: boolean;
  emp_salary?: number;
  start_working_date?: string;
  last_working_date?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type AppUserInput = Omit<AppUser, "_id" | "created_at" | "updated_at">;

/**
 * body เฉพาะตอน POST /admin/users (สร้างพนักงานใหม่) — backend (schemas/user.ts createUserBody)
 * บังคับ auth_provider เสมอ (ไม่มี default) + password ถ้าเป็น local — โปรเจกต์นี้สร้างพนักงานแบบ
 * local เท่านั้น (ไม่มีหน้า invite ผ่าน Google) จึง fix auth_provider ไว้เลย
 */
export type CreateAppUserInput = AppUserInput & {
  auth_provider: "local";
  password: string;
};

export interface UserListParams extends ListParams {
  role_id?: string;
  /** กรองตามประเภทบทบาทที่ backend (csv) เช่น "owner,staff" = พนักงานทั้งหมด ไม่รวมลูกค้า */
  role_type?: string;
  emp_status?: boolean;
}
