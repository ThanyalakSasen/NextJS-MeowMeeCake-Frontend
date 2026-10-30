// ─────────────────────────────────────────────────────────────
// src/utils/period.ts — pure: ช่วงเวลา day/week/month/quarter/year → [start, end]
// ใช้ร่วมกัน ≥ 2 หน้า (Finance P&L, Sales Report) — ย้ายมาจาก finance/summary/financePeriod.ts เดิม
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

export type PeriodType = "day" | "week" | "month" | "quarter" | "year";
export const PERIOD_TYPES: PeriodType[] = ["day", "week", "month", "quarter", "year"];

/**
 * สัปดาห์ภายในเดือนที่เลือก เริ่มตั้งแต่วันที่ 1 เป็นต้นไป (1–7, 8–14, 15–21, 22–28, 29–สิ้นเดือน)
 * ไม่ทะลุข้ามไปเดือนก่อนหน้าหรือเดือนถัดไป
 */
export function getMonthWeekStartEnd(picker: Dayjs): [Dayjs, Dayjs] {
  const startDay = Math.floor((picker.date() - 1) / 7) * 7 + 1;
  const endDay = Math.min(startDay + 6, picker.daysInMonth());
  const monthStart = picker.startOf("month");
  return [monthStart.date(startDay).startOf("day"), monthStart.date(endDay).endOf("day")];
}

/** รายการสัปดาห์ทั้งหมดภายในเดือนของวันที่ที่เลือก (เริ่มวันที่ 1 ของเดือน ไม่ข้ามเดือน) */
export function getMonthWeeks(picker: Dayjs): Array<{ index: number; start: Dayjs; end: Dayjs }> {
  const monthStart = picker.startOf("month");
  const daysInMonth = picker.daysInMonth();
  const now = dayjs();
  const maxStartDay =
    picker.isBefore(now, "month") ? daysInMonth
    : picker.isSame(now, "month") ? Math.min(now.date(), daysInMonth)
    : daysInMonth;
  const weeks: Array<{ index: number; start: Dayjs; end: Dayjs }> = [];
  for (let startDay = 1, idx = 0; startDay <= maxStartDay; startDay += 7, idx++) {
    const endDay = Math.min(startDay + 6, daysInMonth);
    weeks.push({
      index: idx,
      start: monthStart.date(startDay).startOf("day"),
      end: monthStart.date(endDay).endOf("day"),
    });
  }
  return weeks;
}

export function getRangeStartEnd(period: PeriodType, picker: Dayjs): [Dayjs, Dayjs] {
  if (period === "day") return [picker.startOf("day"), picker.endOf("day")];
  if (period === "week") return getMonthWeekStartEnd(picker);
  if (period === "month") return [picker.startOf("month"), picker.endOf("month")];
  if (period === "quarter") return [picker.startOf("quarter"), picker.endOf("quarter")];
  return [picker.startOf("year"), picker.endOf("year")];
}

/** เลื่อนไปช่วงก่อนหน้า (-1) / ถัดไป (1) ตามชนิดช่วง · รายสัปดาห์เลื่อนเฉพาะภายในเดือนที่เลือก ไม่ข้ามเดือน */
export function shiftPeriod(period: PeriodType, date: Dayjs, step: 1 | -1): Dayjs {
  if (period === "week") {
    const weeks = getMonthWeeks(date);
    if (weeks.length === 0) return date;
    const currentIdx = Math.min(Math.floor((date.date() - 1) / 7), weeks.length - 1);
    const nextIdx = currentIdx + step;
    if (nextIdx < 0 || nextIdx >= weeks.length) return date;
    return weeks[nextIdx].start;
  }
  return period === "quarter" ? date.add(step, "quarter") : date.add(step, period);
}

/** a กับ b อยู่ในช่วงเดียวกันไหม (เช่น เดือนเดียวกัน) — ใช้ปิดปุ่ม "เดือนนี้" เมื่ออยู่ช่วงปัจจุบันแล้ว */
export function isSamePeriod(period: PeriodType, a: Dayjs, b: Dayjs): boolean {
  return getRangeStartEnd(period, a)[0].isSame(getRangeStartEnd(period, b)[0]);
}

/** antd <DatePicker picker=...> ที่สอดคล้องกับ period ที่เลือก */
export function pickerTypeFor(period: PeriodType): "date" | "week" | "month" | "quarter" | "year" {
  return period === "day" ? "date" : period;
}

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * [ต้นเดือน, สิ้นเดือน] ของเดือนปัจจุบัน "ตามเวลาไทย" เป็น ISO — ใช้ฝั่ง server (UTC) ตอน prefetch
 * ให้ได้ค่าเดียวกับ getRangeStartEnd("month", dayjs()) ที่ browser ในไทยคำนวณ → query key ตรงกัน ไม่ดึงซ้ำ
 * monthOffset = เลื่อนเดือน (-1 = เดือนก่อน)
 */
export function bangkokMonthRangeIso(monthOffset = 0): [string, string] {
  const bkk = new Date(Date.now() + BKK_OFFSET_MS);
  const y = bkk.getUTCFullYear();
  const m = bkk.getUTCMonth() + monthOffset;
  const start = Date.UTC(y, m, 1) - BKK_OFFSET_MS;
  const end = Date.UTC(y, m + 1, 1) - BKK_OFFSET_MS - 1;
  return [new Date(start).toISOString(), new Date(end).toISOString()];
}
