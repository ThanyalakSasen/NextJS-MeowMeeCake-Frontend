// ─────────────────────────────────────────────────────────────
// summaryRanges.ts — pure: ช่วงเวลา + query key ของหน้าสรุปกำไร-ขาดทุน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) → key ตรงกันเป๊ะ
// ต้องอยู่ไฟล์ที่ไม่มี "use client" — server เรียกฟังก์ชันจากไฟล์ client ไม่ได้
// ─────────────────────────────────────────────────────────────
import type { Dayjs } from "dayjs";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";

/** จำนวนช่วงในตารางเปรียบเทียบต่อรูปแบบช่วงเวลา (รวมช่วงที่เลือก) */
export const TREND_LENGTH: Record<PeriodType, number> = { day: 7, week: 6, month: 6, quarter: 4, year: 3 };

export const revenueKey = (from: string, to: string) => ["reports", "revenue-by-channel", from, to] as const;

export interface TrendBucket {
  key: string;
  start: Dayjs;
  end: Dayjs;
  from: string;
  to: string;
}

/** ช่วงย่อย N ช่วงย้อนหลัง จบที่ช่วงที่เลือก (ตารางเปรียบเทียบ) */
export function trendBuckets(period: PeriodType, selectedDate: Dayjs): TrendBucket[] {
  return Array.from({ length: TREND_LENGTH[period] }, (_, i) => {
    const back = TREND_LENGTH[period] - 1 - i;
    // ไตรมาส = 3 เดือน (subtract ของ dayjs แยก type ไตรมาสกับหน่วยอื่น)
    const anchor = period === "quarter" ? selectedDate.subtract(back * 3, "month") : selectedDate.subtract(back, period);
    const [from, to] = getRangeStartEnd(period, anchor);
    return { key: from.toISOString(), start: from, end: to, from: from.toISOString(), to: to.toISOString() };
  });
}
