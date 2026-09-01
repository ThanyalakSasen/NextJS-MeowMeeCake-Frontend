"use client";
// View ของ Manage Units — 2 คอลัมน์: หน่วยวัตถุดิบ | หน่วยสินค้า
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { LoadingSpin } from "@/components/shared/feedback";
import type { useUnitsViewModel } from "./useUnitsViewModel";
import { UnitListCard } from "./_components/UnitListCard";
import { UnitFormModal } from "./_components/UnitFormModal";

type VM = ReturnType<typeof useUnitsViewModel>;

export function UnitsView(vm: VM) {
  const t = useTranslations();

  return (
    <DashboardPageLayout title={t("units.title")} description={t("units.description")}>
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
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

      <UnitFormModal
        open={vm.modalOpen}
        editTarget={vm.editTarget}
        defaultContext={vm.defaultContext}
        saving={vm.saving}
        onClose={vm.closeModal}
        onSubmit={vm.onSubmit}
      />
    </DashboardPageLayout>
  );
}
