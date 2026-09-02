// เรียก endpoint /attendances — list + check-in/check-out/today (endpoint พิเศษ)
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse } from "@/types/api";
import type { Attendance, AttendanceListParams } from "@/types/attendance";

const BASE = "/attendances";

export const attendancesService = {
  list: (params: AttendanceListParams = {}) => http.get<ListResponse<Attendance>>(BASE, { params }),
  today: () => http.get<ItemResponse<Attendance | null>>(`${BASE}/today`),
  checkIn: () => http.post<ItemResponse<Attendance>>(`${BASE}/check-in`, {}),
  checkOut: () => http.post<ItemResponse<Attendance>>(`${BASE}/check-out`, {}),
};
