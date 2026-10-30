"use client";
// ส่วนบน: แผนการผลิต / ใบสั่งผลิต — presentational ล้วน รับ props จาก useProductionViewModel
// ปุ่มสร้างใบสั่งผลิต + การ์ด "วันนี้ผลิตอะไรบ้าง" (แยกตามใบ) · เอาสถิติ/ตัวกรอง/ตารางใบสั่งผลิตออก (ผู้ใช้ขอ 2026-10-30)
// ใบทั้งหมดดูได้ที่ส่วนประวัติการผลิตด้านล่าง · แก้ใบได้จากป๊อปอัปรายละเอียด (กดการ์ด/แถว)
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import type { useProductionViewModel } from "../useProductionViewModel";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { TodayProductionCard } from "./TodayProductionCard";

type VM = ReturnType<typeof useProductionViewModel>;

export function PlanTab(vm: VM) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("production.planDescription", { n: vm.planTotal })}</p>
        {vm.perm.create && (
          <div className="flex items-center gap-2">
            {/* ซ่อนปุ่ม "สร้างจากรอบพรีออเดอร์" ไว้ก่อน
            <Button icon={actionIcon("add")} onClick={vm.openCreateFromRound}>
              {t("production.createFromRound")}
            </Button>
            */}
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openCreate}>
              {t("production.createOrder")}
            </Button>
          </div>
        )}
      </div>

      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <TodayProductionCard
          today={vm.today}
          todayItems={vm.todayItems}
          todayOrders={vm.todayOrders}
          onView={vm.onView}
          canStart={vm.perm.update}
          onStart={vm.onStartOrder}
          startingId={vm.startingId}
          canFinish={vm.perm.approve}
          onFinish={vm.onFinishOrder}
        />
      )}
    </div>
  );
}
