"use client";
// View ของ Attendance — นาฬิกาเช็คอิน/เช็คเอาท์ + ประวัติการเข้างานของตัวเอง
import { useTranslations } from "next-intl";
import { ClockIcon } from "@heroicons/react/24/solid";
import { DashboardPageLayout } from "@/components/shared/layout";
import type { useAttendanceViewModel } from "./useAttendanceViewModel";
import { ClockCard } from "./_components/ClockCard";
import { AttendanceHistoryTable } from "./_components/AttendanceHistoryTable";

type VM = ReturnType<typeof useAttendanceViewModel>;

export function AttendanceView(vm: VM) {
  const t = useTranslations();

  return (
    <DashboardPageLayout
      title={t("attendance.title")}
      description={
        vm.userName ? t("attendance.descriptionUser", { name: vm.userName }) : t("attendance.description")
      }
    >
      <ClockCard
        today={vm.today}
        canCheckIn={vm.canCheckIn}
        canCheckOut={vm.canCheckOut}
        acting={vm.acting}
        onCheckIn={vm.onCheckIn}
        onCheckOut={vm.onCheckOut}
      />

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-brown-800">{t("attendance.historyTitle")}</p>
        </div>
        <div className="p-3">
          <AttendanceHistoryTable rows={vm.history} loading={vm.isLoading} />
        </div>
      </div>
    </DashboardPageLayout>
  );
}
