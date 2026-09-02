"use client";
// Modal เพิ่มตำแหน่ง (Role) ใหม่ — เลือกคัดลอกสิทธิ์จาก role เดิมได้
import { useTranslations } from "next-intl";
import { Modal } from "antd";
import { Form, FormItem, useAntForm, Input, Select } from "@/components/base";
import type { Rule } from "antd/es/form";
import type { Role } from "@/types/role";
import type { AddRoleValues } from "../usePermissionsViewModel";

export function RoleFormModal({
  open,
  roles,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  roles: Role[];
  onCancel: () => void;
  onSubmit: (values: AddRoleValues) => Promise<boolean>;
}) {
  const t = useTranslations();
  const [form] = useAntForm<AddRoleValues>();

  const required: Rule[] = [{ required: true, message: t("validation.required") }];

  const handleOk = async () => {
    const values = await form.validateFields();
    const ok = await onSubmit(values);
    if (ok) form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={t("permissions.addRole")}
      okText={t("common.create")}
      cancelText={t("common.cancel")}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ role_type: "staff" }}>
        <FormItem name="role_name" label={t("permissions.roleName")} rules={required}>
          <Input placeholder={t("permissions.roleNamePlaceholder")} />
        </FormItem>
        <FormItem name="role_type" label={t("permissions.roleType")} rules={required}>
          <Select
            options={[
              { value: "admin", label: t("permissions.roleTypeAdmin") },
              { value: "staff", label: t("permissions.roleTypeStaff") },
            ]}
          />
        </FormItem>
        <FormItem name="copyFrom" label={t("permissions.copyFrom")}>
          <Select
            allowClear
            placeholder={t("permissions.copyFromPlaceholder")}
            options={roles.map((r) => ({ value: r._id, label: r.role_name }))}
          />
        </FormItem>
      </Form>
    </Modal>
  );
}
