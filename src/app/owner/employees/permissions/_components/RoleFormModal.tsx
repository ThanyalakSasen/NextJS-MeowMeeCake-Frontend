"use client";
// Modal เพิ่มตำแหน่ง (Role) ใหม่ — เริ่มจากแม่แบบ (P6) หรือคัดลอกสิทธิ์จาก role เดิม (เลือกได้อย่างเดียว)
import { useTranslations } from "next-intl";
import { Modal } from "antd";
import { Form, FormItem, useAntForm, Input, Select } from "@/components/base";
import type { Rule } from "antd/es/form";
import type { Role } from "@/types/role";
import { modalButtonIcons } from "@/components/shared/actions";
import type { AddRoleValues } from "../usePermissionsViewModel";
import { ROLE_TEMPLATE_KEYS } from "../permissionGroups";
import { sortOptionsThai } from "@/lib/thaiSort";

/** canCopyFrom: คัดลอกได้เฉพาะตำแหน่งที่สิทธิ์ไม่เกินเรา (P4) — ตัวอื่นแสดงแต่ปิดไว้ */
export function RoleFormModal({
  open,
  roles,
  canCopyFrom,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  roles: Role[];
  canCopyFrom: (roleId: string) => boolean;
  onCancel: () => void;
  onSubmit: (values: AddRoleValues) => Promise<boolean>;
}) {
  const t = useTranslations();
  const [form] = useAntForm<AddRoleValues>();

  const required: Rule[] = [{ required: true, whitespace: true, message: t("validation.required") }];

  const handleOk = async () => {
    const values = await form.validateFields();
    const ok = await onSubmit(values);
    if (ok) form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={t("permissions.addRole")}
      {...modalButtonIcons("add")}
      okText={t("common.create")}
      cancelText={t("common.cancel")}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role_type: "staff" }}
        // แม่แบบกับคัดลอกเลือกได้อย่างเดียว — เลือกช่องหนึ่งแล้วล้างอีกช่อง
        onValuesChange={(changed: Partial<AddRoleValues>) => {
          if (changed.template) form.setFieldValue("copyFrom", undefined);
          if (changed.copyFrom) form.setFieldValue("template", undefined);
        }}
      >
        <FormItem name="role_name" label={t("permissions.roleName")} rules={required}>
          <Input placeholder={t("permissions.roleNamePlaceholder")} />
        </FormItem>
        <FormItem name="role_type" label={t("permissions.roleType")} rules={required}>
          <Select
            options={[
              { value: "staff", label: t("permissions.roleTypeStaff") },
            ]}
          />
        </FormItem>
        <FormItem name="template" label={t("permissions.template")} extra={t("permissions.templateHint")}>
          <Select
            allowClear
            placeholder={t("permissions.templatePlaceholder")}
            options={ROLE_TEMPLATE_KEYS.map((k) => ({ value: k, label: t(`permissions.templateName.${k}`) }))}
          />
        </FormItem>
        <FormItem name="copyFrom" label={t("permissions.copyFrom")}>
          <Select
            allowClear
            placeholder={t("permissions.copyFromPlaceholder")}
            options={sortOptionsThai(roles.map((r) => ({ value: r._id, label: r.role_name, disabled: !canCopyFrom(r._id) })))}
          />
        </FormItem>
      </Form>
    </Modal>
  );
}
