// ─────────────────────────────────────────────────────────────
// financePeriod.ts — pure: ช่วงเวลาของ P&L (day/week/month/quarter/year) → [start, end]
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
