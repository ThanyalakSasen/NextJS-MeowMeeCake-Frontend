"use client";
// View ของ POS หน้าร้าน — ตามดีไซน์ใหม่ (เฉพาะส่วนเนื้อหา — header/เมนูใช้ OwnerLayout ของแอป):
// ซ้าย = ช่อง "สแกน / ค้นหา" + บิลปัจจุบัน · ขวา = โปรโมชัน + สรุปยอด + ปุ่มชำระ · หน้าต่าง เงินสด / QR / สำเร็จ
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { DashboardPageLayout } from "@/components/shared/layout";
import { RetryButton } from "@/components/shared/actions";
import type { usePOSViewModel } from "./usePOSViewModel";
import { ScanSearchBox } from "./_components/ScanSearchBox";
import { BillCard } from "./_components/BillCard";
import { PaymentAside } from "./_components/PaymentAside";
import { MemberCard } from "./_components/MemberCard";

// หน้าต่างชำระเงิน/เลือกตัวเลือก (antd Modal · Image · แป้นตัวเลข) แยก chunk — ไม่ต้อง parse/รันตอนเปิดหน้า
// (Lighthouse TBT) · เริ่มโหลดล่วงหน้าเมื่อบิลมีสินค้าชิ้นแรก → กดชำระแล้วหน้าต่างขึ้นทันทีเหมือนเดิม
const loadCash = () => import("./_components/CashPaymentModal");
const loadQr = () => import("./_components/QRPaymentModal");
const loadDone = () => import("./_components/PaymentDoneModal");
const loadPicker = () => import("./_components/CustomizationPickerModal");
const CashPaymentModal = dynamic(() => loadCash().then((m) => m.CashPaymentModal), { ssr: false });
const QRPaymentModal = dynamic(() => loadQr().then((m) => m.QRPaymentModal), { ssr: false });
const PaymentDoneModal = dynamic(() => loadDone().then((m) => m.PaymentDoneModal), { ssr: false });
const CustomizationPickerModal = dynamic(() => loadPicker().then((m) => m.CustomizationPickerModal), { ssr: false });

type VM = ReturnType<typeof usePOSViewModel>;

export function POSView(vm: VM) {
  const t = useTranslations();
  const cashUsed = useOpenedOnce(vm.payDialog === "cash");
  const qrUsed = useOpenedOnce(vm.payDialog === "qr");
  const doneUsed = useOpenedOnce(vm.payDialog === "done");
  const hasItems = vm.cart.length > 0;
  useEffect(() => {
    if (!hasItems) return;
    void loadCash();
    void loadQr();
    void loadDone();
  }, [hasItems]);
  // หน้าต่างเลือกตัวเลือกสินค้าเปิดได้ตั้งแต่สินค้าชิ้นแรก — โหลดล่วงหน้าเมื่อเริ่มพิมพ์/สแกน
  const typing = vm.query.length > 0;
  useEffect(() => {
    if (typing || hasItems) void loadPicker();
  }, [typing, hasItems]);

  return (
    <DashboardPageLayout title={t("pos.title")}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label={t("pos.billTitle")} className="flex min-w-0 flex-col gap-3.5">
          {vm.isCatalogError && (
            // ค้นหาด้วยชื่อใช้ไม่ได้ถ้าโหลดรายการสินค้าไม่สำเร็จ — ยิงบาร์โค้ด/พิมพ์รหัสแล้ว Enter ยังใช้ได้ (ถาม backend ทีละรหัส)
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="m-0 text-sm text-gray-600">{t("pos.searchLoadFailed")}</p>
              <RetryButton onClick={() => vm.refetchCatalog()} />
            </div>
          )}

          <BillCard
            cart={vm.cart}
            itemCount={vm.itemCount}
            promosOf={vm.promosOf}
            onIncrease={vm.increaseQty}
            onDecrease={vm.decreaseQty}
            isProductAtStock={vm.isProductAtStock}
            search={
              <ScanSearchBox
                value={vm.query}
                scanning={vm.scanning || !!vm.preparingId}
                suggestions={vm.suggestions}
                promosOf={vm.promosOf}
                onChange={vm.setQuery}
                onSubmit={vm.onSubmitQuery}
                onPick={vm.onPickSuggestion}
              />
            }
          />
        </section>

        <PaymentAside
          promotionsEnabled={vm.promotionsEnabled}
          promoEvals={vm.promoEvals}
          billPromotions={vm.billPromotions}
          bestPromoId={vm.bestPromoId}
          selectedPromoId={vm.selectedPromoId}
          selectedPromoInvalid={vm.selectedPromoInvalid}
          subtotal={vm.subtotal}
          discount={vm.discount}
          total={vm.total}
          canPay={vm.canPay}
          canCreate={vm.perm.create}
          hasItems={vm.cart.length > 0}
          onTogglePromo={vm.togglePromo}
          memberSlot={
            <MemberCard
              phone={vm.memberPhone}
              searching={vm.memberSearching}
              lookup={vm.memberLookup}
              member={vm.member}
              points={vm.memberPoints}
              disabled={vm.submitting}
              onPhoneChange={vm.setMemberPhone}
              onSubmit={vm.submitMemberPhone}
              onPick={vm.pickMember}
              onClear={vm.clearMember}
            />
          }
          onPayCash={vm.openCash}
          onPayQr={vm.openQr}
          onClearBill={vm.onClearBill}
        />
      </div>

      {cashUsed && (
        <CashPaymentModal
          open={vm.payDialog === "cash"}
          total={vm.total}
          received={vm.received}
          short={vm.receivedShort}
          submitting={vm.submitting}
          onPressKey={vm.pressKey}
          onPick={vm.pickCash}
          onConfirm={vm.confirmCash}
          onClose={vm.closeDialog}
        />
      )}
      {qrUsed && (
        <QRPaymentModal
          open={vm.payDialog === "qr"}
          amount={vm.total}
          submitting={vm.submitting}
          onClose={vm.closeDialog}
          onConfirmPaid={vm.confirmQr}
          onSwitchToCash={vm.openCash}
        />
      )}
      {doneUsed && <PaymentDoneModal open={vm.payDialog === "done"} done={vm.done} onNewBill={vm.closeDialog} />}

      {vm.picker && (
        <CustomizationPickerModal
          key={vm.picker.product._id}
          product={vm.picker.product}
          customization={vm.picker.customization}
          onConfirm={vm.onPickConfirm}
          onCancel={vm.onPickCancel}
        />
      )}
    </DashboardPageLayout>
  );
}
