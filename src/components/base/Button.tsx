"use client";
// base/Button — antd Button + ธีมโปรเจกต์ (ห้ามเรียก antd Button ตรงจากหน้า)
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";

export type ButtonProps = AntButtonProps;

/** variant ที่ใช้บ่อย: <Button type="primary"> (น้ำตาล) · <Button danger> · <Button type="text"> (ghost) */
export function Button(props: ButtonProps) {
  return <AntButton {...props} />;
}
