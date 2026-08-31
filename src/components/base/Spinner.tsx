"use client";
import { Spin } from "antd";
import type { SpinProps } from "antd";
export type { SpinProps };
export function Spinner(props: SpinProps) {
  return <Spin {...props} />;
}
