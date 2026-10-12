"use client";
// ฟิลด์ของฟอร์มพนักงาน — render ข้างใน <Form> (antd) เท่านั้น
// <FormItem> จัดการ label + error + validation ให้เอง
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Rule } from "antd/es/form";
import { Form } from "antd";
import { Input, InputNumber, PasswordInput, Select, Switch, DatePicker, FormItem } from "@/components/base";
import { isLinePlaceholderEmail } from "@/lib/lineAccount";
import { rolesService } from "@/services/roles";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { usePermissionCeiling } from "../usePermissionCeiling";
import { sortOptionsThai } from "@/lib/thaiSort";

/** currentRoleId = บทบาทเดิมของบัญชีที่แก้ — ไม่ย้ายบทบาท = backend ไม่ตรวจ จึงเลือกค้างไว้ได้เสมอ */
export function EmployeeFormFields({ isEdit = false, currentRoleId }: { isEdit?: boolean; currentRoleId?: string }) {
  const t = useTranslations();
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list() });
  // เลือกได้เฉพาะตำแหน่งพนักงาน — ตัด role ลูกค้าออก (เหมือนหน้ารายชื่อ)
  const staffRoles = (roles.data?.data ?? []).filter((r) => r.role_type !== "customer");
  // ตำแหน่งที่สิทธิ์สูงกว่าเรา (รวม owner) ย้ายเข้าไม่ได้ — แสดงแต่ปิดไว้ (P4)
  const ceiling = usePermissionCeiling();
  const roleBlocked = (id: string) => id !== currentRoleId && !ceiling.roleWithin(id);
  // บัญชีที่สมัครผ่าน LINE ไม่มีอีเมลจริง (I10) — เตือนให้กรอกอีเมลจริงก่อนบันทึก (backend บังคับมีอีเมล)
  const email = Form.useWatch<string | undefined>("email");

  const required: Rule[] = [{ required: true, message: t("validation.required") }];
  // backend (schemas/user.ts createUserBody) บังคับ email จริง (ไม่ optional) ทั้งตอนสร้างและแก้ไข
  const emailRule: Rule[] = [{ required: true, message: t("validation.required") }, { type: "email", message: t("validation.email") }];
  const nonNegative: Rule[] = [{ type: "number", min: 0, message: t("validation.nonNegative") }];
  // backend (schemas/user.ts createUserBody → userService.assertPasswordStrength) บังคับอย่างน้อย MIN_PASSWORD_LENGTH ตัวอักษร
  const passwordRule: Rule[] = [
    { required: true, message: t("validation.required") },
    { min: MIN_PASSWORD_LENGTH, message: t("employees.passwordHint") },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 max-w-3xl">
      <FormItem name="user_fullname" label={t("fields.user_fullname")} rules={required}>
        <Input />
      </FormItem>
      <FormItem name="user_phone" label={t("fields.user_phone")}>
        <Input />
      </FormItem>

      <FormItem
        name="email"
        label={t("fields.email")}
        rules={emailRule}
        extra={isLinePlaceholderEmail(email) ? <span className="text-amber-600">{t("employees.lineNoEmail")}</span> : undefined}
      >
        <Input />
      </FormItem>
      {!isEdit && (
        <FormItem name="password" label={t("fields.password")} extra={t("employees.passwordHint")} rules={passwordRule}>
          <PasswordInput />
        </FormItem>
      )}

      <FormItem
        name="role_id"
        label={t("fields.role_id")}
        rules={required}
        extra={!ceiling.isOwner && staffRoles.some((r) => roleBlocked(r._id)) ? t("employees.roleBeyondHint") : undefined}
      >
        <Select
          allowClear
          loading={roles.isLoading}
          options={sortOptionsThai(staffRoles.map((r) => ({ value: r._id, label: r.role_name, disabled: roleBlocked(r._id) })))}
        />
      </FormItem>

      <FormItem name="employment_type" label={t("fields.employment_type")}>
        <Select
          options={[
            { value: "full_time", label: t("enums.employmentType.full_time") },
            { value: "part_time", label: t("enums.employmentType.part_time") },
          ]}
        />
      </FormItem>
      <FormItem name="emp_salary" label={t("fields.emp_salary")} rules={nonNegative}>
        <InputNumber min={0} />
      </FormItem>

      <FormItem name="start_working_date" label={t("fields.start_working_date")}>
        <DatePicker />
      </FormItem>
      <FormItem name="last_working_date" label={t("fields.last_working_date")}>
        <DatePicker />
      </FormItem>

      <FormItem
        name="is_active"
        label={t("employees.fieldCanLogin")}
        extra={t("employees.fieldCanLoginHint")}
        valuePropName="checked"
      >
        <Switch />
      </FormItem>
      <FormItem
        name="emp_status"
        label={t("fields.emp_status")}
        extra={t("employees.fieldEmpStatusHint")}
        valuePropName="checked"
      >
        <Switch />
      </FormItem>
    </div>
  );
}
