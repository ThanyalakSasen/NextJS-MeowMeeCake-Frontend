// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/attendances.ts — /attendances/* (endpoint พิเศษ)
// check-in / check-out / today ทำงานกับผู้ใช้ mock ปัจจุบัน (MOCK_USER)
// ไม่ใช้ crudHandlers เพราะ :id GET จะไปชนกับ /attendances/today
// ─────────────────────────────────────────────────────────────
import { http, HttpResponse } from "msw";
import { list, create, update } from "@/mocks/db";
import { MOCK_USER } from "@/mocks/fixtures/auth";
import type { Attendance } from "@/types/attendance";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** มาสายถ้าเช็คอินหลัง 09:00 น. (เวลาเครื่อง) */
const statusFor = (iso: string): Attendance["status"] =>
  new Date(iso).getHours() >= 9 && !(new Date(iso).getHours() === 9 && new Date(iso).getMinutes() === 0)
    ? "มาสาย"
    : "มาทำงาน";

function findTodayRow(): Attendance | undefined {
  const rows = list("attendances", new URL(`${API || "http://mock"}/attendances?limit=100`))
    .data as unknown as Attendance[];
  return rows.find((r) => r.user_id === MOCK_USER.id && r.work_date === todayStr());
}

export const attendanceHandlers = [
  http.get(`${API}/attendances/today`, () => HttpResponse.json({ data: findTodayRow() ?? null })),

  http.post(`${API}/attendances/check-in`, () => {
    const existing = findTodayRow();
    if (existing?.check_in_at) {
      return HttpResponse.json({ message: "already checked in" }, { status: 400 });
    }
    const now = new Date().toISOString();
    if (existing) {
      return HttpResponse.json({
        data: update("attendances", existing._id, { check_in_at: now, status: statusFor(now) }),
      });
    }
    return HttpResponse.json(
      {
        data: create("attendances", {
          user_id: MOCK_USER.id,
          work_date: todayStr(),
          check_in_at: now,
          check_out_at: null,
          status: statusFor(now),
          note: "",
          recorded_by: MOCK_USER.id,
        }),
      },
      { status: 201 },
    );
  }),

  http.post(`${API}/attendances/check-out`, () => {
    const existing = findTodayRow();
    if (!existing?.check_in_at) {
      return HttpResponse.json({ message: "not checked in" }, { status: 400 });
    }
    if (existing.check_out_at) {
      return HttpResponse.json({ message: "already checked out" }, { status: 400 });
    }
    return HttpResponse.json({
      data: update("attendances", existing._id, { check_out_at: new Date().toISOString() }),
    });
  }),

  http.get(`${API}/attendances`, ({ request }) =>
    HttpResponse.json(list("attendances", new URL(request.url))),
  ),
];
