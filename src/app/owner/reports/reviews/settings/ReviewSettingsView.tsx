"use client";
// View ของ "ตั้งค่ารีวิว" (BACKLOG4 E4) — แท็บหัวข้อรีวิว · คำสำหรับวิเคราะห์ · ปุ่มกลับไปหน้ารายการรีวิว
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import { LoadingSpin } from "@/components/shared/feedback";
import { RetryButton } from "@/components/shared/actions";
import type { SettingsTab, useReviewSettingsViewModel } from "./useReviewSettingsViewModel";
import { AspectsTab } from "./_components/AspectsTab";
import { TermsTab } from "./_components/TermsTab";

type VM = ReturnType<typeof useReviewSettingsViewModel>;

export function ReviewSettingsView(vm: VM) {
  const t = useTranslations();
  return (
    <TabbedPageLayout
      title={t("reviewSettings.title")}
      description={t("reviewSettings.description")}
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
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-gray-600">{t("common.loadFailed")}</p>
              <RetryButton onClick={() => vm.refetchAspects()} />
            </div>
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
