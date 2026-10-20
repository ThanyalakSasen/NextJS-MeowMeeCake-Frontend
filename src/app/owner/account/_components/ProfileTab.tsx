"use client";
// แท็บ "ข้อมูลของฉัน" — โหมดดู/แก้ไขในการ์ดเดียว (ปุ่มแก้ไข/ยกเลิก/บันทึกที่หัวการ์ด แบบหน้าข้อมูลร้าน)
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Input, LazyDatePicker } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { isLinePlaceholderEmail } from "@/lib/lineAccount";
import type { useAccountViewModel } from "../useAccountViewModel";

type VM = ReturnType<typeof useAccountViewModel>;

export function ProfileTab(vm: VM) {
  const t = useTranslations();
  const tm = useTranslations("myAccount");
  const locale = useLocale();

  if (vm.profileFailed) return <LoadFailed onRetry={vm.refetchProfile} />;
  if (vm.profileLoading || !vm.profile) return <LoadingSpin />;

  const p = vm.profile;
  const err = (field: string) => (vm.profileError?.field === field ? vm.profileError.message : undefined);
  const readOnly = (label: string, value: string | null | undefined) => (
    <FormField label={label}>
      <p className="m-0 min-h-9 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 font-medium text-gray-800">
        {value || <span className="font-normal text-gray-500">{tm("notSet")}</span>}
      </p>
    </FormField>
  );

  return (
    <Card className="flex max-w-3xl flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-base font-semibold text-brown-900">{tm("profileTitle")}</h2>
          <p className="m-0 mt-1 text-sm text-gray-500">{tm("profileDescription")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {vm.editing ? (
            <>
              <Button size="small" onClick={vm.cancelEdit} disabled={vm.savingProfile}>
                {t("common.cancel")}
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={vm.onSaveProfile}
                loading={vm.savingProfile}
                disabled={!!vm.profileError}
              >
                {t("common.save")}
              </Button>
            </>
          ) : (
            <Button size="small" onClick={vm.startEdit}>
              {t("common.edit")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {vm.editing ? (
          <>
            <FormField label={tm("fullName")} required error={err("name")}>
              <Input value={vm.form.name} maxLength={120} onChange={(e) => vm.setFormField("name", e.target.value)} />
            </FormField>
            <FormField label={tm("phone")} error={err("phone")}>
              <Input
                value={vm.form.phone}
                inputMode="tel"
                maxLength={10}
                placeholder="0812345678"
                onChange={(e) => vm.setFormField("phone", e.target.value.replace(/\D/g, ""))}
              />
            </FormField>
            <FormField label={tm("birthday")} error={err("birthday")}>
              {/* โหลดปฏิทินเมื่อกด (base/LazyDatePicker) — ไม่ต้อง hydrate DatePicker ของ antd ตอนเปิดหน้า */}
              <LazyDatePicker
                value={vm.form.birthday}
                disabledDate={(d) => d.isAfter(new Date(), "day")}
                onChange={(d) => vm.setFormField("birthday", Array.isArray(d) ? null : d)}
              />
            </FormField>
          </>
        ) : (
          <>
            {readOnly(tm("fullName"), p.user_fullname)}
            {readOnly(tm("phone"), p.user_phone)}
            {readOnly(tm("birthday"), p.user_birthdate ? formatDate(p.user_birthdate, locale) : null)}
          </>
        )}
        {readOnly(tm("email"), isLinePlaceholderEmail(p.email) ? null : p.email)}
        {readOnly(tm("role"), vm.roleName)}
      </div>
    </Card>
  );
}
