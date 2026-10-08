// วันที่ของรอบพรีออเดอร์ — ทุกอย่างตามเวลาไทย (Asia/Bangkok) เหมือน backend src/lib/pickupLocations.ts
import type { PickupLocation } from "@/services/pickupLocations";

const TZ = "Asia/Bangkok";
const DAY_MS = 86_400_000;
/** รับได้ถึงกี่วันหลังวันรับวันแรกของรอบ (= backend PICKUP_EXTRA_DAYS) */
export const PICKUP_EXTRA_DAYS = 12;

const dateKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const dayKey = (key: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(new Date(`${key}T00:00:00+07:00`)).toLowerCase().slice(0, 3);

/** วันรับที่เลือกได้ของพรีออเดอร์ ณ จุดนี้ = วันรับของรอบ + อีก 12 วัน เฉพาะวันที่จุดเปิด (backend preorderPickupDateOptions) */
export function preorderPickupDates(loc: Pick<PickupLocation, "days">, roundPickupDate: string): string[] {
  const first = new Date(roundPickupDate);
  if (Number.isNaN(first.getTime())) return [];
  const start = new Date(`${dateKey(first)}T00:00:00+07:00`).getTime();
  const keys: string[] = [];
  for (let i = 0; i <= PICKUP_EXTRA_DAYS; i++) {
    const key = dateKey(new Date(start + i * DAY_MS));
    if (loc.days.includes(dayKey(key))) keys.push(key);
  }
  return keys;
}

/** "16 ต.ค. 2569" / "Oct 16, 2026" (+ เวลาถ้า withTime) ตามเวลาไทย · locale = ภาษาของหน้า (useLocale) */
export function thaiDate(iso: string | null | undefined, withTime = false, locale: string = "th"): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(locale === "en" ? "en-US" : "th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
