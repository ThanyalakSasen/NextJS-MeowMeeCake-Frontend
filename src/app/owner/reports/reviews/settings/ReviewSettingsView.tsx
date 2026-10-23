"use client";
// View ของ "ตั้งค่ารีวิว" (BACKLOG4 E4) — แท็บหัวข้อรีวิว · ปุ่มกลับไปหน้ารายการรีวิว
// แท็บ "คำสำหรับวิเคราะห์" (./_components/TermsTab) ซ่อนไว้ก่อน — ยังไม่มีระบบวิเคราะห์ข้อความที่อ่านคำเหล่านี้ไปใช้
//   (backend เก็บอย่างเดียว) · จะเปิดกลับ: ใส่ { key: "terms", ... } คืนใน items
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import type { SettingsTab, useReviewSettingsViewModel } from "./useReviewSettingsViewModel";
import { AspectsTab } from "./_components/AspectsTab";

type VM = ReturnType<typeof useReviewSettingsViewModel>;

export function ReviewSettingsView(vm: VM) {
  const t = useTranslations();
  return (
    <TabbedPageLayout
      title={t("reviewSettings.title")}
      actions={
        <Link href="/owner/reports/reviews">
          <Button icon={<ArrowLeftIcon className="h-4 w-4" />}>{t("reviewSettings.back")}</Button>
        </Link>
      }
      activeKey={vm.tab}
      onChange={(k) => vm.setTab(k as SettingsTab)}
      items={[
        {
          key: "aspects",
          label: t("reviewSettings.tabAspects"),
          children: vm.aspectsError ? (
            <LoadFailed onRetry={vm.refetchAspects} />
          ) : vm.aspectsLoading ? (
            <LoadingSpin />
          ) : (
            <AspectsTab vm={vm} />
          ),
        },
      ]}
    />
  );
}
