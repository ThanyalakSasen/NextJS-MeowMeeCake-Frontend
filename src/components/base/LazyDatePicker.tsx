"use client";
// ─────────────────────────────────────────────────────────────
// LazyDatePicker — ช่องวันที่ที่โหลด DatePicker ของ antd "เมื่อกดครั้งแรก"
//
// ทำไม: DatePicker ของ antd (rc-picker + สไตล์ cssinjs) หนักมากตอน hydrate — วัดในหน้าเพิ่มพนักงาน (2 ช่อง)
// ทำให้ TBT เพิ่ม ~200–300 ms และ JS +32 KB ทั้งที่ยังไม่มีใครเปิดปฏิทิน
// ก่อนกด = ปุ่มหน้าตาเหมือนช่องวันที่ (สูง/ขอบ/มุม/ไอคอนเดียวกัน) แสดงค่าเดิมหรือ placeholder ของ antd
// กด (หรือ Enter/Space) = โหลดโมดูล DatePicker แล้วเปิดปฏิทินทันที · ใช้ใน <FormItem> ได้เหมือน DatePicker
// (antd ส่ง value/onChange/id มาให้ — id ผูกกับ label ของ FormItem)
// ─────────────────────────────────────────────────────────────
import { useContext, useState, type ComponentType } from "react";
import { ConfigProvider } from "antd";
import type { DatePickerProps } from "antd";
import dayjs from "dayjs";
import { ArrowLongRightIcon, CalendarIcon } from "@heroicons/react/24/outline";

type PickerModule = typeof import("./DatePicker");
let loaded: PickerModule | null = null;
const loadPicker = () => import("./DatePicker").then((m) => (loaded = m));

/**
 * รูปแบบค่าเริ่มต้นของ antd ต่อชนิด picker (ให้ปุ่มก่อนโหลดแสดงเหมือนช่องจริง) · quarter ใช้ plugin quarterOfYear (utils/period)
 * ไม่มี "week" — รูปแบบสัปดาห์ของ antd (wo) ต้องใช้ plugin ที่โหลดมากับ picker · picker="week" ให้ใช้ DatePicker ตรง ๆ
 */
const DEFAULT_FORMAT: Partial<Record<NonNullable<DatePickerProps["picker"]>, string>> = {
  date: "YYYY-MM-DD",
  month: "YYYY-MM",
  quarter: "YYYY-[Q]Q",
  year: "YYYY",
};

export function LazyDatePicker(props: DatePickerProps) {
  const { locale } = useContext(ConfigProvider.ConfigContext);
  // เริ่มเป็นปุ่มเสมอ (ฝั่ง server = ฝั่ง browser ตอน hydrate) — โหลดแล้วค่อยสลับเป็น DatePicker จริง
  const [Picker, setPicker] = useState<ComponentType<DatePickerProps> | null>(null);

  if (Picker) return <Picker {...props} defaultOpen autoFocus />;

  const format = typeof props.format === "string" ? props.format : DEFAULT_FORMAT[props.picker ?? "date"] ?? "YYYY-MM-DD";
  const value = props.value ? dayjs(props.value as dayjs.ConfigType) : null;
  // format เป็นฟังก์ชัน (เช่น ชื่อช่วงภาษาไทยของ PeriodSelector) — ใช้ฟังก์ชันเดียวกับตอนโหลดแล้ว ปุ่มกับช่องจริงจึงแสดงเหมือนกัน
  const show = (d: dayjs.Dayjs) => (typeof props.format === "function" ? props.format(d) : d.format(format));
  const placeholder = (typeof props.placeholder === "string" && props.placeholder) || locale?.DatePicker?.lang.placeholder || "";
  const activate = () => {
    void (loaded ? Promise.resolve(loaded) : loadPicker()).then((m) => setPicker(() => m.DatePicker));
  };

  return (
    <button
      type="button"
      id={props.id}
      aria-label={props["aria-label"]}
      disabled={props.disabled}
      onClick={activate}
      onPointerEnter={() => void loadPicker()}
      style={props.style}
      className="flex h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-[#e4dad1] bg-white px-[11px] text-left transition-colors hover:border-brown-800 focus-visible:border-brown-800 disabled:cursor-not-allowed disabled:bg-gray-50"
    >
      <span className={value?.isValid() ? "truncate" : "truncate text-gray-500"}>
        {value?.isValid() ? show(value) : placeholder}
      </span>
      <CalendarIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
    </button>
  );
}

type RangeProps = React.ComponentProps<PickerModule["RangePicker"]>;

/** ช่องช่วงวันที่แบบโหลดเมื่อกด — เหมือน LazyDatePicker แต่เป็น RangePicker (เหตุผลอยู่ด้านบนของไฟล์) */
export function LazyRangePicker(props: RangeProps) {
  const { locale } = useContext(ConfigProvider.ConfigContext);
  const [Picker, setPicker] = useState<PickerModule["RangePicker"] | null>(null);

  if (Picker) return <Picker {...props} defaultOpen autoFocus />;

  const format = typeof props.format === "string" ? props.format : "YYYY-MM-DD";
  const [start, end] = (props.value ?? [null, null]).map((v) => (v ? dayjs(v as dayjs.ConfigType) : null));
  const [phStart, phEnd] = locale?.DatePicker?.lang.rangePlaceholder ?? ["", ""];
  const part = (d: dayjs.Dayjs | null, ph: string) => (
    <span className={d?.isValid() ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1 truncate text-gray-500"}>
      {d?.isValid() ? d.format(format) : ph}
    </span>
  );
  const activate = () => {
    void (loaded ? Promise.resolve(loaded) : loadPicker()).then((m) => setPicker(() => m.RangePicker));
  };

  return (
    <button
      type="button"
      id={typeof props.id === "string" ? props.id : props.id?.start}
      disabled={props.disabled === true}
      onClick={activate}
      onPointerEnter={() => void loadPicker()}
      className="flex h-[40px] w-[20rem] max-w-full items-center gap-3 rounded-lg border border-[#e4dad1] bg-white px-[11px] text-left transition-colors hover:border-brown-800 focus-visible:border-brown-800 disabled:cursor-not-allowed disabled:bg-gray-50"
    >
      {part(start, phStart)}
      <ArrowLongRightIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      {part(end, phEnd)}
      <CalendarIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
    </button>
  );
}
