"use client";
// View ของ POS หน้าร้าน — 2-pane: สแกน/ค้นหา + รายการที่สแกน (ซ้าย) + แผงชำระเงิน (ขวา, sticky)
// ไม่มีกริดเมนูสินค้า — เพิ่มสินค้าด้วยการยิงบาร์โค้ด หรือค้นหาตามรหัส/ชื่อสินค้า (BACKLOG2 §13)
import { useTranslations } from "next-intl";
import { QrCodeIcon, TagIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { RetryButton } from "@/components/shared/actions";
import type { usePOSViewModel } from "./usePOSViewModel";
import { ProductSearch } from "./_components/ProductSearch";
import { ScannedList } from "./_components/ScannedList";
import { CheckoutPanel } from "./_components/CheckoutPanel";
import { QRPaymentModal } from "./_components/QRPaymentModal";

type VM = ReturnType<typeof usePOSViewModel>;

export function POSView(vm: VM) {
  const t = useTranslations();

  return (
    <DashboardPageLayout title={t("pos.title")} description={t("pos.description")}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Input
            autoFocus
            allowClear
            value={vm.scanCode}
            onChange={(e) => vm.setScanCode(e.target.value)}
            onPressEnter={() => vm.onScan(vm.scanCode)}
            disabled={vm.scanning}
            placeholder={t("pos.scanPlaceholder")}
            prefix={<QrCodeIcon className="w-4 h-4 text-gray-400" />}
            size="large"
            aria-label={t("pos.scanPlaceholder")}
          />

          {vm.isError ? (
            // ค้นหาตามชื่อใช้ไม่ได้ถ้าโหลดรายการสินค้าไม่สำเร็จ — การยิงบาร์โค้ดยังใช้ได้ (ถาม backend ทีละรหัส)
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
              <p className="text-sm text-gray-600">{t("pos.searchLoadFailed")}</p>
              <RetryButton onClick={() => vm.refetch()} />
            </div>
          ) : (
            <ProductSearch
              value={vm.filter}
              results={vm.searchResults}
              promosOf={vm.promosOf}
              onChange={vm.setFilter}
              onPick={vm.onPickProduct}
            />
          )}

          {vm.promotionsEnabled && vm.billPromotions.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm text-pink-800">
              <TagIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("pos.billPromoBanner", { names: vm.billPromotions.map((p) => p.promotion_name).join(", ") })}</span>
            </div>
          )}

          <ScannedList
            cart={vm.cart}
            itemCount={vm.itemCount}
            promosOf={vm.promosOf}
            onChangeQty={vm.changeQty}
            onRemove={vm.removeFromCart}
            onClear={vm.clearCart}
          />
        </div>

        <CheckoutPanel
          hasItems={vm.cart.length > 0}
          subtotal={vm.subtotal}
          discount={vm.discount}
          total={vm.total}
          promotionsEnabled={vm.promotionsEnabled}
          promoEvals={vm.promoEvals}
          bestPromoId={vm.bestPromo?.promotion._id ?? null}
          selectedPromoId={vm.selectedPromoId}
          appliedPromo={vm.appliedPromo}
          selectedPromoInvalid={vm.selectedPromoInvalid}
          customerName={vm.customerName}
          extraDiscount={vm.extraDiscount}
          paymentMethod={vm.paymentMethod}
          canCreate={vm.perm.create}
          submitting={vm.submitting}
          onSelectPromo={vm.setSelectedPromoId}
          onCustomerName={vm.setCustomerName}
          onExtraDiscount={vm.setExtraDiscount}
          onPaymentMethod={vm.setPaymentMethod}
          onConfirm={vm.onConfirm}
        />
      </div>

      <QRPaymentModal
        open={vm.qrOpen}
        amount={vm.total}
        submitting={vm.submitting}
        onClose={vm.closeQr}
        onConfirmPaid={vm.confirmPaid}
      />
    </DashboardPageLayout>
  );
}
