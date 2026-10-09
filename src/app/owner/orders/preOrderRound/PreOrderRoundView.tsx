"use client";
// View ของ Pre-order Round — 3 แท็บ (รอบพรีออเดอร์ / สรุปรอบ / คำสั่งซื้อเค้กวันเกิด) sync กับ ?tab= ผ่าน TabbedPageLayout
import { useTranslations } from "next-intl";
import { TabbedPageLayout } from "@/components/shared/layout";
import { DetailDrawer } from "@/components/shared/feedback";
import type { usePreOrderRoundViewModel } from "./usePreOrderRoundViewModel";
import { RoundsTab } from "./_components/RoundsTab";
import { OrdersTab } from "./_components/OrdersTab";
import { DashboardTab } from "./_components/DashboardTab";
import { RoundDashboardDrawer } from "./_components/RoundDashboardDrawer";
import { RoundFormModal } from "./_components/RoundFormModal";
import { EditRoundModal } from "./_components/EditRoundModal";
import { RoundItemFormModal } from "./_components/RoundItemFormModal";
import { RoundDetailContent } from "./_components/RoundDetailContent";
import { PreorderDetailContent } from "./_components/PreorderDetailContent";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function PreOrderRoundView(vm: VM) {
  const t = useTranslations();

  return (
    <>
      <TabbedPageLayout
        title={t("preorderRound.title")}
        description={t("preorderRound.description")}
        activeKey={vm.activeTab}
        onChange={vm.setActiveTab}
        items={[
          { key: "rounds", label: t("preorderRound.tabRounds"), children: <RoundsTab {...vm} /> },
          { key: "dashboard", label: t("preorderRound.tabDashboard"), children: <DashboardTab {...vm.dashboard} /> },
          { key: "orders", label: t("preorderRound.tabOrders"), children: <OrdersTab {...vm} /> },
        ]}
      />

      <RoundDashboardDrawer {...vm.dashboard} />

      <RoundFormModal
        open={vm.createRoundOpen}
        products={vm.preorderProducts}
        saving={vm.creatingRound}
        onClose={vm.closeCreateRound}
        onSubmit={vm.onCreateRoundSubmit}
      />

      <DetailDrawer
        open={vm.roundDrawerOpen}
        title={vm.selectedRound ? vm.selectedRound.round_name : ""}
        onClose={vm.closeRoundDrawer}
        size={520}
      >
        {vm.isRoundDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.selectedRound && !vm.isRoundDetailLoading && <RoundDetailContent {...vm} round={vm.selectedRound} />}
      </DetailDrawer>

      {vm.selectedRound && (
        <>
          <EditRoundModal
            open={vm.editRoundOpen}
            round={vm.selectedRound}
            saving={vm.savingRound}
            onClose={vm.closeEditRound}
            onSubmit={vm.onEditRoundSubmit}
          />
          <RoundItemFormModal
            open={vm.itemFormOpen}
            round={vm.selectedRound}
            item={vm.editingItem}
            products={vm.preorderProducts}
            saving={vm.savingItem}
            onClose={vm.closeItemForm}
            onSubmit={(body) => vm.onSubmitItemForm(vm.selectedRound!._id, body)}
          />
        </>
      )}

      <DetailDrawer
        open={vm.orderDrawerOpen}
        title={vm.selectedOrder ? t("preorderRound.orderDrawerTitle", { no: vm.selectedOrder.preorder_no }) : ""}
        onClose={vm.closeOrderDrawer}
      >
        {vm.isOrderDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.isOrderDetailError && !vm.isOrderDetailLoading && <p className="py-10 text-center text-gray-500">{t("orders.orderNotFound")}</p>}
        {vm.selectedOrder && !vm.isOrderDetailLoading && <PreorderDetailContent {...vm} order={vm.selectedOrder} />}
      </DetailDrawer>
    </>
  );
}
