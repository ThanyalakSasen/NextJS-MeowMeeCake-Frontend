// เวลา/วันของข้อความแชท — เวลาไทยเสมอ (ร้านอยู่ไทย · ไม่ขึ้นกับเขตเวลาเครื่อง)
const TZ = "Asia/Bangkok";

const tag = (locale: string) => (locale === "en" ? "en-US" : "th-TH");

/** "14:05" */
export function chatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(tag(locale), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
}

/** วันตามเวลาไทย "2026-10-22" — ใช้แบ่งกลุ่มข้อความตามวัน */
export function chatDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** ป้ายวัน: วันนี้ / เมื่อวาน / "20 ต.ค. 2569" */
export function chatDayLabel(iso: string, locale: string, labels: { today: string; yesterday: string }): string {
  const key = chatDayKey(iso);
  const now = Date.now();
  if (key === chatDayKey(new Date(now).toISOString())) return labels.today;
  if (key === chatDayKey(new Date(now - 86_400_000).toISOString())) return labels.yesterday;
  return new Date(iso).toLocaleDateString(tag(locale), { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

/** เวลาในรายการห้อง: วันนี้ = "14:05" · วันอื่น = "20 ต.ค." */
export function chatListTime(iso: string, locale: string): string {
  if (chatDayKey(iso) === chatDayKey(new Date().toISOString())) return chatTime(iso, locale);
  return new Date(iso).toLocaleDateString(tag(locale), { day: "numeric", month: "short", timeZone: TZ });
}
