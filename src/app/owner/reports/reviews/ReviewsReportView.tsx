"use client";
// หน้า "รายงานความคิดเห็น" — หน้าเดียว 2 แท็บ (?tab= sync กับ URL): แดชบอร์ด (สรุป) · จัดการรีวิว (รายรีวิว)
// เดิมแยกเป็น 2 เมนู/2 หน้า · ปุ่มตั้งค่าหัวข้อรีวิวอยู่มุมขวาบนร่วมกันทั้ง 2 แท็บ
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import type { useReviewsViewModel } from "./useReviewsViewModel";
import type { useReviewDashboardViewModel } from "./dashboard/useReviewDashboardViewModel";
import { ReviewsView } from "./ReviewsView";
import { ReviewDashboardView } from "./dashboard/ReviewDashboardView";

export type ReviewsTab = "dashboard" | "manage";

export function ReviewsReportView({
  tab,
  onTab,
  manage,
  dashboard,
}: {
  tab: ReviewsTab;
  onTab: (tab: ReviewsTab) => void;
  manage: ReturnType<typeof useReviewsViewModel>;
  dashboard: ReturnType<typeof useReviewDashboardViewModel>;
}) {
  const t = useTranslations();
  return (
    <TabbedPageLayout
      title={t("reviews.title")}
      actions={
        <Link href="/owner/reports/reviews/settings">
          <Button icon={<Cog6ToothIcon className="h-4 w-4" />}>{t("reviews.settingsLink")}</Button>
        </Link>
      }
      activeKey={tab}
      onChange={(k) => onTab(k as ReviewsTab)}
      items={[
        {
          key: "dashboard",
          label: t("reviews.tabDashboard"),
          children: (
            <ReviewDashboardView
              {...dashboard}
              onViewUnreplied={() => {
                manage.showUnrepliedNegative();
                onTab("manage");
              }}
            />
          ),
        },
        { key: "manage", label: t("reviews.tabManage"), children: <ReviewsView {...manage} /> },
      ]}
    />
  );
}
