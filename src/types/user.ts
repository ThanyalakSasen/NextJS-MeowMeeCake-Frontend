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
  /** true = กำลังทำงาน · false = พ้นสภาพ */
  emp_status: boolean;
  emp_salary?: number;
  start_working_date?: string;
  last_working_date?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type AppUserInput = Omit<AppUser, "_id" | "created_at" | "updated_at">;

export interface UserListParams extends ListParams {
  role_id?: string;
  emp_status?: boolean;
}
