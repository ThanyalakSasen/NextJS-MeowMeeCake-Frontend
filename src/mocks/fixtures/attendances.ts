// MOCK (D17) — ประวัติการเข้างานของผู้ใช้ mock ปัจจุบัน (MOCK_USER.id = "mock-user-owner")
// หน้า /owner/attendance โชว์เฉพาะรายการของตัวเอง · "วันนี้" (2026-09-02) เว้นไว้ให้กดเช็คอินเอง
import type { Attendance } from "@/types/attendance";

const T = "2026-08-01T00:00:00.000Z";
const UID = "mock-user-owner";

const rec = (
  date: string,
  inH: string | null,
  outH: string | null,
  status: Attendance["status"],
): Attendance => ({
  _id: `att_${date}`,
  user_id: UID,
  work_date: date,
  check_in_at: inH ? `${date}T${inH}:00.000Z` : null,
  check_out_at: outH ? `${date}T${outH}:00.000Z` : null,
  status,
  note: "",
  recorded_by: UID,
  created_at: T,
  updated_at: T,
});

export const attendancesFixture: Attendance[] = [
  rec("2026-09-01", "08:52", "17:30", "มาทำงาน"),
  rec("2026-08-29", "09:14", "17:45", "มาสาย"),
  rec("2026-08-28", "08:47", "17:20", "มาทำงาน"),
  rec("2026-08-27", "08:55", "17:35", "มาทำงาน"),
  rec("2026-08-26", null, null, "ลาป่วย"),
  rec("2026-08-25", "08:40", "17:10", "มาทำงาน"),
  rec("2026-08-22", "09:05", "16:50", "มาสาย"),
  rec("2026-08-21", "08:58", "17:40", "มาทำงาน"),
  rec("2026-08-20", null, null, "ลากิจ"),
  rec("2026-08-19", "08:49", "17:25", "มาทำงาน"),
];
