"use client";
// View ของ Production — JSX ล้วน รับ props จาก useProductionViewModel
// หน้าเดียว: แผนการผลิต/ใบสั่งผลิต ด้านบน · ประวัติการผลิต ด้านล่าง (เดิมแยก 2 แท็บ ?tab=plan / ?tab=history)
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { DashboardPageLayout } from "@/components/shared/layout";
import type { useProductionViewModel } from "./useProductionViewModel";

// โหลดเฉพาะส่วนที่เห็นตอนเปิดหน้า — ทุกแท็บ/ฟอร์ม/ลิ้นชักแยก chunk โหลดเมื่อใช้ครั้งแรก (เดิม import ทั้งหมดตั้งแต่แรก)
// แท็บ: antd Tabs วาดเฉพาะแท็บที่เปิด → โหลดแค่ chunk ของแท็บนั้น (เช่นเปิด ?tab=status ไม่ต้องโหลด Select/ตาราง
// ของแท็บแผนการผลิต) · SSR ยังทำงาน · ลิ้นชัก/โมดัลไม่ render ฝั่ง server อยู่แล้ว (Portal ของ antd คืน null) จึงปิด SSR ได้
const PlanTab = dynamic(() => import("./_components/PlanTab").then((m) => m.PlanTab));
// แท็บสถานะการผลิต (บอร์ดลากการ์ด) — ปิดไว้ก่อนตามที่ผู้ใช้ขอ · เก็บโค้ดไว้ เปิดคืนได้ (ดู TAB_KEYS ใน productionQuery.ts ด้วย)
// const StatusTab = dynamic(() => import("./_components/StatusTab").then((m) => m.StatusTab));
const HistoryTab = dynamic(() => import("./_components/HistoryTab").then((m) => m.HistoryTab));
const ProductionOrderFormModal = dynamic(() => import("./_components/ProductionOrderFormModal").then((m) => m.ProductionOrderFormModal), { ssr: false });
const CreateFromRoundModal = dynamic(() => import("./_components/CreateFromRoundModal").then((m) => m.CreateFromRoundModal), { ssr: false });
const ProductionOrderDetail = dynamic(() => import("./_components/ProductionOrderDetail").then((m) => m.ProductionOrderDetail), { ssr: false });
const DetailModal = dynamic(() => import("@/components/shared/feedback/DetailModal").then((m) => m.DetailModal), { ssr: false });
const CompleteProductionModal = dynamic(() => import("./_components/CompleteProductionModal").then((m) => m.CompleteProductionModal), { ssr: false });

type VM = ReturnType<typeof useProductionViewModel>;

export function ProductionView(vm: VM) {
  const t = useTranslations();
  const createUsed = useOpenedOnce(vm.createOpen);
  const fromRoundUsed = useOpenedOnce(vm.createFromRoundOpen);
  const drawerUsed = useOpenedOnce(vm.drawerOpen);

  return (
    <>
      <DashboardPageLayout title={t("production.title")}>
        {/* แท็บสถานะการผลิต (StatusTab) ยังปิดไว้ */}
        <section aria-labelledby="production-plan" className="flex flex-col gap-4">
          <h2 id="production-plan" className="m-0 text-lg font-semibold text-brown-900">{t("production.tabPlan")}</h2>
          <PlanTab {...vm} />
        </section>
        <section aria-labelledby="production-history" className="flex flex-col gap-4 border-t border-gray-200 pt-6">
          <h2 id="production-history" className="m-0 text-lg font-semibold text-brown-900">{t("production.tabHistory")}</h2>
          <HistoryTab {...vm} />
        </section>
      </DashboardPageLayout>

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

      {/* mount ใหม่ต่อใบ — ค่าเริ่มต้นของฟอร์มมาจากใบนั้น */}
      {vm.editTarget && (
        <ProductionOrderFormModal
          key={vm.editTarget._id}
          open
          editTarget={vm.editTarget}
          itemsEditable={vm.editItemsEditable}
          canAddItems={vm.editCanAddItems}
          canRemoveExisting={vm.perm.delete}
          products={vm.productOptions}
          staff={vm.staff}
          saving={vm.editing}
          onClose={vm.closeEdit}
          onSubmit={vm.onEditSubmit}
        />
      )}

      {fromRoundUsed && (
        <CreateFromRoundModal
          open={vm.createFromRoundOpen}
          rounds={vm.closedRounds}
          roundsLoading={vm.isClosedRoundsLoading}
          roundsWithProduction={vm.roundsWithProduction}
          roundId={vm.fromRoundId}
          onRoundChange={vm.setFromRoundId}
          preview={vm.fromRoundPreview}
          previewLoading={vm.isFromRoundPreviewLoading}
          previewError={vm.isFromRoundPreviewError}
          onRetryPreview={vm.refetchFromRoundPreview}
          staff={vm.staff}
          saving={vm.creatingFromRound}
          onClose={vm.closeCreateFromRound}
          onSubmit={vm.onCreateFromRoundSubmit}
        />
      )}

      {drawerUsed && (
        <DetailModal
          open={vm.drawerOpen}
          title={vm.selectedOrder ? t("production.drawerTitle", { no: vm.selectedOrder.production_no }) : ""}
          onClose={vm.closeDrawer}
        >
          {vm.isDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
          {vm.isDetailNotFound && <p className="py-10 text-center text-gray-500">{t("production.orderNotFound")}</p>}
          {vm.selectedOrder && (
            <ProductionOrderDetail
              order={vm.selectedOrder}
              roundQuota={vm.selectedRoundQuota}
              canUpdate={vm.perm.update}
              canComplete={vm.perm.approve}
              onAdvance={vm.onAdvanceStatus}
              onCancel={vm.onCancelOrder}
              onEdit={vm.openEdit}
            />
          )}
        </DetailModal>
      )}

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
