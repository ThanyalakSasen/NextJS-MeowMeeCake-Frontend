"use client";
import { Tag as AntTag } from "antd";
import type { TagProps } from "antd";
export type { TagProps };
export function Tag(props: TagProps) {
  return <AntTag {...props} />;
}
