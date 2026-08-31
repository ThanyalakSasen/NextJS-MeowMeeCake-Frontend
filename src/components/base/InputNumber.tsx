"use client";
import { InputNumber as AntInputNumber } from "antd";
import type { InputNumberProps } from "antd";
export type { InputNumberProps };
export function InputNumber(props: InputNumberProps) {
  return <AntInputNumber style={{ width: "100%" }} {...props} />;
}
