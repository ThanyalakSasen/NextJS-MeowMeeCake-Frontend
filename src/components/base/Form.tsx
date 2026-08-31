"use client";
import { Form as AntForm } from "antd";
// <Form> ของ antd — จัดการ state + validation ของฟอร์มทั้งก้อน
// ใช้กับ <FormItem name=... label=... rules={[...]}> ครอบ input จาก base/
export const Form = AntForm;
export const FormItem = AntForm.Item;
export const useAntForm = AntForm.useForm;
