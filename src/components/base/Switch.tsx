"use client";
import { Switch as AntSwitch } from "antd";
import type { SwitchProps } from "antd";
export type { SwitchProps };
export function Switch(props: SwitchProps) {
  return <AntSwitch {...props} />;
}
