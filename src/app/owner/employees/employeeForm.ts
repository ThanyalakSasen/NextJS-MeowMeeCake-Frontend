// ─────────────────────────────────────────────────────────────
// employeeForm.ts — helper ล้วนของฟอร์มพนักงาน (ใช้ร่วม Add / Edit)
// validation ทำที่ <FormItem rules={...}> ใน EmployeeFormFields (antd Form)
// วันที่: ในฟอร์มเก็บเป็น Dayjs (antd DatePicker) · แปลงเป็น ISO string ตอน toInput
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { AppUser, AppUserInput, EmploymentType } from "@/types/user";

export interface EmployeeFormValue {
  user_fullname: string;
  email?: string;
  user_phone?: string;
  role_id?: string;
  employment_type: EmploymentType;
  emp_salary?: number;
  start_working_date?: Dayjs | null;
  last_working_date?: Dayjs | null;
  /** true = กำลังทำงาน · false = พ้นสภาพ */
  emp_status: boolean;
}

/** ค่าเริ่มต้นตอนเพิ่มพนักงานใหม่ (antd Form initialValues) */
export const emptyEmployeeForm: EmployeeFormValue = {
  user_fullname: "",
  employment_type: "full_time",
  emp_status: true,
};

/** AppUser (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromUser(u: AppUser): EmployeeFormValue {
  return {
    user_fullname: u.user_fullname,
    email: u.email,
    user_phone: u.user_phone ?? undefined,
    role_id: u.role_id ?? undefined,
    employment_type: u.employment_type ?? "full_time",
    emp_salary: u.emp_salary,
    start_working_date: u.start_working_date ? dayjs(u.start_working_date) : null,
    last_working_date: u.last_working_date ? dayjs(u.last_working_date) : null,
    emp_status: u.emp_status,
  };
}

/** ค่าจากฟอร์ม → body ที่ส่งเข้า API */
export function toInput(v: EmployeeFormValue): AppUserInput {
  return {
    user_fullname: v.user_fullname.trim(),
    email: v.email?.trim() || undefined,
    user_phone: v.user_phone?.trim() || null,
    role_id: v.role_id || null,
    employment_type: v.employment_type,
    emp_salary: v.emp_salary,
    emp_status: v.emp_status,
    start_working_date: v.start_working_date ? v.start_working_date.toISOString() : undefined,
    last_working_date: v.last_working_date ? v.last_working_date.toISOString() : undefined,
  };
}
