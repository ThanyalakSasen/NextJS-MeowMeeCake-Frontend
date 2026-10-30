"use client";
// แท็บ "เปลี่ยนรหัสผ่าน" — ต้องรู้รหัสเดิม · บัญชีที่สมัครด้วย Google/LINE ไม่มีรหัสผ่าน → แสดงคำอธิบายแทนฟอร์ม
import { useTranslations } from "next-intl";
import { Button, Card, PasswordInput } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { LoadingSpin } from "@/components/shared/feedback";
import type { useAccountViewModel } from "../useAccountViewModel";
import { actionIcon } from "@/components/shared/actions";

type VM = ReturnType<typeof useAccountViewModel>;

const PROVIDER_LABEL = { google: "Google", line: "LINE" } as const;

export function PasswordTab(vm: VM) {
  const tm = useTranslations("myAccount");

  if (vm.profileLoading) return <LoadingSpin />;
  const provider = vm.profile?.auth_provider;

  return (
    <Card className="flex max-w-xl flex-col gap-4 p-5">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="m-0 text-base font-semibold text-brown-900">{tm("tabPassword")}</h2>
        <p className="m-0 mt-1 text-sm text-gray-500">{tm("passwordDescription")}</p>
      </div>

      {provider === "google" || provider === "line" ? (
        <p className="m-0 text-sm text-gray-600">{tm("socialAccount", { provider: PROVIDER_LABEL[provider] })}</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (vm.canChangePassword) vm.onChangePassword();
          }}
        >
          <FormField label={tm("currentPassword")} required>
            <PasswordInput
              autoComplete="current-password"
              maxLength={vm.maxPassword}
              value={vm.passwords.current}
              onChange={(e) => vm.setPassword("current", e.target.value)}
            />
          </FormField>
          <FormField label={tm("newPassword")} required>
            <PasswordInput
              autoComplete="new-password"
              maxLength={vm.maxPassword}
              value={vm.passwords.next}
              onChange={(e) => vm.setPassword("next", e.target.value)}
            />
          </FormField>
          <FormField label={tm("confirmPassword")} required error={vm.passwordError ?? undefined}>
            <PasswordInput
              autoComplete="new-password"
              maxLength={vm.maxPassword}
              value={vm.passwords.confirm}
              onChange={(e) => vm.setPassword("confirm", e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button icon={actionIcon("save")} type="primary" htmlType="submit" disabled={!vm.canChangePassword} loading={vm.changingPassword}>
              {tm("tabPassword")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
