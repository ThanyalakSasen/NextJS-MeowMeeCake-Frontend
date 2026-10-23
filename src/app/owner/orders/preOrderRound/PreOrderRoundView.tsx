"use client";
// View ของ Pre-order Round — 3 แท็บ (รอบพรีออเดอร์ / สรุปรอบ / คำสั่งซื้อพรีออเดอร์) sync กับ ?tab= ผ่าน TabbedPageLayout
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { TabbedPageLayout } from "@/components/shared/layout";
import { DetailModal } from "@/components/shared/feedback";
import type { usePreOrderRoundViewModel } from "./usePreOrderRoundViewModel";
import { RoundsTab } from "./_components/RoundsTab";

// โหลดเฉพาะส่วนที่เห็นตอนเปิดหน้า (แท็บรอบ) — แท็บอื่น/โมดัล/ลิ้นชัก (Form, DatePicker, Steps …) แยก chunk
// โหลดเมื่อใช้ครั้งแรก · เดิม import ทั้งหมดตั้งแต่แรก → JS ที่ต้อง parse/รันตอนโหลดหน้าเยอะ (TBT 420ms)
// แท็บ: antd Tabs วาดเฉพาะแท็บที่เปิด → chunk แท็บอื่นยังไม่โหลด · SSR ยังทำงาน (เปิดด้วย ?tab= ได้ HTML ครบ)
const DashboardTab = dynamic(() => import("./_components/DashboardTab").then((m) => m.DashboardTab));
const OrdersTab = dynamic(() => import("./_components/OrdersTab").then((m) => m.OrdersTab));
const RoundDashboardDrawer = dynamic(() => import("./_components/RoundDashboardDrawer").then((m) => m.RoundDashboardDrawer), { ssr: false });
const RoundFormModal = dynamic(() => import("./_components/RoundFormModal").then((m) => m.RoundFormModal), { ssr: false });
const EditRoundModal = dynamic(() => import("./_components/EditRoundModal").then((m) => m.EditRoundModal), { ssr: false });
const ReopenRoundModal = dynamic(() => import("./_components/ReopenRoundModal").then((m) => m.ReopenRoundModal), { ssr: false });
const RoundItemFormModal = dynamic(() => import("./_components/RoundItemFormModal").then((m) => m.RoundItemFormModal), { ssr: false });
const RoundDetailContent = dynamic(() => import("./_components/RoundDetailContent").then((m) => m.RoundDetailContent), { ssr: false });
const PreorderDetailContent = dynamic(() => import("./_components/PreorderDetailContent").then((m) => m.PreorderDetailContent), { ssr: false });

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function PreOrderRoundView(vm: VM) {
  const t = useTranslations();
  const dashboardDrawerUsed = useOpenedOnce(!!vm.dashboard.selected);
  const createUsed = useOpenedOnce(vm.createRoundOpen);
  const editUsed = useOpenedOnce(vm.editRoundOpen);
  const reopenUsed = useOpenedOnce(vm.reopenOpen);
  const itemFormUsed = useOpenedOnce(vm.itemFormOpen);

  return (
    <>
      <TabbedPageLayout
        title={t("preorderRound.title")}
        activeKey={vm.activeTab}
        onChange={vm.setActiveTab}
        items={[
          { key: "rounds", label: t("preorderRound.tabRounds"), children: <RoundsTab {...vm} /> },
          { key: "dashboard", label: t("preorderRound.tabDashboard"), children: <DashboardTab {...vm.dashboard} /> },
          { key: "orders", label: t("preorderRound.tabOrders"), children: <OrdersTab {...vm} /> },
        ]}
      />

      {dashboardDrawerUsed && <RoundDashboardDrawer {...vm.dashboard} />}

      {createUsed && (
        <RoundFormModal
          open={vm.createRoundOpen}
          products={vm.preorderProducts}
          saving={vm.creatingRound}
          onClose={vm.closeCreateRound}
          onSubmit={vm.onCreateRoundSubmit}
        />
      )}

      <DetailModal
        open={vm.roundDrawerOpen}
        title={vm.selectedRound ? vm.selectedRound.round_name : ""}
        onClose={vm.closeRoundDrawer}
        size={520}
      >
        {vm.isRoundDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.selectedRound && !vm.isRoundDetailLoading && <RoundDetailContent {...vm} round={vm.selectedRound} />}
      </DetailModal>

      {vm.selectedRound && (
        <>
          {editUsed && (
            <EditRoundModal
              open={vm.editRoundOpen}
              round={vm.selectedRound}
              saving={vm.savingRound}
              onClose={vm.closeEditRound}
              onSubmit={vm.onEditRoundSubmit}
            />
          )}
          {reopenUsed && (
            <ReopenRoundModal
              open={vm.reopenOpen}
              round={vm.selectedRound}
              saving={vm.changingRoundStatus}
              onClose={vm.closeReopen}
              onSubmit={vm.onReopenSubmit}
            />
          )}
          {itemFormUsed && (
            <RoundItemFormModal
              open={vm.itemFormOpen}
              round={vm.selectedRound}
              item={vm.editingItem}
              products={vm.preorderProducts}
              saving={vm.savingItem}
              onClose={vm.closeItemForm}
              onSubmit={(body) => vm.onSubmitItemForm(vm.selectedRound!._id, body)}
            />
          )}
        </>
      )}

      <DetailModal
        open={vm.orderDrawerOpen}
        title={vm.selectedOrder ? t("preorderRound.orderDrawerTitle", { no: vm.selectedOrder.preorder_no }) : ""}
        onClose={vm.closeOrderDrawer}
      >
        {vm.isOrderDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.isOrderDetailError && !vm.isOrderDetailLoading && <p className="py-10 text-center text-gray-500">{t("orders.orderNotFound")}</p>}
        {vm.selectedOrder && !vm.isOrderDetailLoading && <PreorderDetailContent {...vm} order={vm.selectedOrder} />}
      </DetailModal>
    </>
  );
}
