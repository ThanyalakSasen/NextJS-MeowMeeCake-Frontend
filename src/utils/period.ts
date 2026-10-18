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

/** antd <DatePicker picker=...> ที่สอดคล้องกับ period ที่เลือก */
export function pickerTypeFor(period: PeriodType): "date" | "week" | "month" | "quarter" | "year" {
  return period === "day" ? "date" : period;
}

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * [ต้นเดือน, สิ้นเดือน] ของเดือนปัจจุบัน "ตามเวลาไทย" เป็น ISO — ใช้ฝั่ง server (UTC) ตอน prefetch
 * ให้ได้ค่าเดียวกับ getRangeStartEnd("month", dayjs()) ที่ browser ในไทยคำนวณ → query key ตรงกัน ไม่ดึงซ้ำ
 */
export function bangkokMonthRangeIso(): [string, string] {
  const bkk = new Date(Date.now() + BKK_OFFSET_MS);
  const y = bkk.getUTCFullYear();
  const m = bkk.getUTCMonth();
  const start = Date.UTC(y, m, 1) - BKK_OFFSET_MS;
  const end = Date.UTC(y, m + 1, 1) - BKK_OFFSET_MS - 1;
  return [new Date(start).toISOString(), new Date(end).toISOString()];
}
