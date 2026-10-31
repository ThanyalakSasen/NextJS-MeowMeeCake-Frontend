"use client";
import { useEffect, useState } from "react";
import { Form as AntForm, type FormInstance } from "antd";
// <Form> ของ antd — จัดการ state + validation ของฟอร์มทั้งก้อน
// ใช้กับ <FormItem name=... label=... rules={[...]}> ครอบ input จาก base/
export const Form = AntForm;
export const FormItem = AntForm.Item;
export const useAntForm = AntForm.useForm;

const ALL_VALUES = (values: unknown) => values;

/**
 * ฟอร์มผ่าน rules ครบทุกช่องหรือยัง (required + รูปแบบ) — ใช้ disable ปุ่มบันทึกจนกว่าจะกรอกถูกครบ (ผู้ใช้ขอ 2026-10-31)
 * ตรวจเงียบ ๆ (validateOnly — ไม่โชว์ error ใต้ช่องที่ยังไม่ได้แตะ) ทุกครั้งที่ค่าในฟอร์มเปลี่ยน
 * ข้อความเตือนใต้ช่องขึ้นทันทีตอนพิมพ์อยู่แล้ว (antd validateTrigger = onChange)
 *   const valid = useFormValid(form);
 *   okButtonProps={{ ...icons.okButtonProps, disabled: !valid }}
 * deps — state นอกฟอร์มที่ rules อ่าน (เช่น แถวรายการ) ให้ตรวจใหม่เมื่อเปลี่ยน
 */
export function useFormValid(form: FormInstance, deps: unknown[] = []): boolean {
  const values = AntForm.useWatch(ALL_VALUES, { form, preserve: true });
  const [valid, setValid] = useState(false);
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    // ยังไม่ผูกกับ <Form> (modal ปิดอยู่ · destroyOnHidden) → useWatch ไม่เคยได้ค่า — ไม่ตรวจ
    if (values === undefined) return;
    let alive = true;
    // ช่องเพิ่งลงทะเบียน (modal เพิ่งเปิด) — รอรอบถัดไปให้ฟิลด์ครบก่อนตรวจ
    const id = setTimeout(() => {
      form
        .validateFields({ validateOnly: true })
        .then(() => alive && setValid(true))
        .catch(() => alive && setValid(false));
    }, 0);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [form, values, depsKey]);
  return valid;
}
