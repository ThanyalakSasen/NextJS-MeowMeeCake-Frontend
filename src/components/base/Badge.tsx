"use client";
import { Badge as AntBadge } from "antd";
import type { BadgeProps } from "antd";
export type { BadgeProps };
export function Badge(props: BadgeProps) {
  return <AntBadge {...props} />;
}
