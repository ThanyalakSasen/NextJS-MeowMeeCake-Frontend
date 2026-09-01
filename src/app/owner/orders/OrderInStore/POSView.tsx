"use client";
// View ของ POS หน้าร้าน — 2-pane: กริดสินค้า (ซ้าย) + ตะกร้า (ขวา, sticky)
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { LoadingSpin } from "@/components/shared/feedback";
import { SearchInput, TypeTabBar } from "@/components/shared/data";
import type { usePOSViewModel } from "./usePOSViewModel";
import { ProductPickerGrid } from "./_components/ProductPickerGrid";
import { CartPanel } from "./_components/CartPanel";
import { QRPaymentModal } from "./_components/QRPaymentModal";

type VM = ReturnType<typeof usePOSViewModel>;

export function POSView(vm: VM) {
  const t = useTranslations();

  return (
    <DashboardPageLayout title={t("pos.title")} description={t("pos.description")}>
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("pos.searchPlaceholder")} />
              <TypeTabBar
                value={vm.categoryId}
                onChange={vm.setCategoryId}
                options={[
                  { value: "all", label: t("common.all") },
                  ...vm.categories.map((c) => ({ value: c._id, label: c.category_name })),
                ]}
              />
            </div>
            {vm.isLoading ? <LoadingSpin /> : <ProductPickerGrid products={vm.catalog} onAdd={vm.addToCart} />}
          </div>

          <CartPanel
            cart={vm.cart}
            itemCount={vm.itemCount}
            subtotal={vm.subtotal}
            total={vm.total}
            customerName={vm.customerName}
            extraDiscount={vm.extraDiscount}
            paymentMethod={vm.paymentMethod}
            canCreate={vm.perm.create}
            submitting={vm.submitting}
            onChangeQty={vm.changeQty}
            onRemove={vm.removeFromCart}
            onClear={vm.clearCart}
            onCustomerName={vm.setCustomerName}
            onExtraDiscount={vm.setExtraDiscount}
            onPaymentMethod={vm.setPaymentMethod}
            onConfirm={vm.onConfirm}
          />
        </div>
      )}

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
