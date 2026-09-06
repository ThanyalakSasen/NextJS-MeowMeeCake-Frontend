"use client";
// View ของ Production — JSX ล้วน รับ props จาก useProductionViewModel
// 3 แท็บ (แผนการผลิต/สถานะ/ประวัติ) sync กับ ?tab= ผ่าน TabbedPageLayout
import { useTranslations } from "next-intl";
import { TabbedPageLayout } from "@/components/shared/layout";
import { DetailDrawer } from "@/components/shared/feedback";
import type { useProductionViewModel } from "./useProductionViewModel";
import { PlanTab } from "./_components/PlanTab";
import { StatusTab } from "./_components/StatusTab";
import { HistoryTab } from "./_components/HistoryTab";
import { ProductionOrderFormModal } from "./_components/ProductionOrderFormModal";
import { ProductionOrderDetail } from "./_components/ProductionOrderDetail";

type VM = ReturnType<typeof useProductionViewModel>;

export function ProductionView(vm: VM) {
  const t = useTranslations();

  return (
    <>
      <TabbedPageLayout
        title={t("production.title")}
        activeKey={vm.activeTab}
        onChange={vm.setActiveTab}
        items={[
          { key: "plan", label: t("production.tabPlan"), children: <PlanTab {...vm} /> },
          { key: "status", label: t("production.tabStatus"), children: <StatusTab {...vm} /> },
          { key: "history", label: t("production.tabHistory"), children: <HistoryTab {...vm} /> },
        ]}
      />

      <ProductionOrderFormModal
        open={vm.createOpen}
        products={vm.productOptions}
        staff={vm.staff}
        saving={vm.creating}
        onClose={vm.closeCreate}
        onSubmit={vm.onCreateSubmit}
      />

      <DetailDrawer
        open={vm.drawerOpen}
        title={vm.selectedOrder ? t("production.drawerTitle", { no: vm.selectedOrder.production_no }) : ""}
        onClose={vm.closeDrawer}
      >
        {vm.selectedOrder && (
          <ProductionOrderDetail
            order={vm.selectedOrder}
            canUpdate={vm.perm.update}
            onAdvance={vm.onAdvanceStatus}
            onCancel={vm.onCancelOrder}
          />
        )}
      </DetailDrawer>
    </>
  );
}
