"use client";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { InputNumber as AntInputNumber } from "antd";
import type { InputNumberProps } from "antd";
export type { InputNumberProps };

/**
 * precision={0} = จำนวนเต็มเท่านั้น (เงิน / จำนวนชิ้น) — กันพิมพ์/วางจุดทศนิยม ตัวอักษร และเครื่องหมายลบตั้งแต่ต้น
 * (เดิม antd ปล่อยให้พิมพ์ 1.5 แล้วปัดเป็น 2 เงียบ ๆ ตอนออกจากช่อง) · ลบได้เฉพาะช่องที่ min ติดลบ
 * ผู้เรียกส่ง onKeyDown/onPaste/parser มาเอง = ทำงานต่อจากตัวกันนี้ (เช่นช่องวัตถุดิบหน่วยนับ)
 */
export function InputNumber(props: InputNumberProps) {
  if (props.precision !== 0) return <AntInputNumber style={{ width: "100%" }} {...props} />;

  const allowMinus = props.min != null && Number(props.min) < 0;
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const ctrl = e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1;
    if (!ctrl && !/^[0-9]$/.test(e.key) && !(allowMinus && e.key === "-")) e.preventDefault();
    props.onKeyDown?.(e);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").trim().replace(/,/g, "");
    if (!(allowMinus ? /^-?\d+$/ : /^\d+$/).test(text)) e.preventDefault();
    props.onPaste?.(e);
  };
  const parser = (v: string | undefined) => (v ?? "").replace(allowMinus ? /[^0-9-]/g : /[^0-9]/g, "");

  return (
    <AntInputNumber
      style={{ width: "100%" }}
      parser={parser}
      {...props}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}
