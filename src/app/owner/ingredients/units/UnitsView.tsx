"use client";
// View ของ Manage Units — 2 คอลัมน์: หน่วยวัตถุดิบ | หน่วยสินค้า
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { DashboardPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import type { useUnitsViewModel } from "./useUnitsViewModel";
import { UnitListCard } from "./_components/UnitListCard";
import { RestoreDeletedButton } from "@/components/shared/restore";

// ฟอร์ม/โมดัลแยก chunk — โหลดเมื่อเปิดครั้งแรก ไม่ต้อง parse/รันตอนเปิดหน้า (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const UnitFormModal = dynamic(() => import("./_components/UnitFormModal").then((m) => m.UnitFormModal), { ssr: false });

type VM = ReturnType<typeof useUnitsViewModel>;

export function UnitsView(vm: VM) {
  const t = useTranslations();
  const formUsed = useOpenedOnce(vm.modalOpen);

  return (
    <DashboardPageLayout title={t("units.title")} actions={<RestoreDeletedButton menu="units" resources={["units"]} />}>
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UnitListCard
            title={t("units.ingredientGroup")}
            description={t("units.ingredientGroupDesc")}
            units={vm.ingredientUnits}
            canCreate={vm.perm.create}
            canUpdate={vm.perm.update}
            canDelete={vm.perm.delete}
            onAdd={() => vm.openAdd("ingredient")}
            onEdit={vm.openEdit}
            onDelete={vm.onDelete}
          />
          <UnitListCard
            title={t("units.productGroup")}
            description={t("units.productGroupDesc")}
            units={vm.productUnits}
            canCreate={vm.perm.create}
            canUpdate={vm.perm.update}
            canDelete={vm.perm.delete}
            onAdd={() => vm.openAdd("product")}
            onEdit={vm.openEdit}
            onDelete={vm.onDelete}
          />
        </div>
      )}

      {formUsed && (
        <UnitFormModal
          open={vm.modalOpen}
          editTarget={vm.editTarget}
          defaultContext={vm.defaultContext}
          saving={vm.saving}
          onClose={vm.closeModal}
          onSubmit={vm.onSubmit}
        />
      )}
    </DashboardPageLayout>
  );
}
