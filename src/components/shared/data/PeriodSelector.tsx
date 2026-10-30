"use client";
// ─────────────────────────────────────────────────────────────
// PeriodSelector — เลือกช่วงเวลาของรายงาน: 1) ชนิดช่วง (รายวัน…รายปี) 2) ‹ ช่วงที่ดูอยู่ › 3) กลับช่วงปัจจุบัน
// ชื่อช่วงเป็นภาษาของผู้ใช้ (ไทย = พ.ศ.) แทนรูปแบบ antd "2026-08" · กดที่ชื่อช่วง = เปิดปฏิทินเลือกเอง
// ใช้ร่วม: สรุปกำไร-ขาดทุน · รายงานยอดขาย · แดชบอร์ดรีวิว · ประวัติการผลิต — คืน fragment ให้วางใน flex แถวของหน้าเอง
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, LazyDatePicker } from "@/components/base";
import { formatDayMonth } from "@/i18n/format";
import { isSamePeriod, pickerTypeFor, PERIOD_TYPES, shiftPeriod, getRangeStartEnd, type PeriodType } from "@/utils/period";
import { TypeTabBar } from "./TypeTabBar";

const ymd = (d: Dayjs) => d.format("YYYY-MM-DD");

export function PeriodSelector({
  period,
  onPeriodChange,
  date,
  onDateChange,
}: {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  date: Dayjs;
  onDateChange: (d: Dayjs) => void;
}) {
  const t = useTranslations("period");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "th-TH";

  /** "30 ต.ค. 2569" · "26 ต.ค. – 1 พ.ย. 2569" · "ตุลาคม 2569" · "ไตรมาส 4/2569" · "2569" */
  const labelOf = (d: Dayjs): string => {
    if (period === "day") return formatDayMonth(ymd(d), locale, { withYear: true });
    if (period === "week") {
      const [start, end] = getRangeStartEnd("week", d);
      const sameYear = start.year() === end.year();
      return `${formatDayMonth(ymd(start), locale, { withYear: !sameYear })} – ${formatDayMonth(ymd(end), locale, { withYear: true })}`;
    }
    // ปีเลขล้วน (Intl ภาษาไทยใส่ "พ.ศ." นำหน้า ทำให้ "ไตรมาส 4/พ.ศ. 2569") — ไทย = พ.ศ. (+543)
    const year = locale === "en" ? d.year() : d.year() + 543;
    if (period === "quarter") return t("quarterLabel", { n: d.quarter(), year });
    if (period === "year") return String(year);
    return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(d.toDate());
  };

  return (
    <>
      <TypeTabBar
        value={period}
        onChange={onPeriodChange}
        options={PERIOD_TYPES.map((p) => ({ value: p, label: t(`type.${p}`) }))}
      />
      <div className="flex items-center gap-1">
        <Button
          icon={<ChevronLeftIcon className="h-4 w-4" />}
          aria-label={t("prev")}
          onClick={() => onDateChange(shiftPeriod(period, date, -1))}
        />
        {/* ปฏิทินโหลดเมื่อกด (base/LazyDatePicker) · format เป็นฟังก์ชัน = แสดงชื่อช่วง พิมพ์เองไม่ได้ (inputReadOnly) */}
        <LazyDatePicker
          picker={pickerTypeFor(period)}
          value={date}
          format={labelOf}
          inputReadOnly
          allowClear={false}
          onChange={(v) => { if (v && !Array.isArray(v)) onDateChange(v as Dayjs); }}
          style={{ width: period === "week" ? 230 : 190 }}
          aria-label={t("pick")}
        />
        <Button
          icon={<ChevronRightIcon className="h-4 w-4" />}
          aria-label={t("next")}
          onClick={() => onDateChange(shiftPeriod(period, date, 1))}
        />
      </div>
      <Button disabled={isSamePeriod(period, date, dayjs())} onClick={() => onDateChange(dayjs())}>
        {t(`current.${period}`)}
      </Button>
    </>
  );
}
