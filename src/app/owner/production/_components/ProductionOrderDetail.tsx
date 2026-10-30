"use client";
// เนื้อหาใน DetailModal (ป๊อปอัป) ของใบสั่งผลิต — ใช้ร่วมทั้ง 3 แท็บ (row บนแท็บแผน/ประวัติ, การ์ดบนแท็บสถานะ)
import { useTranslations, useLocale } from "next-intl";
import { Button, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatDate } from "@/i18n/format";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import { actionIcon } from "@/components/shared/actions";
import { getNextStatus, isFinalStatus, producedQty } from "../productionStatus";
import { ProductionLots } from "./ProductionLots";

export function ProductionOrderDetail({
  order,
  roundQuota,
  canUpdate,
  canComplete,
  onAdvance,
  onCancel,
  onEdit,
}: {
  order: ProductionOrder;
  /** ใบจากรอบพรีออเดอร์: product_id → โควตาที่เปิดรับต่อรอบ · null = ไม่ใช่ใบจากรอบ / ยังโหลดไม่เสร็จ */
  roundQuota?: Map<string, number> | null;
  canUpdate: boolean;
  /** ปิดงานผลิต (ไปสถานะ "เสร็จ") — production.approve */
  canComplete: boolean;
  onAdvance: (o: ProductionOrder) => void;
  onCancel: (o: ProductionOrder) => void;
  onEdit: (o: ProductionOrder) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const srcCfg = SOURCE_TYPE_CONFIG[order.source_type];
  const final = isFinalStatus(order.production_status);
  const next = getNextStatus(order.production_status);
  const done = order.production_status === "done";
  // ใบจากรอบ: planned_qty = ผลรวมที่ลูกค้าสั่งในรอบ (backend รวมให้) — บอกที่มา + โควตาที่เปิดรับต่อรอบ
  const fromRound = order.source_type === "preorder";
  const orderedLine = (it: ProductionOrder["items"][number]) => {
    if (!fromRound) return null;
    const quota = roundQuota?.get(it.product_id);
    return (
      <p className="text-xs text-gray-500">
        {quota != null
          ? t("production.orderedOfQuota", { ordered: it.planned_qty, quota, unit: it.unit_abbr })
          : t("production.orderedQty", { ordered: it.planned_qty, unit: it.unit_abbr })}
      </p>
    );
  };

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
          {order.round_name && <p className="mt-1 text-gray-800">{order.round_name}</p>}
        </div>
        <div>
          <p className="text-gray-500">{t("production.fieldAssignee")}</p>
          <p className="text-gray-800">{order.assignee_name ?? t("production.unassigned")}</p>
        </div>
        <div>
          <p className="text-gray-500">{t("production.colStarted")}</p>
          <p className="text-gray-800">{order.started_at ? formatDate(order.started_at, locale, { withTime: true }) : "—"}</p>
        </div>
        {order.completed_at && (
          <div>
            <p className="text-gray-500">{t("production.colCompletedAt")}</p>
            <p className="text-gray-800">{formatDate(order.completed_at, locale, { withTime: true })}</p>
          </div>
        )}
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
                {it.notes && <p className="text-sm text-gray-500">{it.notes}</p>}
              </div>
              {/* ใบที่ปิดงานแล้ว: จำนวนที่ผลิตได้จริง (ต่างจากแผน = บอกแผนไว้ใต้) · รายการที่ผลิตไม่ได้ = ป้ายยกเลิก */}
              {done && it.item_status === "cancelled" ? (
                <StatusBadge group="productionItemStatus" value="cancelled" />
              ) : done ? (
                <div className="text-right">
                  <p className="text-sm font-medium text-brown-900">{producedQty(it)} {it.unit_abbr}</p>
                  {producedQty(it) !== it.planned_qty && !fromRound && (
                    <p className="text-xs text-gray-500">{t("production.colPlanned")} {it.planned_qty} {it.unit_abbr}</p>
                  )}
                  {orderedLine(it)}
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-medium text-brown-900">{it.planned_qty} {it.unit_abbr}</p>
                  {orderedLine(it)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {done && <ProductionLots orderId={order._id} />}

      {canUpdate && !final && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <Button danger size="small" icon={actionIcon("cancelAction", "small")} onClick={() => onCancel(order)}>{t("production.cancelOrder")}</Button>
          <Button size="small" icon={actionIcon("edit", "small")} onClick={() => onEdit(order)}>{t("common.edit")}</Button>
          {/* ซ่อนปุ่มเลื่อนสถานะ (กำลังผลิต / เสร็จแล้ว) ไว้ก่อน
          {next && (next !== "done" || canComplete) && (
            <Button type="primary" size="small" onClick={() => onAdvance(order)}>
              {t("production.advanceTo", { status: t(`enums.productionStatus.${next}`) })}
            </Button>
          )}
          */}
        </div>
      )}
    </div>
  );
}
