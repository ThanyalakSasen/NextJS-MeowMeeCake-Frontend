"use client";
// ─────────────────────────────────────────────────────────────
// DeliverySection — สถานะจัดส่ง/บริษัทขนส่ง/เลขพัสดุ/หมายเหตุ ใน drawer ออเดอร์ (Manage Orders) และพรีออเดอร์ — BACKLOG2 §15.2 ข้อ 3
// ใช้เฉพาะ order_type = "delivery" · ไม่มีสิทธิ์ update = แสดงอย่างเดียว
// state ของฟอร์มเริ่มจาก info — parent ใส่ key={updated_at} ให้รีเซ็ตเองหลังบันทึก/ดึงข้อมูลใหม่
// ส่งเฉพาะฟิลด์ที่เปลี่ยน · shipped_at/delivered_at backend ตั้งให้เองตามสถานะ (ไม่ต้องกรอก)
// ไม่มีปุ่ม/dropdown เปลี่ยนสถานะจัดส่งตรง ๆ — flow: กำลังเตรียม → "พร้อมจัดส่ง" (order ready) → เลือกขนส่ง + กรอกเลขพัสดุ
// ตอนพร้อมส่งมอบ: กรอกครบ (ขนส่ง + เลขพัสดุถ้าเป็นขนส่งพัสดุ) แล้วกดบันทึก = จัดส่งให้เลย (parent: delivery_status shipping +
// order completed → "ส่งสินค้าแล้ว") ไม่ต้องกดอีกปุ่ม (ผู้ใช้ขอ 2026-10-30) · ถามยืนยันก่อนเสมอ (แจ้งลูกค้าแล้วย้อนไม่ได้)
// ยังกรอกไม่ครบ = บันทึกอย่างเดียว
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, Input, TextArea, Select } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { actionIcon } from "@/components/shared/actions";
import { formatDate } from "@/i18n/format";
import { confirmAlert } from "@/lib/alert";
import { SHIPPING_CARRIERS, carrierNeedsTracking, type ShippingCarrier } from "@/constants/enumConfig";
import type { DeliveryInfo, DeliveryUpdateInput } from "@/types/order";

/** เลขพัสดุ: อังกฤษตัวพิมพ์ใหญ่ + ตัวเลข ไม่มีช่องว่าง (ผู้ใช้ขอ 2026-10-30)
 *  เดิมตัดที่ 13 ตัวเงียบ ๆ (รวมตอนวาง) — ขนส่งอื่นนอกจากไปรษณีย์ไทยอาจยาวกว่า → ขยายเป็น 30 ตัว และไม่ตัดทิ้ง:
 *  ยาวเกิน = ขึ้น error + บันทึกไม่ได้ (เห็นว่าวางเลขผิด) · backend รับได้ 200 (schemas/order.ts updateDeliveryBody) */
const MAX_TRACKING = 30;
const normalizeTracking = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");
/** ไปรษณีย์ไทย (มาตรฐาน UPU S10): อักษร 2 + ตัวเลข 9 + TH = 13 ตัว เช่น EF123456789TH — ไม่ตรง = เตือน แต่ยังบันทึกได้
 *  ขนส่งอื่นยังไม่ตรวจรูปแบบ (ยังไม่มีเลขจริงมาเทียบ) */
const THAILAND_POST_TRACKING = /^[A-Z]{2}\d{9}TH$/;
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
  const trackingNo = tracking.trim();
  const trackingTooLong = trackingNo.length > MAX_TRACKING;
  const trackingOffFormat = carrier === "thailand_post" && !!trackingNo && !THAILAND_POST_TRACKING.test(trackingNo);
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
          status={trackingTooLong ? "error" : trackingOffFormat ? "warning" : undefined}
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
          }}
          // พิมพ์ตัวเล็กก็ขึ้นเป็นตัวใหญ่ · ตัดภาษาไทย/สัญลักษณ์/ช่องว่างทิ้ง (รวมตอนวาง)
          onChange={(e) => setTracking(normalizeTracking(e.target.value))}
          style={{ textTransform: "uppercase" }}
          placeholder={t("orders.trackingPlaceholder")}
        />
        {trackingTooLong ? (
          <span className="text-xs text-red-600">{t("orders.trackingTooLong", { max: MAX_TRACKING })}</span>
        ) : trackingOffFormat ? (
          <span className="text-xs text-amber-700">{t("orders.trackingThaiPostFormat")}</span>
        ) : null}
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
            disabled={saving || trackingTooLong}
            onClick={async () => {
              // แจ้งลูกค้า + ปิดออเดอร์ทันที ย้อนไม่ได้ — ถามก่อน ให้เห็นขนส่ง/เลขพัสดุที่จะส่งไป (กันพิมพ์เลขผิด/กดพลาด)
              const carrierName = carrier ? t(`enums.shippingCarrier.${carrier}`) : "";
              const ok = await confirmAlert(t("orders.markShippedConfirm"), {
                title: t("orders.markShippedConfirmTitle"),
                note: tracking.trim()
                  ? t("orders.markShippedConfirmNote", { carrier: carrierName, tracking: tracking.trim() })
                  : carrierName,
                confirmText: t("orders.markShipped"),
                cancelText: t("common.cancel"),
              });
              if (ok) onMarkShipped(changes);
            }}
          >
            {t("orders.markShipped")}
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={actionIcon("save", "small")}
            loading={saving}
            disabled={!dirty || markingShipped || trackingTooLong}
            onClick={() => onSave(changes)}
          >
            {t("orders.deliverySave")}
          </Button>
        )}
      </div>
    </div>
  );
}
