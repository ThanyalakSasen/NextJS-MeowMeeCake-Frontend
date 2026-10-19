"use client";
// View ของ Production — JSX ล้วน รับ props จาก useProductionViewModel
// 3 แท็บ (แผนการผลิต/สถานะ/ประวัติ) sync กับ ?tab= ผ่าน TabbedPageLayout
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { TabbedPageLayout } from "@/components/shared/layout";
import { DetailDrawer } from "@/components/shared/feedback";
import type { useProductionViewModel } from "./useProductionViewModel";
import { PlanTab } from "./_components/PlanTab";

// โหลดเฉพาะส่วนที่เห็นตอนเปิดหน้า — แท็บอื่น/ฟอร์ม/ลิ้นชักแยก chunk โหลดเมื่อใช้ครั้งแรก (เดิม import ทั้งหมดตั้งแต่แรก)
// แท็บ: antd Tabs วาดเฉพาะแท็บที่เปิด · SSR ยังทำงาน (เปิดด้วย ?tab= ได้ HTML ครบ) · ลิ้นชัก/โมดัลไม่ render ฝั่ง server
// อยู่แล้ว (Portal ของ antd คืน null บน server) จึงปิด SSR ได้
const StatusTab = dynamic(() => import("./_components/StatusTab").then((m) => m.StatusTab));
const HistoryTab = dynamic(() => import("./_components/HistoryTab").then((m) => m.HistoryTab));
const ProductionOrderFormModal = dynamic(() => import("./_components/ProductionOrderFormModal").then((m) => m.ProductionOrderFormModal), { ssr: false });
const CreateFromRoundModal = dynamic(() => import("./_components/CreateFromRoundModal").then((m) => m.CreateFromRoundModal), { ssr: false });
const ProductionOrderDetail = dynamic(() => import("./_components/ProductionOrderDetail").then((m) => m.ProductionOrderDetail), { ssr: false });
const CompleteProductionModal = dynamic(() => import("./_components/CompleteProductionModal").then((m) => m.CompleteProductionModal), { ssr: false });

type VM = ReturnType<typeof useProductionViewModel>;

export function ProductionView(vm: VM) {
  const t = useTranslations();
  const createUsed = useOpenedOnce(vm.createOpen);
  const fromRoundUsed = useOpenedOnce(vm.createFromRoundOpen);

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

      {createUsed && (
        <ProductionOrderFormModal
          open={vm.createOpen}
          products={vm.productOptions}
          staff={vm.staff}
          saving={vm.creating}
          onClose={vm.closeCreate}
          onSubmit={vm.onCreateSubmit}
        />
      )}

      {fromRoundUsed && (
        <CreateFromRoundModal
          open={vm.createFromRoundOpen}
          rounds={vm.eligibleRounds}
          staff={vm.staff}
          saving={vm.creatingFromRound}
          onClose={vm.closeCreateFromRound}
          onSubmit={vm.onCreateFromRoundSubmit}
        />
      )}

      <DetailDrawer
        open={vm.drawerOpen}
        title={vm.selectedOrder ? t("production.drawerTitle", { no: vm.selectedOrder.production_no }) : ""}
        onClose={vm.closeDrawer}
      >
        {vm.isDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.isDetailNotFound && <p className="py-10 text-center text-gray-500">{t("production.orderNotFound")}</p>}
        {vm.selectedOrder && (
          <ProductionOrderDetail
            order={vm.selectedOrder}
            canUpdate={vm.perm.update}
            onAdvance={vm.onAdvanceStatus}
            onCancel={vm.onCancelOrder}
          />
        )}
      </DetailDrawer>

      {vm.completeTarget && (
        <CompleteProductionModal
          key={vm.completeTarget._id}
          order={vm.completeTarget}
          saving={vm.completing}
          onClose={vm.closeComplete}
          onSubmit={vm.onCompleteSubmit}
        />
      )}
    </>
  );
}
