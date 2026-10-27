"use client";
// ─────────────────────────────────────────────────────────────
// DeliverySection — สถานะจัดส่ง/บริษัทขนส่ง/เลขพัสดุ/หมายเหตุ ใน drawer ออเดอร์ (Manage Orders) และพรีออเดอร์ — BACKLOG2 §15.2 ข้อ 3
// ใช้เฉพาะ order_type = "delivery" · ไม่มีสิทธิ์ update = แสดงอย่างเดียว
// state ของฟอร์มเริ่มจาก info — parent ใส่ key={updated_at} ให้รีเซ็ตเองหลังบันทึก/ดึงข้อมูลใหม่
// ส่งเฉพาะฟิลด์ที่เปลี่ยน · shipped_at/delivered_at backend ตั้งให้เองตามสถานะ (ไม่ต้องกรอก)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, Input, TextArea, Select } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { actionIcon } from "@/components/shared/actions";
import { formatDate } from "@/i18n/format";
import { DELIVERY_STATUSES, SHIPPING_CARRIERS, type DeliveryStatus, type ShippingCarrier } from "@/constants/enumConfig";
import type { DeliveryInfo, DeliveryUpdateInput } from "@/types/order";

/** ตรงกับ backend schemas/order.ts updateDeliveryBody */
const MAX_TRACKING = 200;
const MAX_NOTE = 1000;

export function DeliverySection({
  info,
  canUpdate,
  saving,
  onSave,
  customerCloses = false,
}: {
  info: DeliveryInfo;
  canUpdate: boolean;
  saving: boolean;
  onSave: (input: DeliveryUpdateInput) => void;
  /** ลูกค้าเป็นคนปิดงาน (shared/orders/deliveryClose) — ร้านเลือก "ส่งถึงแล้ว" ไม่ได้ (ยังแสดงถ้าลูกค้ากดแล้ว) */
  customerCloses?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [status, setStatus] = useState<DeliveryStatus>(info.delivery_status);
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(info.shipping_carrier);
  const [tracking, setTracking] = useState(info.tracking_no ?? "");
  const [note, setNote] = useState(info.delivered_note ?? "");

  const changes: DeliveryUpdateInput = {};
  if (status !== info.delivery_status) changes.delivery_status = status;
  if (carrier !== info.shipping_carrier) changes.shipping_carrier = carrier;
  if (tracking.trim() !== (info.tracking_no ?? "")) changes.tracking_no = tracking.trim() || null;
  if (note.trim() !== (info.delivered_note ?? "")) changes.delivered_note = note.trim() || null;
  const dirty = Object.keys(changes).length > 0;
  // ลำดับตามรายการใน SHIPPING_CARRIERS (ขนส่งที่ใช้บ่อยก่อน · "ร้านจัดส่งเอง"/"อื่น ๆ" ท้ายสุด) — ไม่เรียง ก-ฮ
  const carrierOptions = SHIPPING_CARRIERS.map((c) => ({ value: c, label: t(`enums.shippingCarrier.${c}`) }));

  const times = (
    <>
      {info.shipped_at && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.shippedAt")}</span>
          <span className="font-medium text-gray-800">{formatDate(info.shipped_at, locale, { withTime: true })}</span>
        </div>
      )}
      {info.delivered_at && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.deliveredAt")}</span>
          <span className="font-medium text-gray-800">{formatDate(info.delivered_at, locale, { withTime: true })}</span>
        </div>
      )}
    </>
  );

  if (!canUpdate) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="m-0 font-medium text-gray-600">{t("orders.deliveryTitle")}</p>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.deliveryStatusLabel")}</span>
          <StatusBadge group="deliveryStatus" value={info.delivery_status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.shippingCarrier")}</span>
          <span className="font-medium text-gray-800">{info.shipping_carrier ? t(`enums.shippingCarrier.${info.shipping_carrier}`) : "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.trackingNo")}</span>
          <span className="font-medium text-gray-800">{info.tracking_no || "—"}</span>
        </div>
        {times}
        {info.delivered_note && <p className="m-0 text-gray-700">{info.delivered_note}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="m-0 font-medium text-gray-600">{t("orders.deliveryTitle")}</p>
        <StatusBadge group="deliveryStatus" value={info.delivery_status} />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-gray-600">{t("orders.deliveryStatusLabel")}</span>
        <Select
          value={status}
          onChange={(v) => setStatus(v as DeliveryStatus)}
          options={DELIVERY_STATUSES.filter((s) => !customerCloses || s !== "delivered" || info.delivery_status === "delivered").map((s) => ({
            value: s,
            label: t(`enums.deliveryStatus.${s}`),
          }))}
        />
        {customerCloses && info.delivery_status !== "delivered" && (
          <span className="text-xs text-gray-500">{t("orders.customerConfirmsHint")}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-600">{t("orders.shippingCarrier")}</span>
        <Select
          value={carrier ?? undefined}
          onChange={(v) => setCarrier((v as ShippingCarrier | undefined) ?? null)}
          allowClear
          placeholder={t("orders.shippingCarrierPlaceholder")}
          options={carrierOptions}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-600">{t("orders.trackingNo")}</span>
        <Input
          value={tracking}
          maxLength={MAX_TRACKING}
          onChange={(e) => setTracking(e.target.value)}
          placeholder={t("orders.trackingPlaceholder")}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-600">{t("orders.deliveryNote")}</span>
        <TextArea
          rows={2}
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("orders.deliveryNotePlaceholder")}
        />
      </label>

      {times}

      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-xs text-gray-500">{t("orders.deliveryNotifyHint")}</p>
        <Button
          size="small"
          type="primary"
          icon={actionIcon("save", "small")}
          loading={saving}
          disabled={!dirty}
          onClick={() => onSave(changes)}
        >
          {t("orders.deliverySave")}
        </Button>
      </div>
    </div>
  );
}
