"use client";
// เนื้อหาใน DetailDrawer ของรอบพรีออเดอร์ — ข้อมูลรอบ + ปุ่มเปลี่ยนสถานะ + จัดการสินค้าในรอบ
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Divider } from "antd";
import { Button, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { PreorderRound } from "@/types/preorderRound";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function RoundDetailContent(vm: VM & { round: PreorderRound }) {
  const t = useTranslations();
  const locale = useLocale();
  const { round } = vm;
  const final = vm.isFinalRoundStatus(round.round_status);
  const next = vm.getNextRoundStatus(round.round_status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatusBadge group="roundStatus" value={round.round_status} />
        {vm.perm.update && !final && (
          <Button size="small" onClick={vm.openEditRound}>{t("common.edit")}</Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-500">{t("preorderRound.fieldOpenDate")}</p>
          <p className="text-gray-800">{formatDate(round.open_date, locale)}</p>
        </div>
        <div>
          <p className="text-gray-500">{t("preorderRound.fieldCloseDate")}</p>
          <p className="text-gray-800">{formatDate(round.close_date, locale)}</p>
        </div>
        <div>
          <p className="text-gray-500">{t("preorderRound.fieldPickupDate")}</p>
          <p className="text-gray-800">{formatDate(round.pickup_date, locale)}</p>
        </div>
      </div>

      {vm.perm.update && !final && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <Button danger size="small" onClick={() => vm.onCancelRound(round)}>{t("preorderRound.cancelRound")}</Button>
          {next && (
            <Button type="primary" size="small" onClick={() => vm.onAdvanceRoundStatus(round)}>
              {t("preorderRound.advanceTo", { status: t(`enums.roundStatus.${next}`) })}
            </Button>
          )}
        </div>
      )}

      {round.round_status === "closed" && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-600">{t("preorderRound.goToProductionHint")}</span>{" "}
          <Link href="/owner/production?tab=plan" className="font-medium text-brown-800 hover:underline">
            {t("preorderRound.goToProduction")}
          </Link>
        </div>
      )}

      <Divider className="!my-0" />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500">{t("preorderRound.itemsTitle", { n: round.items?.length ?? 0 })}</p>
          {vm.perm.update && !final && (
            <Button size="small" icon={<PlusIcon className="h-3.5 w-3.5" />} onClick={vm.openAddItem}>
              {t("preorderRound.addItem")}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {(round.items ?? []).map((it) => (
            <div key={it._id} className="rounded-lg border border-gray-100 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-brown-800">{it.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(it.current_price, locale)}
                    {it.price_override != null && <span className="ml-1 text-xs text-amber-600">({t("preorderRound.overridden")})</span>}
                  </p>
                </div>
                {!it.is_active && <Tag color="default">{t("preorderRound.itemInactive")}</Tag>}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm text-gray-600">
                <span>
                  {t("preorderRound.qtyProgress", { current: it.current_qty, max: it.max_qty_total })}
                  {" · "}
                  {t("preorderRound.minOrderQtyShort", { n: it.min_order_qty })}
                </span>
                {vm.perm.update && !final && (
                  <div className="flex gap-2">
                    <Button size="small" type="text" onClick={() => vm.openEditItem(it._id)}>{t("common.edit")}</Button>
                    {it.current_qty === 0 && (
                      <ConfirmDeletePopup title={t("preorderRound.removeItemConfirm")} onConfirm={() => vm.onRemoveRoundItem(it._id)}>
                        <Button size="small" type="text" danger>{t("common.delete")}</Button>
                      </ConfirmDeletePopup>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(round.items ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">{t("preorderRound.noItems")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
