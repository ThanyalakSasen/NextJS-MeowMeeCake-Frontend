"use client";
import { DatePicker as AntDatePicker } from "antd";
import type { DatePickerProps } from "antd";
export type { DatePickerProps };
export function DatePicker(props: DatePickerProps) {
  return <AntDatePicker style={{ width: "100%" }} {...props} />;
}
export const RangePicker = AntDatePicker.RangePicker;
