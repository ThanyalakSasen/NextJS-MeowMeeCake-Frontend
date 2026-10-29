"use client";
import type { ChangeEvent, ComponentProps, FocusEvent } from "react";
import { Input as AntInput } from "antd";
import type { InputProps } from "antd";
export type { InputProps };

const AntTextArea = AntInput.TextArea;
type TextAreaProps = ComponentProps<typeof AntTextArea>;

/**
 * ออกจากช่องแล้วตัดช่องว่างหัว-ท้าย แล้วแจ้ง onChange (Form.Item / state ของผู้เรียก) ด้วยค่าที่ตัดแล้ว
 * → กดแต่ spacebar แล้วกดบันทึก = ค่าว่าง: ช่องบังคับขึ้น error (rule whitespace/required) · ช่องไม่บังคับไม่เก็บ "   "
 * (กดปุ่มบันทึก = ช่องเสียโฟกัสก่อน click เสมอ ค่าที่ validate จึงเป็นค่าที่ตัดแล้ว)
 */
function trimOnBlur<T extends HTMLInputElement | HTMLTextAreaElement>(
  onChange: ((e: ChangeEvent<T>) => void) | undefined,
  onBlur: ((e: FocusEvent<T>) => void) | undefined,
) {
  return (e: FocusEvent<T>) => {
    const value = e.target.value;
    const trimmed = value.trim();
    if (trimmed !== value) {
      e.target.value = trimmed;
      onChange?.(e as unknown as ChangeEvent<T>);
    }
    onBlur?.(e);
  };
}

export function Input(props: InputProps) {
  return <AntInput {...props} onBlur={trimOnBlur(props.onChange, props.onBlur)} />;
}

export function TextArea(props: TextAreaProps) {
  return <AntTextArea {...props} onBlur={trimOnBlur(props.onChange, props.onBlur)} />;
}
