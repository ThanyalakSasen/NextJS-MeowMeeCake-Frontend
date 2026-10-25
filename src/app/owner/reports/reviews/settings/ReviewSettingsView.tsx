"use client";
// View ของ "ตั้งค่ารีวิว" (BACKLOG4 E4) — แท็บหัวข้อรีวิว · คำสำหรับวิเคราะห์ · ปุ่มกลับไปหน้ารายการรีวิว
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import type { SettingsTab, useReviewSettingsViewModel } from "./useReviewSettingsViewModel";
import { AspectsTab } from "./_components/AspectsTab";
import { RestoreDeletedButton } from "@/components/shared/restore";

// แท็บคำสำหรับวิเคราะห์แยก chunk — antd Tabs วาดเฉพาะแท็บที่เปิด โหลดเมื่อเปิดแท็บนั้นครั้งแรก
const TermsTab = dynamic(() => import("./_components/TermsTab").then((m) => m.TermsTab));

type VM = ReturnType<typeof useReviewSettingsViewModel>;

export function ReviewSettingsView(vm: VM) {
  const t = useTranslations();
  return (
    <TabbedPageLayout
      title={t("reviewSettings.title")}
      actions={
        <>
          <RestoreDeletedButton menu="reports_reviews" resources={["semanticTerms"]} />
          <Link href="/owner/reports/reviews">
            <Button icon={<ArrowLeftIcon className="h-4 w-4" />}>{t("reviewSettings.back")}</Button>
          </Link>
        </>
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
        { key: "terms", label: t("reviewSettings.tabTerms"), children: <TermsTab vm={vm} /> },
      ]}
    />
  );
}
