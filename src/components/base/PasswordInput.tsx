"use client";
import { Input } from "antd";
import type { PasswordProps } from "antd/es/input";
/** ช่องรหัสผ่านมีปุ่ม show/hide — คุมการแสดงจากข้างนอกได้ด้วย visibilityToggle={{ visible, onVisibleChange }} */
export function PasswordInput(props: PasswordProps) {
  return <Input.Password {...props} />;
}
