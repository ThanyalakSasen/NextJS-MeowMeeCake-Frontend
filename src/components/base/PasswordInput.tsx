"use client";
import { Input } from "antd";
import type { InputProps } from "antd";
/** ช่องรหัสผ่านมีปุ่ม show/hide */
export function PasswordInput(props: InputProps) {
  return <Input.Password {...props} />;
}
