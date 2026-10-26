// ─────────────────────────────────────────────────────────────
// salesTrend.ts — pure: ช่วงวันของกราฟยอดขายรายวันในแดชบอร์ด (Final-Backlog N2)
// N วันล่าสุดตามปฏิทินไทย (วันนี้อยู่ท้าย · วันนี้นับถึงตอนนี้) — กราฟแท่งกับยอดแยกช่องทางใช้ช่วงเดียวกัน
// sales-by-day ตัดช่วงเป็น now − N×24 ชม. → ได้วันที่เกินมา 1 วัน (บางส่วน) ข้างหน้า ตัดทิ้งที่นี่
// ─────────────────────────────────────────────────────────────
import type { RevenueChannel, SalesByDay } from "@/services/reports";

export const SALES_RANGES = [7, 30, 90] as const;
export type SalesRange = (typeof SALES_RANGES)[number];
export const DEFAULT_SALES_RANGE: SalesRange = 30;

export const salesByDayKey = (days: SalesRange) => ["reports", "sales-by-day", days] as const;
export const channelRevenueKey = (days: SalesRange) => ["reports", "revenue-by-channel", "last-days", days] as const;

/** ลำดับช่องทางในกราฟแท่งซ้อน (ล่าง → บน) และในกล่องแยกช่องทาง */
export const CHANNEL_ORDER: RevenueChannel[] = ["preorder", "pos", "web", "other"];

export interface SalesDay {
  date: string;
  revenue: number;
  orders: number;
  /** ยอดแยกช่องทางของวันนั้น — null = backend รุ่นเก่ายังไม่ส่ง (วาดแท่งสีเดียว) */
  channels: Record<RevenueChannel, { revenue: number; orders: number }> | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** เที่ยงคืน (เวลาไทย) ของวันนี้ เป็น epoch ms */
function bangkokTodayStart(now: number): number {
  return Math.floor((now + BKK_OFFSET_MS) / DAY_MS) * DAY_MS - BKK_OFFSET_MS;
}

/** "YYYY-MM-DD" ของ days วันล่าสุดตามเวลาไทย — เก่าสุดก่อน วันนี้ท้ายสุด */
export function bangkokDayKeys(days: number, now = Date.now()): string[] {
  const today = bangkokTodayStart(now);
  return Array.from({ length: days }, (_, i) =>
    new Date(today - (days - 1 - i) * DAY_MS + BKK_OFFSET_MS).toISOString().slice(0, 10),
  );
}

/** ต้นวัน (เวลาไทย) ของวันแรกในช่วง เป็น ISO — date_from ของ revenue-by-channel */
export function rangeStartIso(days: number, now = Date.now()): string {
  return new Date(bangkokTodayStart(now) - (days - 1) * DAY_MS).toISOString();
}

const ZERO_CHANNELS = (): Record<RevenueChannel, { revenue: number; orders: number }> => ({
  preorder: { revenue: 0, orders: 0 },
  pos: { revenue: 0, orders: 0 },
  web: { revenue: 0, orders: 0 },
  other: { revenue: 0, orders: 0 },
});

/** ครบทุกวันในช่วง — วันที่ backend ไม่ส่งมา (ไม่มียอด) = 0 · ไม่มีวันไหนส่ง channels เลย = backend รุ่นเก่า → channels null ทุกวัน */
export function fillDays(series: SalesByDay["series"], days: number, now = Date.now()): SalesDay[] {
  const byDate = new Map(series.map((d) => [d.date, d]));
  const withChannels = series.some((d) => d.channels);
  return bangkokDayKeys(days, now).map((date) => {
    const d = byDate.get(date);
    const channels = withChannels ? { ...ZERO_CHANNELS(), ...d?.channels } : null;
    return { date, revenue: d?.revenue ?? 0, orders: d?.orders ?? 0, channels };
  });
}

export function summarize(days: SalesDay[]) {
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const best = days.reduce<SalesDay | null>((b, d) => (d.revenue > (b?.revenue ?? 0) ? d : b), null);
  return { total, avg: days.length ? total / days.length : 0, best };
}

/** ค่าบนสุดของแกน — ปัดขึ้นเป็นเลขกลม ๆ × 10ⁿ (1 · 1.5 · 2 · 2.5 · 3 · 4 · 5 · 6 · 8) (ไม่มียอดเลย = 1,000 ให้แกนไม่เป็น 0) */
export function axisMax(max: number): number {
  if (max <= 0) return 1000;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * pow >= max) ?? 10;
  return step * pow;
}

/** ทุกกี่แท่งจึงแสดงวันที่ใต้แกน (นับจากวันนี้ย้อนไป) */
export const tickEvery = (days: SalesRange) => (days === 7 ? 1 : days === 30 ? 5 : 15);
