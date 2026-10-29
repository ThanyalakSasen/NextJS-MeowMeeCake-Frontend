"use client";
// ฟิลด์ของฟอร์มพนักงาน — render ข้างใน <Form> (antd) เท่านั้น
// <FormItem> จัดการ label + error + validation ให้เอง
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Rule } from "antd/es/form";
import type { Dayjs } from "dayjs";
import { Form } from "antd";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button, Input, InputNumber, PasswordInput, Select, Switch, LazyDatePicker, FormItem } from "@/components/base";
import { isLinePlaceholderEmail } from "@/lib/lineAccount";
import { rolesService } from "@/services/roles";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { usePermissionCeiling } from "../usePermissionCeiling";
import { sortOptionsThai } from "@/lib/thaiSort";
import { generatePassword } from "./generatePassword";
import { ROLES_KEY } from "../employeesQuery";

/** currentRoleId = บทบาทเดิมของบัญชีที่แก้ — ไม่ย้ายบทบาท = backend ไม่ตรวจ จึงเลือกค้างไว้ได้เสมอ */
export function EmployeeFormFields({ isEdit = false, currentRoleId }: { isEdit?: boolean; currentRoleId?: string }) {
  const t = useTranslations();
  // key เดียวกับหน้ารายชื่อ — หน้าเพิ่มพนักงานดึงไว้ฝั่ง server แล้ว (addEmployee/page.tsx)
  const roles = useQuery({ queryKey: ROLES_KEY, queryFn: () => rolesService.list() });
  // เลือกได้เฉพาะตำแหน่งพนักงาน — ตัด role ลูกค้าออก (เหมือนหน้ารายชื่อ)
  const staffRoles = (roles.data?.data ?? []).filter((r) => r.role_type !== "customer");
  // ตำแหน่งที่สิทธิ์สูงกว่าเรา (รวม owner) ย้ายเข้าไม่ได้ — แสดงแต่ปิดไว้ (P4)
  const ceiling = usePermissionCeiling();
  const roleBlocked = (id: string) => id !== currentRoleId && !ceiling.roleWithin(id);
  // บัญชีที่สมัครผ่าน LINE ไม่มีอีเมลจริง (I10) — เตือนให้กรอกอีเมลจริงก่อนบันทึก (backend บังคับมีอีเมล)
  const email = Form.useWatch<string | undefined>("email");
  // ปุ่มสุ่มรหัสผ่าน (หน้าเพิ่มเท่านั้น) — สุ่มแล้วเปิดให้เห็นทันที เจ้าของร้านต้องอ่านไปบอกพนักงาน
  const form = Form.useFormInstance();
  const [showPassword, setShowPassword] = useState(false);
  const fillRandomPassword = () => {
    form.setFieldValue("password", generatePassword());
    setShowPassword(true);
    void form.validateFields(["password"]);
  };

  const required: Rule[] = [{ required: true, whitespace: true, message: t("validation.required") }];
  // backend (schemas/user.ts createUserBody) บังคับ email จริง (ไม่ optional) ทั้งตอนสร้างและแก้ไข
  const emailRule: Rule[] = [{ required: true, whitespace: true, message: t("validation.required") }, { type: "email", message: t("validation.email") }];
  // backend (schemas/common.ts phone) รับ 0 ตามด้วย 8–9 หลัก · ว่างได้
  const phoneRule: Rule[] = [{ pattern: /^0\d{8,9}$/, message: t("validation.phone") }];
  const nonNegative: Rule[] = [{ type: "number", min: 0, message: t("validation.nonNegative") }];
  // backend (schemas/user.ts createUserBody → userService.assertPasswordStrength) บังคับอย่างน้อย MIN_PASSWORD_LENGTH ตัวอักษร
  /** ข้อความช่วยใต้ช่อง — 16px (เล็กกว่าตัวอักษรของฟอร์ม ให้แยกจาก label/ค่าที่กรอกชัด) */
  const hint = (text: React.ReactNode) => <span className="text-[16px] leading-normal">{text}</span>;

  const passwordRule: Rule[] = [
    { required: true, whitespace: true, message: t("validation.required") },
    { min: MIN_PASSWORD_LENGTH, message: t("employees.passwordHint") },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 max-w-3xl">
      <FormItem name="user_fullname" label={t("fields.user_fullname")} rules={required}>
        <Input maxLength={120} />
      </FormItem>
      {/* เก็บแค่ตัวเลข — วาง "081-234-5678" ได้ */}
      <FormItem name="user_phone" label={t("fields.user_phone")} rules={phoneRule} normalize={(v?: string) => v?.replace(/\D/g, "").slice(0, 10)}>
        <Input type="tel" inputMode="numeric" />
      </FormItem>

      <FormItem
        name="email"
        label={t("fields.email")}
        rules={emailRule}
        extra={isLinePlaceholderEmail(email) ? hint(<span className="text-amber-700">{t("employees.lineNoEmail")}</span>) : undefined}
      >
        <Input maxLength={254} />
      </FormItem>
      {!isEdit && (
        // FormItem นอก (ไม่มี name) = label + hint + error · ตัวใน noStyle ผูกค่า — วางปุ่มข้างช่องได้
        // htmlFor ผูก label กับช่องจริง (antd ตั้ง id ของช่อง = ชื่อฟิลด์) — ไม่มี = ช่องรหัสผ่านไม่มีชื่อให้ screen reader
        <FormItem label={t("fields.password")} htmlFor="password" extra={hint(t("employees.passwordHint"))} required>
          <div className="flex gap-2">
            <FormItem name="password" rules={passwordRule} noStyle>
              <PasswordInput
                className="min-w-0 flex-1"
                autoComplete="new-password"
                visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
              />
            </FormItem>
            <Button icon={<ArrowPathIcon className="h-4 w-4" aria-hidden="true" />} onClick={fillRandomPassword} className="shrink-0">
              {t("employees.generatePassword")}
            </Button>
          </div>
        </FormItem>
      )}

      <FormItem
        name="role_id"
        label={t("fields.role_id")}
        rules={required}
        extra={!ceiling.isOwner && staffRoles.some((r) => roleBlocked(r._id)) ? hint(t("employees.roleBeyondHint")) : undefined}
      >
        <Select
          allowClear
          loading={roles.isPending}
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
        <InputNumber precision={0} min={0} />
      </FormItem>

      <FormItem name="start_working_date" label={t("fields.start_working_date")}>
        <LazyDatePicker />
      </FormItem>
      {/* วันสุดท้ายที่ทำงาน อยู่คอลัมน์ขวา ใต้วันเริ่มงาน (จอเล็กเป็นคอลัมน์เดียว — ต่อกันตามลำดับ) */}
      <FormItem
        name="last_working_date"
        label={t("fields.last_working_date")}
        className="md:col-start-2"
        dependencies={["start_working_date"]}
        rules={[
          ({ getFieldValue }) => ({
            validator: (_r, last: Dayjs | null | undefined) => {
              const start: Dayjs | null | undefined = getFieldValue("start_working_date");
              return !last || !start || !last.isBefore(start, "day")
                ? Promise.resolve()
                : Promise.reject(new Error(t("employees.lastBeforeStart")));
            },
          }),
        ]}
      >
        <LazyDatePicker />
      </FormItem>

      {/* สวิตช์ 2 ตัวอยู่แถวเดียวกัน: สถานะพนักงาน (ซ้าย) · อนุญาตให้เข้าสู่ระบบ (ขวา) */}
      <FormItem
        name="emp_status"
        label={t("fields.emp_status")}
        extra={hint(t("employees.fieldEmpStatusHint"))}
        valuePropName="checked"
      >
        <Switch />
      </FormItem>
      <FormItem
        name="is_active"
        label={t("employees.fieldCanLogin")}
        extra={hint(t("employees.fieldCanLoginHint"))}
        valuePropName="checked"
      >
        <Switch />
      </FormItem>
    </div>
  );
}
