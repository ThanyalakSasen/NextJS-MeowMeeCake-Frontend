// MOCK (D17) — พนักงาน (role customer 1 คนไว้ทดสอบว่าถูกกรองออกจากรายชื่อ)
import type { AppUser } from "@/types/user";

export const usersFixture: AppUser[] = [
  {
    _id: "u_owner", user_fullname: "สมหญิง เจริญสุข", email: "owner@meowmeecake.local", user_phone: "081-111-1111",
    role_id: "role_owner", employment_type: "full_time", emp_status: true, emp_salary: 60000,
    start_working_date: "2024-01-01T00:00:00.000Z", last_login_at: "2026-09-02T01:00:00.000Z",
    created_at: "2024-01-01T00:00:00.000Z", updated_at: "2026-09-02T01:00:00.000Z",
  },
  {
    _id: "u_manager", user_fullname: "อนุชา วงศ์ทอง", email: "anucha@meowmeecake.local", user_phone: "081-222-2222",
    role_id: "role_manager", employment_type: "full_time", emp_status: true, emp_salary: 35000,
    start_working_date: "2024-03-15T00:00:00.000Z", last_login_at: "2026-09-01T18:30:00.000Z",
    created_at: "2024-03-15T00:00:00.000Z", updated_at: "2026-09-01T18:30:00.000Z",
  },
  {
    _id: "u_baker1", user_fullname: "กานดา แสงเพชร", email: "kanda@meowmeecake.local", user_phone: "081-333-3333",
    role_id: "role_baker", employment_type: "full_time", emp_status: true, emp_salary: 20000,
    start_working_date: "2024-06-01T00:00:00.000Z", last_login_at: "2026-09-02T07:15:00.000Z",
    created_at: "2024-06-01T00:00:00.000Z", updated_at: "2026-09-02T07:15:00.000Z",
  },
  {
    _id: "u_baker2", user_fullname: "วิชัย ศรีสมบัติ", email: "wichai@meowmeecake.local", user_phone: "081-444-4444",
    role_id: "role_baker", employment_type: "part_time", emp_status: true, emp_salary: 12000,
    start_working_date: "2025-02-10T00:00:00.000Z", last_login_at: "2026-09-01T09:00:00.000Z",
    created_at: "2025-02-10T00:00:00.000Z", updated_at: "2026-09-01T09:00:00.000Z",
  },
  {
    _id: "u_cashier1", user_fullname: "ปิยะดา ทองคำ", email: "piyada@meowmeecake.local", user_phone: "081-555-5555",
    role_id: "role_cashier", employment_type: "full_time", emp_status: true, emp_salary: 15000,
    start_working_date: "2024-09-20T00:00:00.000Z", last_login_at: "2026-09-02T08:00:00.000Z",
    created_at: "2024-09-20T00:00:00.000Z", updated_at: "2026-09-02T08:00:00.000Z",
  },
  {
    _id: "u_cashier2", user_fullname: "ธนกร บุญรอด", email: "thanakorn@meowmeecake.local", user_phone: "081-666-6666",
    role_id: "role_cashier", employment_type: "part_time", emp_status: true, emp_salary: 9000,
    start_working_date: "2025-05-01T00:00:00.000Z", last_login_at: "2026-08-30T16:00:00.000Z",
    created_at: "2025-05-01T00:00:00.000Z", updated_at: "2026-08-30T16:00:00.000Z",
  },
  {
    _id: "u_baker3", user_fullname: "มณีรัตน์ ใจงาม", email: "maneerat@meowmeecake.local", user_phone: "081-777-7777",
    role_id: "role_baker", employment_type: "full_time", emp_status: false, emp_salary: 18000,
    start_working_date: "2024-02-01T00:00:00.000Z", last_working_date: "2026-06-30T00:00:00.000Z",
    last_login_at: "2026-06-29T17:00:00.000Z",
    created_at: "2024-02-01T00:00:00.000Z", updated_at: "2026-06-30T00:00:00.000Z",
  },
  {
    _id: "u_customer", user_fullname: "ลูกค้าทดสอบ", email: "cust@example.com", user_phone: "089-000-0000",
    role_id: "role_customer", emp_status: false,
    created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T00:00:00.000Z",
  },
];
