"use client";
// เนื้อหาใน DetailDrawer ของใบสั่งผลิต — ใช้ร่วมทั้ง 3 แท็บ (row บนแท็บแผน/ประวัติ, การ์ดบนแท็บสถานะ)
import { useTranslations, useLocale } from "next-intl";
import { Button, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatDate } from "@/i18n/format";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import { getNextStatus, isFinalStatus } from "../productionStatus";

export function ProductionOrderDetail({
  order,
  canUpdate,
  onAdvance,
  onCancel,
}: {
  order: ProductionOrder;
  canUpdate: boolean;
  onAdvance: (o: ProductionOrder) => void;
  onCancel: (o: ProductionOrder) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const srcCfg = SOURCE_TYPE_CONFIG[order.source_type];
  const final = isFinalStatus(order.production_status);
  const next = getNextStatus(order.production_status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-brown-900 font-mono">{order.production_no}</p>
        <StatusBadge group="productionStatus" value={order.production_status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">{t("production.fieldDate")}</p>
          <p className="text-gray-800">{formatDate(order.production_date, locale)}</p>
        </div>
        <div>
          <p className="text-gray-500">{t("production.fieldSourceType")}</p>
          <Tag style={{ background: srcCfg.bg, color: srcCfg.color, borderColor: "transparent" }}>
            {t(`enums.sourceType.${order.source_type}`)}
          </Tag>
        </div>
        <div>
          <p className="text-gray-500">{t("production.fieldAssignee")}</p>
          <p className="text-gray-800">{order.assignee_name ?? t("production.unassigned")}</p>
        </div>
        <div>
          <p className="text-gray-500">{t("production.colStarted")}</p>
          <p className="text-gray-800">{order.started_at ? formatDate(order.started_at, locale, { withTime: true }) : "—"}</p>
        </div>
      </div>

      {order.production_note && (
        <div>
          <p className="text-sm text-gray-500 mb-1">{t("production.fieldNote")}</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.production_note}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-500 mb-2">{t("production.itemsTitle", { n: order.items.length })}</p>
        <div className="flex flex-col gap-2">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <div>
                <p className="text-sm text-gray-800">{it.product_name}</p>
                {it.notes && <p className="text-sm text-gray-400">{it.notes}</p>}
              </div>
              <p className="text-sm font-medium text-brown-900">{it.planned_qty} {it.unit_abbr}</p>
            </div>
          ))}
        </div>
      </div>

      {canUpdate && !final && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <Button danger size="small" onClick={() => onCancel(order)}>{t("production.cancelOrder")}</Button>
          {next && (
            <Button type="primary" size="small" onClick={() => onAdvance(order)}>
              {t("production.advanceTo", { status: t(`enums.productionStatus.${next}`) })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
