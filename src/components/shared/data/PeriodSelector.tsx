"use client";
// ─────────────────────────────────────────────────────────────
// PeriodSelector — เลือกช่วงเวลาของรายงาน: 1) ชนิดช่วง (รายวัน…รายปี) 2) ‹ ช่วงที่ดูอยู่ › 3) กลับช่วงปัจจุบัน
// ชื่อช่วงเป็นภาษาของผู้ใช้ (ไทย = พ.ศ.) แทนรูปแบบ antd "2026-08" · กดที่ชื่อช่วง = เปิดปฏิทินเลือกเอง
// ใช้ร่วม: สรุปกำไร-ขาดทุน · รายงานยอดขาย · แดชบอร์ดรีวิว · ประวัติการผลิต — คืน fragment ให้วางใน flex แถวของหน้าเอง
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, LazyDatePicker, Select } from "@/components/base";
import { formatDayMonth } from "@/i18n/format";
import {
  getMonthWeeks,
  getRangeStartEnd,
  isSamePeriod,
  PERIOD_TYPES,
  pickerTypeFor,
  shiftPeriod,
  type PeriodType,
} from "@/utils/period";
import { TypeTabBar } from "./TypeTabBar";
import { actionIcon } from "@/components/shared/actions";

const ymd = (d: Dayjs) => d.format("YYYY-MM-DD");

export function PeriodSelector({
  period,
  onPeriodChange,
  date,
  onDateChange,
  dayAsMonth = false,
  periods = PERIOD_TYPES,
  allowFuture = false,
}: {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  date: Dayjs;
  onDateChange: (d: Dayjs) => void;
  /** โหมดรายวันให้เลือกเฉพาะเดือน (เช่น หน้าสรุปกำไร-ขาดทุน ที่ตารางรายวันแสดงตั้งแต่วันที่ 1 ของเดือนที่เลือก) */
  dayAsMonth?: boolean;
  /** ชนิดช่วงที่ให้เลือก (ค่าเริ่มต้น = ทุกชนิด) เช่น สรุปรอบพรีออเดอร์ใช้แค่ เดือน/ไตรมาส/ปี */
  periods?: PeriodType[];
  /** เลื่อน/เลือกช่วงในอนาคตได้ (เช่น รอบพรีออเดอร์ที่ตั้งเวลาเปิดไว้ล่วงหน้า) — รายงานทั่วไปปิดไว้ */
  allowFuture?: boolean;
}) {
  const t = useTranslations("period");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "th-TH";

  const effectivePeriod: PeriodType = dayAsMonth && period === "day" ? "month" : period;

  const formatMonthLabel = (d: Dayjs): string =>
    new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(d.toDate());

  const formatWeekRange = (start: Dayjs, end: Dayjs): string => {
    const sameYear = start.year() === end.year();
    return `${formatDayMonth(ymd(start), locale, { withYear: !sameYear })} – ${formatDayMonth(ymd(end), locale, { withYear: true })}`;
  };

  /** "30 ต.ค. 2569" · "1 ต.ค. – 7 ต.ค. 2569" · "ตุลาคม 2569" · "ไตรมาส 4/2569" · "2569" */
  const labelOf = (d: Dayjs): string => {
    if (effectivePeriod === "day") return formatDayMonth(ymd(d), locale, { withYear: true });
    if (effectivePeriod === "week") {
      const [start, end] = getRangeStartEnd("week", d);
      return formatWeekRange(start, end);
    }
    // ปีเลขล้วน (Intl ภาษาไทยใส่ "พ.ศ." นำหน้า ทำให้ "ไตรมาส 4/พ.ศ. 2569") — ไทย = พ.ศ. (+543)
    const year = locale === "en" ? d.year() : d.year() + 543;
    if (effectivePeriod === "quarter") return t("quarterLabel", { n: d.quarter(), year });
    if (effectivePeriod === "year") return String(year);
    return formatMonthLabel(d);
  };

  const monthWeeks = period === "week" ? getMonthWeeks(date) : [];
  const currentWeekIdx =
    period === "week" && monthWeeks.length > 0
      ? Math.min(Math.floor((date.date() - 1) / 7), monthWeeks.length - 1)
      : 0;

  const nextDisabled = allowFuture
    ? period === "week" && currentWeekIdx >= monthWeeks.length - 1
    : period === "week"
      ? currentWeekIdx >= monthWeeks.length - 1
      : isSamePeriod(effectivePeriod, date, dayjs()) || shiftPeriod(effectivePeriod, date, 1).isAfter(dayjs(), "day");

  return (
    <>
      <TypeTabBar
        value={period}
        onChange={onPeriodChange}
        options={periods.map((p) => ({ value: p, label: t(`type.${p}`) }))}
      />
      {period === "week" ? (
        <>
          <LazyDatePicker
            picker="month"
            value={date}
            format={formatMonthLabel}
            inputReadOnly
            allowClear={false}
            disabledDate={(d) => d.isAfter(dayjs(), "month")}
            onChange={(v) => {
              if (v && !Array.isArray(v)) onDateChange((v as Dayjs).startOf("month"));
            }}
            style={{ width: 175 }}
            aria-label={t("pick")}
          />
          <div className="flex items-center gap-1">
            <Button
              icon={<ChevronLeftIcon className="h-4 w-4" />}
              aria-label={t("prev")}
              disabled={currentWeekIdx <= 0}
              onClick={() => onDateChange(shiftPeriod("week", date, -1))}
            />
            <Select
              value={currentWeekIdx}
              onChange={(idx) => {
                const target = monthWeeks[idx as number];
                if (target) onDateChange(target.start);
              }}
              options={monthWeeks.map((w) => ({
                value: w.index,
                label: formatWeekRange(w.start, w.end),
              }))}
              style={{ minWidth: 215 }}
              aria-label={t("pick")}
            />
            <Button
              icon={<ChevronRightIcon className="h-4 w-4" />}
              aria-label={t("next")}
              disabled={nextDisabled}
              onClick={() => onDateChange(shiftPeriod("week", date, 1))}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            icon={<ChevronLeftIcon className="h-4 w-4" />}
            aria-label={t("prev")}
            onClick={() => onDateChange(shiftPeriod(effectivePeriod, date, -1))}
          />
          {/* ปฏิทินโหลดเมื่อกด (base/LazyDatePicker) · format เป็นฟังก์ชัน = แสดงชื่อช่วง พิมพ์เองไม่ได้ (inputReadOnly) */}
          <LazyDatePicker
            picker={pickerTypeFor(effectivePeriod)}
            value={date}
            format={labelOf}
            inputReadOnly
            allowClear={false}
            disabledDate={allowFuture ? undefined : (d) => d.isAfter(dayjs(), "day")}
            onChange={(v) => { if (v && !Array.isArray(v)) onDateChange(v as Dayjs); }}
            style={{ width: 190 }}
            aria-label={t("pick")}
          />
          <Button
            icon={<ChevronRightIcon className="h-4 w-4" />}
            aria-label={t("next")}
            disabled={nextDisabled}
            onClick={() => onDateChange(shiftPeriod(effectivePeriod, date, 1))}
          />
        </div>
      )}
      <Button icon={actionIcon("calendar")} disabled={isSamePeriod(effectivePeriod, date, dayjs())} onClick={() => onDateChange(dayjs())}>
        {t(`current.${effectivePeriod}`)}
      </Button>
    </>
  );
}
