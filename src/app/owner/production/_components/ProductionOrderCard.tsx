"use client";
// การ์ดใบสั่งผลิต 1 ใบ — ใช้บน kanban (StatusBoard) — presentational ล้วน รับ drag handler จาก parent
import { useTranslations } from "next-intl";
import { Tag } from "@/components/base";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";

export function ProductionOrderCard({
  order,
  draggable,
  dragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  order: ProductionOrder;
  draggable: boolean;
  dragging: boolean;
  onClick: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const t = useTranslations();
  const srcCfg = SOURCE_TYPE_CONFIG[order.source_type];
  const items = order.items;

  return (
    <div
      onClick={onClick}
      role="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", order._id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(order._id);
      }}
      onDragEnd={onDragEnd}
      title={draggable ? t("production.dragHint") : undefined}
      className={`bg-white border border-gray-100 rounded-xl p-3 mb-2.5 last:mb-0 hover:border-gray-300 hover:shadow-sm transition-all ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <p className="text-sm font-semibold text-brown-900 font-mono truncate">{order.production_no}</p>
        <Tag style={{ background: srcCfg.bg, color: srcCfg.color, borderColor: "transparent", margin: 0 }}>
          {t(`enums.sourceType.${order.source_type}`)}
        </Tag>
      </div>
      <div className="flex flex-col gap-0.5 mb-1.5">
        {items.slice(0, 2).map((it, i) => (
          <p key={i} className="text-sm text-gray-600 truncate">
            {it.product_name} × {it.planned_qty} {it.unit_abbr}
          </p>
        ))}
        {items.length > 2 && (
          <p className="text-sm text-gray-400">{t("production.moreItems", { n: items.length - 2 })}</p>
        )}
      </div>
      <p className="text-sm text-gray-400">{order.assignee_name ?? t("production.unassigned")}</p>
    </div>
  );
}
