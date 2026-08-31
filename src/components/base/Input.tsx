"use client";
import { Input as AntInput } from "antd";
import type { InputProps } from "antd";
export type { InputProps };
export function Input(props: InputProps) {
  return <AntInput {...props} />;
}
