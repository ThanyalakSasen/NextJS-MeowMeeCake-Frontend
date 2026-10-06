"use client";
// View ของ POS หน้าร้าน — ตามดีไซน์ใหม่ (เฉพาะส่วนเนื้อหา — header/เมนูใช้ OwnerLayout ของแอป):
// ซ้าย = ช่อง "สแกน / ค้นหา" + บิลปัจจุบัน · ขวา = โปรโมชัน + สรุปยอด + ปุ่มชำระ · หน้าต่าง เงินสด / QR / สำเร็จ
import { useTranslations } from "next-intl";
import { DashboardPageLayout } from "@/components/shared/layout";
import { RetryButton } from "@/components/shared/actions";
import type { usePOSViewModel } from "./usePOSViewModel";
import { ScanSearchBox } from "./_components/ScanSearchBox";
import { BillCard } from "./_components/BillCard";
import { PaymentAside } from "./_components/PaymentAside";
import { CashPaymentModal } from "./_components/CashPaymentModal";
import { QRPaymentModal } from "./_components/QRPaymentModal";
import { PaymentDoneModal } from "./_components/PaymentDoneModal";
import { CustomizationPickerModal } from "./_components/CustomizationPickerModal";

type VM = ReturnType<typeof usePOSViewModel>;

export function POSView(vm: VM) {
  const t = useTranslations();

  return (
    <DashboardPageLayout title={t("pos.title")} description={t("pos.description")}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label={t("pos.billTitle")} className="flex min-w-0 flex-col gap-3.5">
          <ScanSearchBox
            value={vm.query}
            scanning={vm.scanning || !!vm.preparingId}
            suggestions={vm.suggestions}
            promosOf={vm.promosOf}
            onChange={vm.setQuery}
            onSubmit={vm.onSubmitQuery}
            onPick={vm.onPickSuggestion}
          />

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
          onPayCash={vm.openCash}
          onPayQr={vm.openQr}
          onClearBill={vm.onClearBill}
        />
      </div>

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
      <QRPaymentModal
        open={vm.payDialog === "qr"}
        amount={vm.total}
        submitting={vm.submitting}
        onClose={vm.closeDialog}
        onConfirmPaid={vm.confirmQr}
        onSwitchToCash={vm.openCash}
      />
      <PaymentDoneModal open={vm.payDialog === "done"} done={vm.done} onNewBill={vm.closeDialog} />

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
