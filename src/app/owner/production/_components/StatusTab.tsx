"use client";
// แท็บ 2: สถานะการผลิต — kanban board (ลากการ์ดเปลี่ยนสถานะ)
import { useTranslations } from "next-intl";
import { LoadingSpin } from "@/components/shared/feedback";
import type { useProductionViewModel } from "../useProductionViewModel";
import { StatusBoard } from "./StatusBoard";

type VM = ReturnType<typeof useProductionViewModel>;

export function StatusTab(vm: VM) {
  const t = useTranslations();

  if (vm.isLoading) return <LoadingSpin />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base text-gray-600">{t("production.statusDescription")}</p>
      <StatusBoard
        orders={vm.orders}
        canUpdate={vm.perm.update}
        onCardClick={vm.onView}
        onDrop={vm.onChangeStatus}
      />
    </div>
  );
}
