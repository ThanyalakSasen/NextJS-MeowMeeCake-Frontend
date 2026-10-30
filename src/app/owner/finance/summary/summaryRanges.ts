// ─────────────────────────────────────────────────────────────
// summaryRanges.ts — pure: ช่วงเวลา + query key ของหน้าสรุปกำไร-ขาดทุน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) → key ตรงกันเป๊ะ
// ต้องอยู่ไฟล์ที่ไม่มี "use client" — server เรียกฟังก์ชันจากไฟล์ client ไม่ได้
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import { getMonthWeeks, getRangeStartEnd, type PeriodType } from "@/utils/period";

export const revenueKey = (from: string, to: string) => ["reports", "revenue-by-channel", from, to] as const;

export interface TrendBucket {
  key: string;
  start: Dayjs;
  end: Dayjs;
  from: string;
  to: string;
}

/**
 * ช่วงในตารางเปรียบเทียบ (ช่วงเก่าอยู่บน ใหม่อยู่ล่าง)
 * รายวัน = ทุกวันตั้งแต่วันที่ 1 ของเดือนที่เลือก (เดือนปัจจุบันแสดงถึงวันนี้)
 * รายสัปดาห์ = ทุกสัปดาห์ในเดือนที่เลือก เริ่มตั้งแต่วันที่ 1 (1–7, 8–14, 15–21, 22–28, 29–สิ้นเดือน) ไม่ทะลุข้ามเดือน
 * รายเดือน = ม.ค. ถึงเดือนปัจจุบันของปีที่เลือก (ปีที่ผ่านไปแล้ว = ครบ ธ.ค.) · รายไตรมาส = Q1 ถึงไตรมาสปัจจุบัน แบบเดียวกัน
 *   — ไม่สร้างเดือน/ไตรมาสที่ยังไม่ถึง (เดิมได้แถวศูนย์ที่ดูเหมือนข้อมูลจริง + ยิง request เปล่า)
 * รายปี = ทุกปี ตั้งแต่ปีแรกที่มีค่าใช้จ่ายบันทึก (firstExpenseYear) หรือปีที่เลือก ถ้าเก่ากว่า ถึงปีปัจจุบัน (หรือปีที่เลือก ถ้าเลือกไกลกว่า)
 */
export function trendBuckets(period: PeriodType, selectedDate: Dayjs, firstExpenseYear = Infinity): TrendBucket[] {
  const now = dayjs();
  if (period === "day") {
    const monthStart = selectedDate.startOf("month");
    const daysInMonth = selectedDate.daysInMonth();
    const lastDay =
      selectedDate.isBefore(now, "month") ? daysInMonth
      : selectedDate.isSame(now, "month") ? Math.min(now.date(), daysInMonth)
      : daysInMonth;
    return Array.from({ length: lastDay }, (_, i) => {
      const d = monthStart.date(i + 1);
      const from = d.startOf("day");
      const to = d.endOf("day");
      return { key: from.toISOString(), start: from, end: to, from: from.toISOString(), to: to.toISOString() };
    });
  }
  if (period === "week") {
    return getMonthWeeks(selectedDate).map((w) => ({
      key: w.start.toISOString(),
      start: w.start,
      end: w.end,
      from: w.start.toISOString(),
      to: w.end.toISOString(),
    }));
  }
  const yearStart = selectedDate.startOf("year");
  // เดือนสุดท้าย (0–11) ของรายเดือน/รายไตรมาส — รวมเดือนที่เลือกเสมอ แม้เลือกล่วงหน้า
  const lastMonth =
    selectedDate.year() < now.year() ? 11
    : selectedDate.year() === now.year() ? Math.max(now.month(), selectedDate.month())
    : selectedDate.month();
  let anchors: Dayjs[];
  if (period === "month") anchors = Array.from({ length: lastMonth + 1 }, (_, i) => yearStart.add(i, "month"));
  else if (period === "quarter") anchors = Array.from({ length: Math.floor(lastMonth / 3) + 1 }, (_, i) => yearStart.add(i * 3, "month"));
  else {
    const last = Math.max(now.year(), selectedDate.year());
    const first = Math.min(firstExpenseYear, selectedDate.year(), last);
    anchors = Array.from({ length: last - first + 1 }, (_, i) => yearStart.year(first + i));
  }
  return anchors.map((anchor) => {
    const [from, to] = getRangeStartEnd(period, anchor);
    return { key: from.toISOString(), start: from, end: to, from: from.toISOString(), to: to.toISOString() };
  });
}
