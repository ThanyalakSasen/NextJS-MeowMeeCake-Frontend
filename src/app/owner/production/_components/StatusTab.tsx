"use client";
// แท็บ 2: สถานะการผลิต — kanban board (ลากการ์ดเปลี่ยนสถานะ) · ดูทีละวันตามวันที่ผลิต เลือกวันจากปฏิทินมุมขวา
// ใบของวันก่อนที่ยังไม่เสร็จ/ไม่ถูกยกเลิก ค้างอยู่บนบอร์ด (ดู useProductionViewModel.statusOrders)
import type { Dayjs } from "dayjs";
import { useTranslations } from "next-intl";
import { DatePicker } from "@/components/base";
import { LoadingSpin } from "@/components/shared/feedback";
import type { useProductionViewModel } from "../useProductionViewModel";
import { StatusBoard } from "./StatusBoard";

type VM = ReturnType<typeof useProductionViewModel>;

export function StatusTab(vm: VM) {
  const t = useTranslations();

  if (vm.isLoading) return <LoadingSpin />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-gray-600">{t("production.statusDescription")}</p>
        <DatePicker
          value={vm.statusDate}
          onChange={(d) => d && vm.setStatusDate(d as Dayjs)}
          allowClear={false}
          style={{ width: 170 }}
        />
      </div>
      <StatusBoard
        orders={vm.statusOrders}
        boardDate={vm.statusDate}
        canUpdate={vm.perm.update}
        onCardClick={vm.onView}
        onDrop={vm.onChangeStatus}
      />
    </div>
  );
}
