// ─────────────────────────────────────────────────────────────
// src/i18n/format.ts
// รวมฟังก์ชัน format ที่ต้นทางกระจายอยู่หลายไฟล์ (formatCurrency, fmtBaht, fmt,
// fmtDateTH, fmtPct) มาไว้ที่เดียว — รับ locale, ใช้ Intl.*
// สกุลเงินคง THB ทั้ง 2 ภาษา (ธุรกิจอยู่ไทย) — ต่างแค่รูปแบบ
// ─────────────────────────────────────────────────────────────
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

const localeTag: Record<Locale, string> = { th: "th-TH", en: "en-US" };

function tag(locale: Locale | string | undefined): string {
  return localeTag[(locale as Locale) ?? defaultLocale] ?? "th-TH";
}

/** เงินบาท: ฿1,234 (ไม่มีทศนิยมถ้าเป็นจำนวนเต็ม) */
export function formatCurrency(
  amount: number,
  locale: Locale | string = defaultLocale,
  opts: { decimals?: number } = {}
): string {
  const decimals = opts.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** ตัวเลขมีคอมมา: 1,234.5 */
export function formatNumber(
  value: number,
  locale: Locale | string = defaultLocale,
  opts: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(tag(locale), opts).format(value);
}

/** เปอร์เซ็นต์: 12.3% (รับค่าที่เป็นตัวเลขเปอร์เซ็นต์อยู่แล้ว เช่น 12.3) */
export function formatPercent(
  value: number,
  locale: Locale | string = defaultLocale,
  fractionDigits = 1
): string {
  return `${new Intl.NumberFormat(tag(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}%`;
}

/** วันที่: 31 ส.ค. 2025 / Aug 31, 2025 — withTime = เพิ่มเวลา HH:mm */
export function formatDate(
  iso: string | number | Date | null | undefined,
  locale: Locale | string = defaultLocale,
  opts: { withTime?: boolean } = {}
): string {
  if (iso === null || iso === undefined || iso === "") return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(opts.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    // เวลาไทยเสมอ — ร้านอยู่ไทย · server (Vercel) เป็น UTC ถ้าไม่ระบุ หน้าที่ render ฝั่ง server
    // จะได้วันที่/เวลาคนละวันกับ browser ตอนใกล้เที่ยงคืน (ผิด + hydration ไม่ตรง)
    timeZone: "Asia/Bangkok",
  }).format(d);
}

/** วันที่แบบ "YYYY-MM-DD" (วันตามปฏิทิน ไม่มีเวลา เช่น จาก sales-by-day) → "8 ต.ค." · withYear → "8 ต.ค. 2569"
 *  อ่านเป็น UTC แล้ว format เป็น UTC — วันไม่เลื่อนตาม timezone ของเครื่อง */
export function formatDayMonth(date: string, locale: Locale | string = defaultLocale, opts: { withYear?: boolean } = {}): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    ...(opts.withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(d);
}
