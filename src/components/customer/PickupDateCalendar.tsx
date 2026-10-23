"use client";
// ─────────────────────────────────────────────────────────────
// ปฏิทินเลือกวันรับสินค้า — ใช้ใน PickupLocationPicker (หน้า checkout ปกติ + พรีออเดอร์)
// กดได้เฉพาะวันที่อยู่ใน dates (YYYY-MM-DD ที่จุดรับเปิด — backend คิดให้แล้ว) · วันอื่นเป็นสีจาง กดไม่ได้
// เลื่อนเดือนได้เฉพาะช่วงเดือนแรก–เดือนสุดท้ายที่มีวันให้เลือก · สัปดาห์เริ่มวันอาทิตย์
// วันที่คิดแบบเวลาท้องถิ่น (new Date(y, m, d)) ไม่ผ่าน UTC — กันวันเลื่อน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** "2026-10-09" → "ศ. 9 ต.ค." (แปลงเป็นวันที่ท้องถิ่น ไม่ผ่าน UTC — กันวันเลื่อน) */
export function pickupDateLabel(dateKey: string, locale: string = "th"): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === "en" ? "en-US" : "th-TH", { weekday: "short", day: "numeric", month: "short" });
}

/** "2026-10" ของวันที่ "2026-10-09" */
const monthOf = (dateKey: string) => dateKey.slice(0, 7);
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** "2026-10" → เดือนก่อน/ถัดไป */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function todayKey(): string {
  const now = new Date();
  return keyOf(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function PickupDateCalendar({
  dates,
  value,
  onChange,
}: {
  dates: string[];
  value: string | null;
  onChange: (date: string) => void;
}) {
  const t = useTranslations("shop.pickup");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "th-TH";
  const sorted = [...dates].sort();
  const first = sorted[0] ? monthOf(sorted[0]) : monthOf(todayKey());
  const last = sorted.length ? monthOf(sorted[sorted.length - 1]) : first;
  const available = new Set(dates);

  // เปิดที่เดือนของวันที่เลือกอยู่ (ถ้ามี) ไม่งั้นเดือนแรกที่มีวันให้เลือก
  const [shown, setShown] = useState(() => (value && available.has(value) ? monthOf(value) : first));
  // จุดรับเปลี่ยน → ช่วงเดือนเปลี่ยน — ดึงกลับเข้าช่วงเสมอ
  const month = shown < first ? first : shown > last ? last : shown;

  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayKey();

  const monthTitle = new Date(y, m - 1, 1).toLocaleDateString(intlLocale, { month: "long", year: "numeric" });
  // หัวคอลัมน์ อา–ส (7 ม.ค. 2024 = วันอาทิตย์)
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(intlLocale, { weekday: "narrow" }));

  const navButton =
    "flex h-[44px] w-[44px] items-center justify-center rounded-xl text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

  return (
    // กว้างเต็มคอลัมน์ — เท่ากับการ์ดจุดรับสินค้าด้านบน
    <div className="w-full rounded-xl border border-[#8C5A3C]/15 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className={navButton} onClick={() => setShown(shiftMonth(month, -1))} disabled={month <= first} aria-label={t("prevMonth")}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="m-0 text-sm font-bold text-[#4A342E]" aria-live="polite">{monthTitle}</p>
        <button type="button" className={navButton} onClick={() => setShown(shiftMonth(month, 1))} disabled={month >= last} aria-label={t("nextMonth")}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="radiogroup" aria-label={t("date")}>
        {weekdays.map((w, i) => (
          <span key={i} className="pb-1 text-xs font-semibold text-gray-500" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} aria-hidden="true" />;
          const key = keyOf(y, m - 1, day);
          const open = available.has(key);
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={pickupDateLabel(key, locale)}
              disabled={!open}
              onClick={() => onChange(key)}
              className={`flex h-[44px] items-center justify-center rounded-lg text-sm transition ${
                selected
                  ? "bg-[#8C5A3C] font-bold text-white shadow-sm"
                  : open
                    ? "border border-[#8C5A3C]/30 bg-[#FAF6F0] font-semibold text-[#4A342E] hover:bg-[#8C5A3C]/15"
                    : "cursor-not-allowed text-gray-300"
              } ${key === today && !selected ? "underline underline-offset-4" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="m-0 mt-3 text-center text-sm text-[#4A342E]">
        {value ? t("selectedDate", { date: pickupDateLabel(value, locale) }) : t("pickDateHint")}
      </p>
    </div>
  );
}
