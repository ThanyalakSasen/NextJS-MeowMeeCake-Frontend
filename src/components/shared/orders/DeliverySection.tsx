"use client";
// ─────────────────────────────────────────────────────────────
// DeliverySection — สถานะจัดส่ง/บริษัทขนส่ง/เลขพัสดุ/หมายเหตุ ใน drawer ออเดอร์ (Manage Orders) และพรีออเดอร์ — BACKLOG2 §15.2 ข้อ 3
// ใช้เฉพาะ order_type = "delivery" · ไม่มีสิทธิ์ update = แสดงอย่างเดียว
// state ของฟอร์มเริ่มจาก info — parent ใส่ key={updated_at} ให้รีเซ็ตเองหลังบันทึก/ดึงข้อมูลใหม่
// ส่งเฉพาะฟิลด์ที่เปลี่ยน · shipped_at/delivered_at backend ตั้งให้เองตามสถานะ (ไม่ต้องกรอก)
// ไม่มีปุ่ม/dropdown เปลี่ยนสถานะจัดส่งตรง ๆ — flow: กำลังเตรียม → "พร้อมจัดส่ง" (order ready) → เลือกขนส่ง + กรอกเลขพัสดุ
// ตอนพร้อมส่งมอบ: กรอกครบ (ขนส่ง + เลขพัสดุถ้าเป็นขนส่งพัสดุ) แล้วกดบันทึก = จัดส่งให้เลย (parent: delivery_status shipping +
// order completed → "ส่งสินค้าแล้ว") ไม่ต้องกดอีกปุ่ม (ผู้ใช้ขอ 2026-10-30) · ยังกรอกไม่ครบ = บันทึกอย่างเดียว
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, Input, TextArea, Select } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { actionIcon } from "@/components/shared/actions";
import { formatDate } from "@/i18n/format";
import { SHIPPING_CARRIERS, carrierNeedsTracking, type ShippingCarrier } from "@/constants/enumConfig";
import type { DeliveryInfo, DeliveryUpdateInput } from "@/types/order";

/** เลขพัสดุ: อังกฤษตัวพิมพ์ใหญ่ + ตัวเลข ไม่มีช่องว่าง สูงสุด 13 ตัว (เช่น TH12345678901 — ผู้ใช้ขอ 2026-10-30)
 *  backend รับได้ยาวกว่า (200) — หน้าจอจำกัดเอง · หมายเหตุตรงกับ backend schemas/order.ts updateDeliveryBody */
const MAX_TRACKING = 13;
const normalizeTracking = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, MAX_TRACKING);
const MAX_NOTE = 1000;

export function DeliverySection({
  info,
  canUpdate,
  saving,
  onSave,
  canMarkShipped,
  markingShipped,
  onMarkShipped,
}: {
  info: DeliveryInfo;
  canUpdate: boolean;
  saving: boolean;
  onSave: (input: DeliveryUpdateInput) => void;
  /** ออเดอร์อยู่สถานะพร้อมส่งมอบ (ready) + มีสิทธิ์ — บันทึกตอนกรอกครบ = จัดส่ง + ปิดออเดอร์ */
  canMarkShipped: boolean;
  markingShipped: boolean;
  onMarkShipped: (changes: DeliveryUpdateInput) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(info.shipping_carrier);
  const [tracking, setTracking] = useState(info.tracking_no ?? "");
  const [note, setNote] = useState(info.delivered_note ?? "");

  const changes: DeliveryUpdateInput = {};
  if (carrier !== info.shipping_carrier) changes.shipping_carrier = carrier;
  if (tracking.trim() !== (info.tracking_no ?? "")) changes.tracking_no = tracking.trim() || null;
  if (note.trim() !== (info.delivered_note ?? "")) changes.delivered_note = note.trim() || null;
  const dirty = Object.keys(changes).length > 0;
  // กรอกครบแล้ว (ขนส่ง + เลขพัสดุ ถ้าเป็นขนส่งพัสดุ) — ค่าในฟอร์ม · ตอนพร้อมส่งมอบ ปุ่มบันทึกจะจัดส่งให้เลย
  // กดได้แม้ไม่มีการแก้ (ข้อมูลบันทึกไว้ก่อนแล้วแต่ยังไม่ได้ปิดออเดอร์)
  const complete = !!carrier && (!carrierNeedsTracking(carrier) || !!tracking.trim());
  const willShip = canMarkShipped && complete;
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
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
          }}
          // พิมพ์ตัวเล็กก็ขึ้นเป็นตัวใหญ่ · ตัดภาษาไทย/สัญลักษณ์/ช่องว่างทิ้ง (รวมตอนวาง)
          onChange={(e) => setTracking(normalizeTracking(e.target.value))}
          style={{ textTransform: "uppercase" }}
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
        <p className={`m-0 text-xs ${canMarkShipped && !complete ? "text-amber-700" : "text-gray-500"}`}>
          {!canMarkShipped
            ? t("orders.deliveryNotifyHint")
            : complete ? t("orders.markShippedHint") : t("orders.markShippedNeedsInfo")}
        </p>
        {willShip ? (
          <Button
            size="small"
            type="primary"
            icon={actionIcon("verify", "small")}
            loading={markingShipped}
            disabled={saving}
            onClick={() => onMarkShipped(changes)}
          >
            {t("orders.markShipped")}
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={actionIcon("save", "small")}
            loading={saving}
            disabled={!dirty || markingShipped}
            onClick={() => onSave(changes)}
          >
            {t("orders.deliverySave")}
          </Button>
        )}
      </div>
    </div>
  );
}
