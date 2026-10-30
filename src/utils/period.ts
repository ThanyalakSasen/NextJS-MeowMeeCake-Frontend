// ─────────────────────────────────────────────────────────────
// src/utils/period.ts — pure: ช่วงเวลา day/week/month/quarter/year → [start, end]
// ใช้ร่วมกัน ≥ 2 หน้า (Finance P&L, Sales Report) — ย้ายมาจาก finance/summary/financePeriod.ts เดิม
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

export type PeriodType = "day" | "week" | "month" | "quarter" | "year";
export const PERIOD_TYPES: PeriodType[] = ["day", "week", "month", "quarter", "year"];

export function getRangeStartEnd(period: PeriodType, picker: Dayjs): [Dayjs, Dayjs] {
  if (period === "day") return [picker.startOf("day"), picker.endOf("day")];
  if (period === "week") return [picker.startOf("week"), picker.endOf("week")];
  if (period === "month") return [picker.startOf("month"), picker.endOf("month")];
  if (period === "quarter") return [picker.startOf("quarter"), picker.endOf("quarter")];
  return [picker.startOf("year"), picker.endOf("year")];
}

/** เลื่อนไปช่วงก่อนหน้า (-1) / ถัดไป (1) ตามชนิดช่วง · quarter ใช้ plugin quarterOfYear */
export function shiftPeriod(period: PeriodType, date: Dayjs, step: 1 | -1): Dayjs {
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
