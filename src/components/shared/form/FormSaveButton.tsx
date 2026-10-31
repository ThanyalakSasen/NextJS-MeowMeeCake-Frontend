"use client";
// ปุ่มบันทึกของฟอร์มเต็มหน้า (วางข้างใน <Form>) — กดได้เมื่อทุกช่องผ่าน rules แล้วเท่านั้น (ผู้ใช้ขอ 2026-10-31)
// ใช้แทน <SaveButton type="primary" htmlType="submit" /> · ฟอร์มใน Modal ใช้ useFormValid(form) กับ okButtonProps เอง
import { Form, useFormValid } from "@/components/base";
import { SaveButton } from "@/components/shared/actions";

export function FormSaveButton({ loading, disabled }: { loading?: boolean; disabled?: boolean }) {
  const form = Form.useFormInstance();
  const valid = useFormValid(form);
  return <SaveButton type="primary" htmlType="submit" loading={loading} disabled={disabled || !valid} />;
}
