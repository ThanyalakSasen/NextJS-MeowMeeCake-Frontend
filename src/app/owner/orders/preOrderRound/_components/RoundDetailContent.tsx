"use client";
// เนื้อหาใน DetailDrawer ของรอบพรีออเดอร์ — ข้อมูลรอบ + ปุ่มเปลี่ยนสถานะ + จัดการสินค้าในรอบ
// + ขั้นตอนรอบ → การผลิต (Steps) · ผลการปิดรอบ · ลิงก์ใบสั่งผลิตของรอบ · เปิดรอบที่ปิดแล้วกลับ
import Link from "next/link";
import { Steps } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Button, Divider, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { CloseRoundResult, PreorderRound } from "@/types/preorderRound";
import { DeleteButton, EditButton, actionIcon } from "@/components/shared/actions";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";
import { NOTICE_TAG, ROUND_STATUS_FLOW } from "@/constants/enumConfig";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function RoundDetailContent(vm: VM & { round: PreorderRound }) {
  const t = useTranslations();
  const locale = useLocale();
  const { round } = vm;
  const final = vm.isFinalRoundStatus(round.round_status);
  const next = vm.getNextRoundStatus(round.round_status);
  const production = round.round_status === "closed" ? vm.roundProduction : null;
  const productionHref = production ? `/owner/production?id=${encodeURIComponent(production._id)}` : "/owner/production?tab=plan";

  // ขั้นที่ 4 = การผลิต · ใบผลิตเสร็จแล้ว = จบทุกขั้น
  const stepIndex = production ? 3 : ROUND_STATUS_FLOW.indexOf(round.round_status);
  const steps = [
    ...ROUND_STATUS_FLOW.map((s) => ({ title: t(`enums.roundStatus.${s}`) })),
    {
      title: t("preorderRound.stepProduction"),
      content: production ? t(`enums.productionStatus.${production.production_status}`) : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatusBadge group="roundStatus" value={round.round_status} />
        {vm.perm.update && !final && (
          <EditButton size="small" onClick={vm.openEditRound} />
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

      {round.round_status !== "cancelled" && (
        <Steps
          size="small"
          titlePlacement="vertical"
          current={stepIndex}
          status={production?.production_status === "done" ? "finish" : "process"}
          items={steps}
        />
      )}

      {vm.perm.update && !final && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <Button danger size="small" icon={actionIcon("cancelAction", "small")} onClick={() => vm.onCancelRound(round)}>{t("preorderRound.cancelRound")}</Button>
          {next && (
            <Button
              type="primary"
              size="small"
              icon={actionIcon("next", "small")}
              loading={vm.changingRoundStatus}
              onClick={() => vm.onAdvanceRoundStatus(round)}
            >
              {next === "closed" ? t("preorderRound.closeRound") : t("preorderRound.advanceTo", { status: t(`enums.roundStatus.${next}`) })}
            </Button>
          )}
        </div>
      )}

      {vm.closeResult && <CloseResultPanel result={vm.closeResult} />}

      {round.round_status === "closed" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
          {production ? (
            <span className="text-gray-600">
              {t("preorderRound.productionOfRound")}{" "}
              <Link href={productionHref} className="font-medium text-brown-800 hover:underline">
                {production.production_no}
              </Link>{" "}
              · <StatusBadge group="productionStatus" value={production.production_status} />
            </span>
          ) : (
            <span>
              <span className="text-gray-600">{t("preorderRound.goToProductionHint")}</span>{" "}
              <Link href={productionHref} className="font-medium text-brown-800 hover:underline">
                {t("preorderRound.goToProduction")}
              </Link>
            </span>
          )}
          {vm.perm.update && vm.canReopenRound && (
            <Button size="small" icon={actionIcon("reset", "small")} onClick={vm.openReopen}>
              {t("preorderRound.reopenRound")}
            </Button>
          )}
        </div>
      )}

      <Divider className="!my-0" />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500">{t("preorderRound.itemsTitle", { n: round.items?.length ?? 0 })}</p>
          {vm.perm.update && !final && (
            <Button size="small" icon={actionIcon("add", "small")} onClick={vm.openAddItem}>
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
                {!it.is_active && <Tag color={NOTICE_TAG.inactive}>{t("preorderRound.itemInactive")}</Tag>}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm text-gray-600">
                <span>
                  {t("preorderRound.qtyProgress", { current: it.current_qty, max: it.max_qty_total })}
                  {" · "}
                  {t("preorderRound.minOrderQtyShort", { n: it.min_order_qty })}
                </span>
                {vm.perm.update && !final && (
                  <div className="flex gap-2">
                    <EditButton size="small" type="text" onClick={() => vm.openEditItem(it._id)} />
                    {it.current_qty === 0 && (
                      <ConfirmDeletePopup title={t("preorderRound.removeItemConfirm")} onConfirm={() => vm.onRemoveRoundItem(it._id)}>
                        <DeleteButton size="small" type="text" />
                      </ConfirmDeletePopup>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(round.items ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">{t("preorderRound.noItems")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** สรุปสิ่งที่ระบบทำตอนปิดรอบ (มาจาก response ของการปิดรอบ — ไม่ได้เก็บถาวร) */
function CloseResultPanel({ result }: { result: CloseRoundResult }) {
  const t = useTranslations("preorderRound");
  const { production, unpaid } = result;
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm ${
        production.created ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <p className="m-0 font-semibold">{t("closeResultTitle")}</p>
      {production.created ? (
        <p className="m-0">
          {t("closeResultProduction", { date: production.production_date ?? "-" })}{" "}
          <Link href={`/owner/production?id=${encodeURIComponent(production.production_id ?? "")}`} className="font-semibold underline">
            {production.production_no}
          </Link>
        </p>
      ) : (
        <p className="m-0">{t("closeResultNoProduction", { reason: production.reason ?? "-" })}</p>
      )}
      <p className="m-0">{t("closeResultUnpaid", { n: unpaid.cancelled.length })}</p>
      {unpaid.waitingSlip.length > 0 && (
        <p className="m-0">{t("closeResultWaitingSlip", { n: unpaid.waitingSlip.length, list: unpaid.waitingSlip.join(", ") })}</p>
      )}
      {unpaid.failed.length > 0 && (
        <p className="m-0 text-rose-700">{t("closeResultFailed", { list: unpaid.failed.map((f) => f.preorder_no).join(", ") })}</p>
      )}
    </div>
  );
}
