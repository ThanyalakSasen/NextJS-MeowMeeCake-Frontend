// ─────────────────────────────────────────────────────────────
// expensesQuery.ts — pure: query key/params ค่าใช้จ่าย (หน้าบันทึกค่าใช้จ่าย + สรุปกำไร-ขาดทุน)
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// เดิมโหลดทุกรายการ (เพดาน LIST_ALL 1,000) แล้วกรอง/รวมในเครื่อง — เกินเพดานรายการเก่าหายเงียบ ยอดรวมผิด
// และกรองเดือนด้วย date.startsWith("YYYY-MM") (เวลา UTC) รายการต้นเดือนก่อน 7 โมงไปโผล่เดือนก่อนหน้า
// ตอนนี้ให้ backend กรองช่วงวันที่ (เวลาไทยจาก getRangeStartEnd) / รวมยอดให้ · ทุก key ขึ้นต้นด้วย "expenses"
// (บันทึก/ลบแล้ว invalidate ["expenses"] ทีเดียวครบ)
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

/** รายการของเดือนที่เลือก — เดือนเดียวไม่ถึงเพดาน LIST_ALL */
export const expensesRangeKey = (from: string, to: string) => ["expenses", "list", from, to] as const;
export const expensesRangeParams = (from: string, to: string) => ({ date_from: from, date_to: to, limit: LIST_ALL });

/** รายจ่ายประจำทั้งหมด (ทุกเดือน) — ใช้คำนวณวันครบกำหนดรอบถัดไป */
export const RECURRING_EXPENSES_KEY = ["expenses", "recurring"] as const;
export const RECURRING_EXPENSES_PARAMS = { is_recurring: true, limit: LIST_ALL };

/** ยอดรวมตามหมวดในช่วง (GET /admin/expenses/summary) */
export const expenseSummaryKey = (from: string, to: string) => ["expenses", "summary", from, to] as const;

/** ค่าใช้จ่ายรายการแรกสุด — ปีแรกของตารางรายปี · ตัดปีที่พิมพ์ผิด (เช่น 0202) ด้วย date_from */
export const FIRST_EXPENSE_KEY = ["expenses", "first"] as const;
export const FIRST_EXPENSE_PARAMS = { date_from: "2000-01-01T00:00:00.000Z", sortBy: "date", sortOrder: "asc", limit: 1 } as const;
