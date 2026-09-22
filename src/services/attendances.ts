// เรียก endpoint /admin/attendances — list + check-in/check-out (endpoint พิเศษ)
// backend ไม่มี GET .../today เลย (เช็คจาก route.ts จริงแล้ว) — "วันนี้" ของตัวเองต้องยิง list
// เจาะจง ?user_id=<ตัวเอง>&work_date=<วันนี้ตามเวลาไทย> แทน (ไม่งั้น middleware มองว่าอยากดูของคนอื่น
// แล้วเรียก requirePermission("employees","view") ซึ่งพนักงานทั่วไปไม่มี — ดู admin/attendances/route.ts)
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { Attendance, AttendanceListParams } from "@/types/attendance";

const BASE = "/admin/attendances";

/** วันที่วันนี้ตามเวลาไทย รูปแบบ "YYYY-MM-DD" (ต้องตรงกับ bangkokDateString ฝั่ง backend) */
function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const attendancesService = {
  list: (params: AttendanceListParams = {}) => http.getList<Attendance>(BASE, { params }),
  today: async (userId: string): Promise<ItemResponse<Attendance | null>> => {
    const res = await http.getList<Attendance>(BASE, {
      params: { user_id: userId, work_date: bangkokToday(), limit: 1 },
    });
    return { data: res.data[0] ?? null };
  },
  checkIn: () => http.post<ItemResponse<Attendance>>(`${BASE}/check-in`, {}),
  checkOut: () => http.post<ItemResponse<Attendance>>(`${BASE}/check-out`, {}),
};
