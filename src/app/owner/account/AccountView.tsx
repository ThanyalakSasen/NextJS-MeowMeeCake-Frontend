"use client";
// View ของ "บัญชีของฉัน" หลังร้าน — 3 แท็บ (ข้อมูลของฉัน / เปลี่ยนรหัสผ่าน / ประวัติการทำงาน)
import { useTranslations } from "next-intl";
import { TabbedPageLayout } from "@/components/shared/layout";
import type { useAccountViewModel } from "./useAccountViewModel";
import { ProfileTab } from "./_components/ProfileTab";
import { PasswordTab } from "./_components/PasswordTab";
import { LogsTab } from "./_components/LogsTab";

type VM = ReturnType<typeof useAccountViewModel>;

export function AccountView(vm: VM) {
  const t = useTranslations("myAccount");
  return (
    <TabbedPageLayout
      title={t("title")}
      description={t("description")}
      activeKey={vm.tab}
      onChange={vm.setTab}
      items={[
        { key: "profile", label: t("tabProfile"), children: <ProfileTab {...vm} /> },
        { key: "password", label: t("tabPassword"), children: <PasswordTab {...vm} /> },
        { key: "logs", label: t("tabLogs"), children: <LogsTab {...vm} /> },
      ]}
    />
  );
}
