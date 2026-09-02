// ─────────────────────────────────────────────────────────────
// src/types/attendance.ts — DTO ของ /attendances
// 1 เอกสาร ต่อ 1 คน ต่อ 1 วันทำงาน (work_date "YYYY-MM-DD")
// หน้า /owner/attendance = พนักงานที่ login เช็คอิน/เช็คเอาท์ของตัวเอง (login-only ไม่ผูก menu_key)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { AttendanceStatus } from "@/constants/enumConfig";

export interface Attendance {
  _id: string;
  user_id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  note?: string;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceListParams extends ListParams {
  user_id?: string;
}
