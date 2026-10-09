"use client";
// Modal แก้ชื่อตำแหน่ง (Role) — แก้ได้แค่ชื่อ (ประเภทเปลี่ยนไม่ได้ — backend ตอบ 400)
// ชื่อซ้ำกับตำแหน่งอื่นกันไว้ก่อนส่ง · backend ตรวจซ้ำอีกชั้น (409)
import { useTranslations } from "next-intl";
import { Modal } from "antd";
import { Form, FormItem, useAntForm, Input } from "@/components/base";
import type { Rule } from "antd/es/form";
import type { Role } from "@/types/role";
import { modalButtonIcons } from "@/components/shared/actions";

/** ตรงกับ backend schemas/rbac.ts roleCreate.role_name */
const MAX_NAME = 60;

export function RenameRoleModal({
  role,
  roles,
  saving,
  onCancel,
  onSubmit,
}: {
  /** ตำแหน่งที่กำลังแก้ · null = ปิด */
  role: Role | null;
  roles: Role[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const t = useTranslations();
  const [form] = useAntForm<{ role_name: string }>();

  const rules: Rule[] = [
    { required: true, whitespace: true, message: t("validation.required") },
    {
      validator: (_, v: string | undefined) => {
        const name = (v ?? "").trim().toLowerCase();
        const taken = roles.some((r) => r._id !== role?._id && r.role_name.trim().toLowerCase() === name);
        return taken ? Promise.reject(new Error(t("permissions.roleNameTaken"))) : Promise.resolve();
      },
    },
  ];

  const handleOk = async () => {
    const { role_name } = await form.validateFields();
    await onSubmit(role_name.trim());
  };

  return (
    <Modal
      open={!!role}
      title={t("permissions.renameRoleTitle")}
      {...modalButtonIcons("save")}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      {role && (
        <Form form={form} layout="vertical" initialValues={{ role_name: role.role_name }}>
          <FormItem name="role_name" label={t("permissions.roleName")} rules={rules}>
            <Input maxLength={MAX_NAME} showCount placeholder={t("permissions.roleNamePlaceholder")} />
          </FormItem>
          <p className="m-0 text-xs text-gray-500">{t("permissions.renameRoleHint")}</p>
        </Form>
      )}
    </Modal>
  );
}
