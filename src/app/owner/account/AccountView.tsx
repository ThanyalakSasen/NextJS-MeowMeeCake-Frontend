"use client";
// View ของ "บัญชีของฉัน" หลังร้าน — 3 แท็บ (ข้อมูลของฉัน / เปลี่ยนรหัสผ่าน / ประวัติการทำงาน)
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { TabbedPageLayout } from "@/components/shared/layout";
import type { useAccountViewModel } from "./useAccountViewModel";
import { ProfileTab } from "./_components/ProfileTab";

// แท็บอื่นแยก chunk — antd Tabs วาดเฉพาะแท็บที่เปิด โหลดเมื่อเปิดแท็บนั้นครั้งแรก
// (ประวัติการทำงานมีตาราง/RangePicker/ลิ้นชัก · เปลี่ยนรหัสผ่านมีช่องรหัสผ่าน — ไม่ต้องโหลดตอนเปิดหน้า)
const PasswordTab = dynamic(() => import("./_components/PasswordTab").then((m) => m.PasswordTab));
const LogsTab = dynamic(() => import("./_components/LogsTab").then((m) => m.LogsTab));

type VM = ReturnType<typeof useAccountViewModel>;

export function AccountView(vm: VM) {
  const t = useTranslations("myAccount");
  return (
    <TabbedPageLayout
      title={t("title")}
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
