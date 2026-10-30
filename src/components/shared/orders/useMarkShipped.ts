"use client";
// ─────────────────────────────────────────────────────────────
// useMarkShipped — ปุ่ม "จัดส่งเรียบร้อยแล้ว" ของออเดอร์ (Manage Orders) และพรีออเดอร์ ใช้ร่วมกันที่นี่จุดเดียว
// 2 ขั้น: สถานะจัดส่ง "กำลังจัดส่ง" (backend แจ้งลูกค้าพร้อมเลขพัสดุ + ตั้ง shipped_at) → ปิดเป็น completed
// ขั้นแรกสำเร็จแต่ขั้นสองล้ม = ลูกค้าได้ข้อความแล้วแต่ออเดอร์ยังพร้อมส่งมอบ → แจ้งให้กดใหม่ตรง ๆ
// (กดซ้ำปลอดภัย: delivery_status เป็น shipping แล้วจะข้ามขั้นแรก ไม่แจ้งลูกค้าซ้ำ)
// changes = ขนส่ง/เลขพัสดุที่เพิ่งกรอก → ส่งไปพร้อมขั้นแรกในคำขอเดียว (ลูกค้าได้ข้อความพร้อมเลขพัสดุ)
// ─────────────────────────────────────────────────────────────
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { DeliveryInfo, DeliveryUpdateInput } from "@/types/order";

interface ShipService {
  updateDelivery: (id: string, body: DeliveryUpdateInput) => Promise<unknown>;
  updateStatus: (id: string, order_status: string) => Promise<unknown>;
}

type ShipTarget = Pick<DeliveryInfo, "delivery_status"> & { _id: string };

/** ขั้นแรก (แจ้งลูกค้าแล้ว) สำเร็จ แต่ปิดออเดอร์ไม่สำเร็จ */
class PartialShipError extends Error {}

async function markShipped(service: ShipService, doc: ShipTarget, changes: DeliveryUpdateInput = {}) {
  const body: DeliveryUpdateInput = doc.delivery_status === "shipping" ? changes : { ...changes, delivery_status: "shipping" };
  if (Object.keys(body).length > 0) await service.updateDelivery(doc._id, body);
  try {
    await service.updateStatus(doc._id, "completed");
  } catch (e) {
    throw new PartialShipError(isApiError(e) ? e.message : "");
  }
}

export function useMarkShipped(service: ShipService, onSettled: () => void) {
  const t = useTranslations();
  const mutation = useMutation({
    mutationFn: ({ doc, changes }: { doc: ShipTarget; changes?: DeliveryUpdateInput }) => markShipped(service, doc, changes),
    onSettled,
  });

  const markShippedFor = (doc: ShipTarget, no: string, changes?: DeliveryUpdateInput) =>
    mutation.mutate({ doc, changes }, {
      onSuccess: () => alert.success(t("orders.markShippedDone", { no })),
      onError: (e) =>
        alert.error(
          e instanceof PartialShipError
            ? t("orders.markShippedPartial", { no })
            : isApiError(e) ? e.message : t("orders.markShippedFailed"),
        ),
    });

  return { markShippedFor, markingShipped: mutation.isPending };
}
