"use client";
// ─────────────────────────────────────────────────────────────
// StatusBoard — kanban ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยนสถานะ (HTML5 drag-and-drop เนทีฟ ไม่พึ่งไลบรารีเพิ่ม)
// ถือ state การลาก (draggingId/dragOverStatus) ไว้ในตัวเอง — business logic (จะ PATCH อะไร) อยู่ที่
// useProductionViewModel.onChangeStatus แล้ว (component นี้แค่เรียกผ่าน onDrop)
// ลากได้เฉพาะใบที่ยังไม่ถึงสถานะสุดท้าย (เสร็จแล้ว/ยกเลิก ปิดงานแล้ว)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/base";
import { PRODUCTION_STATUS_CONFIG } from "@/constants/enumConfig";
import type { ProductionStatus } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import { BOARD_COLUMNS, isFinalStatus } from "../productionStatus";
import { ProductionOrderCard } from "./ProductionOrderCard";

export function StatusBoard({
  orders,
  canUpdate,
  onCardClick,
  onDrop,
}: {
  orders: ProductionOrder[];
  canUpdate: boolean;
  onCardClick: (o: ProductionOrder) => void;
  onDrop: (order: ProductionOrder, next: ProductionStatus) => void;
}) {
  const t = useTranslations();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ProductionStatus | null>(null);

  const handleDrop = (targetStatus: ProductionStatus) => {
    setDragOverStatus(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const order = orders.find((o) => o._id === id);
    if (!order || order.production_status === targetStatus) return;
    onDrop(order, targetStatus);
  };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS.length}, minmax(0,1fr))` }}>
      {BOARD_COLUMNS.map((status) => {
        const cfg = PRODUCTION_STATUS_CONFIG[status];
        const columnOrders = orders.filter((o) => o.production_status === status);
        const isDragOver = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              if (!draggingId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverStatus !== status) setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((prev) => (prev === status ? null : prev))}
            onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
            className={`bg-gray-50 border rounded-xl p-3 transition-colors ${
              isDragOver ? "border-brown-400 bg-brown-50" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
              <p className="text-sm font-semibold text-gray-700">{t(`enums.productionStatus.${status}`)}</p>
              <span className="text-sm text-gray-400">({columnOrders.length})</span>
            </div>
            {columnOrders.length === 0 ? (
              <EmptyState description={t("production.columnEmpty")} className="py-6" />
            ) : (
              columnOrders.map((o) => (
                <ProductionOrderCard
                  key={o._id}
                  order={o}
                  draggable={canUpdate && !isFinalStatus(o.production_status)}
                  dragging={draggingId === o._id}
                  onClick={() => onCardClick(o)}
                  onDragStart={setDraggingId}
                  onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
