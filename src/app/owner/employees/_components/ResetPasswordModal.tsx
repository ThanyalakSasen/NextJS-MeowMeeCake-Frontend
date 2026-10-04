"use client";
// ─────────────────────────────────────────────────────────────
// ResetPasswordModal — เจ้าของร้านตั้งรหัสผ่านใหม่ให้พนักงาน (PUT /admin/users/{id}/password)
// ไม่ต้องรู้รหัสเดิม · backend ปลดล็อกบัญชีให้ด้วย (ใช้แทนการปลดล็อกได้ตอนพนักงานลืมรหัส)
// state: antd Form · submitting ครอบโดย VM — modal แค่ validate แล้วยิง onSave
// ─────────────────────────────────────────────────────────────
import { Modal } from "antd";
import type { Rule } from "antd/es/form";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, PasswordInput } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

export function ResetPasswordModal({
  target,
  saving,
  onClose,
  onSave,
}: {
  target: { id: string; name: string } | null;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, newPassword: string) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm();

  const passwordRules: Rule[] = [
    { required: true, message: t("validation.required") },
    { min: MIN_PASSWORD_LENGTH, message: t("employees.passwordMin", { n: MIN_PASSWORD_LENGTH }) },
  ];
  const confirmRules: Rule[] = [
    { required: true, message: t("validation.required") },
    ({ getFieldValue }) => ({
      validator(_, v) {
        return !v || v === getFieldValue("new_password")
          ? Promise.resolve()
          : Promise.reject(new Error(t("employees.passwordMismatch")));
      },
    }),
  ];

  const handleOk = async () => {
    if (!target) return;
    const { new_password } = await form.validateFields();
    onSave(target.id, new_password);
  };

  return (
    <Modal
      open={!!target}
      title={target ? t("employees.resetPasswordTitle", { name: target.name }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons("save")}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <p className="mb-3 text-sm text-gray-600">{t("employees.resetPasswordHint")}</p>
      <Form form={form} layout="vertical" preserve={false}>
        <FormItem
          name="new_password"
          label={t("employees.newPassword")}
          extra={t("employees.passwordMin", { n: MIN_PASSWORD_LENGTH })}
          rules={passwordRules}
        >
          <PasswordInput autoComplete="new-password" />
        </FormItem>
        <FormItem name="confirm_password" label={t("employees.confirmPassword")} dependencies={["new_password"]} rules={confirmRules}>
          <PasswordInput autoComplete="new-password" />
        </FormItem>
      </Form>
    </Modal>
  );
}
