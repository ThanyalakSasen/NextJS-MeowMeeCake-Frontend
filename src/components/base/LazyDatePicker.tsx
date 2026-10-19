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
import { CalendarIcon } from "@heroicons/react/24/outline";

type PickerModule = typeof import("./DatePicker");
let loaded: PickerModule | null = null;
const loadPicker = () => import("./DatePicker").then((m) => (loaded = m));

export function LazyDatePicker(props: DatePickerProps) {
  const { locale } = useContext(ConfigProvider.ConfigContext);
  // เริ่มเป็นปุ่มเสมอ (ฝั่ง server = ฝั่ง browser ตอน hydrate) — โหลดแล้วค่อยสลับเป็น DatePicker จริง
  const [Picker, setPicker] = useState<ComponentType<DatePickerProps> | null>(null);

  if (Picker) return <Picker {...props} defaultOpen autoFocus />;

  const format = typeof props.format === "string" ? props.format : "YYYY-MM-DD";
  const value = props.value ? dayjs(props.value as dayjs.ConfigType) : null;
  const placeholder = (typeof props.placeholder === "string" && props.placeholder) || locale?.DatePicker?.lang.placeholder || "";
  const activate = () => {
    void (loaded ? Promise.resolve(loaded) : loadPicker()).then((m) => setPicker(() => m.DatePicker));
  };

  return (
    <button
      type="button"
      id={props.id}
      disabled={props.disabled}
      onClick={activate}
      onPointerEnter={() => void loadPicker()}
      className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#e4dad1] bg-white px-[11px] text-left transition-colors hover:border-brown-800 focus-visible:border-brown-800 disabled:cursor-not-allowed disabled:bg-gray-50"
    >
      <span className={value?.isValid() ? "truncate" : "truncate text-gray-500"}>
        {value?.isValid() ? value.format(format) : placeholder}
      </span>
      <CalendarIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
    </button>
  );
}
