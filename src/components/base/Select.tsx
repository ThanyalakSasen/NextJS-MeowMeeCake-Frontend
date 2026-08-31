"use client";
import { Select as AntSelect } from "antd";
import type { SelectProps } from "antd";
export type { SelectProps };
export function Select(props: SelectProps) {
  return <AntSelect style={{ width: "100%" }} {...props} />;
}
