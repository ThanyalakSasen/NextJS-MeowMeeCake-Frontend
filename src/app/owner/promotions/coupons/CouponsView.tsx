"use client";
// View ของ Coupons — กริดการ์ดคูปอง + modal เพิ่ม/แก้ไข
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, EmptyState, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { LoadingSpin } from "@/components/shared/feedback";
import { FilterToolbar, SearchInput, TypeTabBar } from "@/components/shared/data";
import type { useCouponsViewModel } from "./useCouponsViewModel";
import { CouponCard } from "./_components/CouponCard";
import { CouponFormModal } from "./_components/CouponFormModal";

type VM = ReturnType<typeof useCouponsViewModel>;

export function CouponsView(vm: VM) {
  const t = useTranslations();

  return (
    <ListPageLayout
      title={t("coupons.title")}
      description={t("coupons.description")}
      actions={
        vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAdd}>
            {t("coupons.addCoupon")}
          </Button>
        )
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <TypeTabBar
                value={vm.tab}
                onChange={vm.setTab}
                options={[
                  { value: "all", label: `${t("common.all")} (${vm.counts.all})` },
                  { value: "active", label: `${t("enums.couponStatus.active")} (${vm.counts.active})` },
                  { value: "scheduled", label: `${t("enums.couponStatus.scheduled")} (${vm.counts.scheduled})` },
                  { value: "expired", label: `${t("enums.couponStatus.expired")} (${vm.counts.expired})` },
                ]}
              />
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("coupons.searchPlaceholder")} />
              <div style={{ minWidth: 160 }}>
                <Select
                  value={vm.typeFilter}
                  onChange={(v) => vm.setTypeFilter(v as VM["typeFilter"])}
                  options={[
                    { value: "all", label: t("coupons.allDiscountTypes") },
                    { value: "Percentage", label: t("enums.discountType.Percentage") },
                    { value: "Amount", label: t("enums.discountType.Amount") },
                    { value: "FreeShipping", label: t("enums.discountType.FreeShipping") },
                  ]}
                />
              </div>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("coupons.statTotal")} value={vm.counts.all} sub={t("coupons.statTotalSub")} />
            <StatCard label={t("enums.couponStatus.active")} value={vm.counts.active} sub={t("coupons.statActiveSub")} tone="up" />
            <StatCard label={t("coupons.statUsedTotal")} value={vm.totalUsed} sub={t("coupons.statUsedTotalSub")} />
            <StatCard label={t("coupons.statTypes")} value={t("coupons.statTypesValue")} sub={t("coupons.statTypesSub")} />
          </StatCardsGrid>

          {vm.rows.length === 0 ? (
            <EmptyState description={t("coupons.empty")} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vm.rows.map((c) => (
                <CouponCard
                  key={c._id}
                  coupon={c}
                  canUpdate={vm.perm.update}
                  canDelete={vm.perm.delete}
                  onEdit={vm.openEdit}
                  onDelete={vm.onDelete}
                  onToggle={vm.onToggle}
                />
              ))}
              {vm.perm.create && (
                <button
                  type="button"
                  onClick={vm.openAdd}
                  className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  <PlusIcon className="h-7 w-7" />
                  <span className="text-sm font-medium">{t("coupons.addCoupon")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <CouponFormModal
        key={vm.editTarget?._id ?? "new"}
        open={vm.modalOpen}
        editTarget={vm.editTarget}
        productOptions={vm.productOptions}
        categoryOptions={vm.categoryOptions}
        saving={vm.saving}
        onClose={vm.closeModal}
        onSubmit={vm.onSubmit}
      />
    </ListPageLayout>
  );
}
