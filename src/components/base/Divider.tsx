"use client";
import { Divider as AntDivider } from "antd";
import type { DividerProps } from "antd";
export type { DividerProps };
export function Divider(props: DividerProps) {
  return <AntDivider {...props} />;
}
