"use client";
// View ของ Coupons — กริดการ์ดคูปอง + modal เพิ่ม/แก้ไข
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { Button, EmptyState, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { FilterToolbar, SearchInput, TypeTabBar, FilterField } from "@/components/shared/data";
import { actionIcon } from "@/components/shared/actions";
import type { useCouponsViewModel } from "./useCouponsViewModel";
import { CouponCard } from "./_components/CouponCard";
import { RestoreDeletedButton } from "@/components/shared/restore";
// ฟอร์มคูปอง (Form/DatePicker/Select หลายตัว) แยก chunk — โหลดเมื่อเปิดครั้งแรก ไม่ต้อง parse/รันตอนเปิดหน้า
const CouponFormModal = dynamic(() => import("./_components/CouponFormModal").then((m) => m.CouponFormModal), { ssr: false });

type VM = ReturnType<typeof useCouponsViewModel>;

export function CouponsView(vm: VM) {
  const t = useTranslations();
  const formUsed = useOpenedOnce(vm.modalOpen);

  return (
    <ListPageLayout
      title={t("coupons.title")}
      actions={
        <>
          <RestoreDeletedButton menu="promotions" resources={["promotions"]} />
          {vm.perm.create && (
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openAdd}>
              {t("coupons.addCoupon")}
            </Button>
          )}
        </>
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
                  { value: "inactive", label: `${t("enums.couponStatus.inactive")} (${vm.counts.inactive})` },
                  { value: "expired", label: `${t("enums.couponStatus.expired")} (${vm.counts.expired})` },
                ]}
              />
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("coupons.searchPlaceholder")} />
            </>
          }
          // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
          right={
            <>
              <FilterField label={t("filterLabel.discountType")} minWidth={160}>
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
              </FilterField>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
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
                  className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  {actionIcon("add", undefined, "h-7 w-7")}
                  <span className="text-sm font-medium">{t("coupons.addCoupon")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {formUsed && (
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
      )}
    </ListPageLayout>
  );
}
