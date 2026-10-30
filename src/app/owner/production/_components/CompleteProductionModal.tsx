"use client";
// ปิดงานผลิต (กำลังผลิต → เสร็จแล้ว) — ตัดวัตถุดิบ/เพิ่มสต็อกสินค้าตาม "จำนวนที่วางแผน" เสมอ
// (เอาตัวเลือก "จำนวนที่ผลิตได้จริง" ออก — ผู้ใช้ขอ 2026-10-30 · backend ยังรับ use_actual ได้ แต่หน้าจอไม่ส่งแล้ว)
// แสดงเฉพาะรายการที่ยังไม่ถูกตัดวัตถุดิบ (ที่ตัดแยกไปก่อนแล้ว backend ไม่ตัดซ้ำ)
// วันผลิต/วันหมดอายุของล็อต (ทุกรายการที่ไม่ยกเลิก — backend สร้างล็อต + เลขบาร์โค้ดตอนปิดงาน):
//   วันผลิต 1 วันต่อใบ (ค่าเริ่มต้น = วันในใบสั่งผลิต) · หมดอายุต่อสินค้า = วันผลิต + อายุสินค้า แก้ได้ตามจริง / ล้างได้
//   แก้วันหมดอายุเองแล้ว เปลี่ยนวันผลิตทีหลังจะไม่ทับค่าที่แก้
// state เริ่มใหม่ทุกครั้งที่เปิดใบใหม่ — ผู้เรียกใส่ key={order._id}
import { useState } from "react";
import { Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslations } from "next-intl";
import { DatePicker } from "@/components/base";
import type { CompleteLotInput, ProductionOrder } from "@/types/productionOrder";
import { modalButtonIcons } from "@/components/shared/actions";

export interface CompleteProductionValue {
  lots: CompleteLotInput[];
}

const DATE_FMT = "YYYY-MM-DD";

export function CompleteProductionModal({
  order,
  saving,
  onClose,
  onSubmit,
}: {
  order: ProductionOrder;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: CompleteProductionValue) => void;
}) {
  const t = useTranslations();
  const items = order.items.filter((it) => it.item_status !== "done" && it.item_status !== "cancelled");
  const lotItems = order.items.filter((it) => it.item_status !== "cancelled");
  const [produced, setProduced] = useState<Dayjs>(() => dayjs(order.production_date).startOf("day"));
  // undefined = ยังไม่แก้เอง (ใช้ วันผลิต + อายุสินค้า) · null = ไม่มีวันหมดอายุ
  const [expiryEdits, setExpiryEdits] = useState<Record<string, Dayjs | null | undefined>>({});
  const expiryOf = (it: (typeof lotItems)[number]): Dayjs | null => {
    const edited = expiryEdits[it._id];
    if (edited !== undefined) return edited;
    return it.shelf_life_days ? produced.add(it.shelf_life_days, "day") : null;
  };
  const badExpiry = lotItems.some((it) => {
    const e = expiryOf(it);
    return e != null && e.isBefore(produced, "day");
  });
  const missing = badExpiry;
  const icons = modalButtonIcons("save");

  const handleOk = () =>
    onSubmit({
      lots: lotItems.map((it) => ({
        item_id: it._id,
        produced_date: produced.format(DATE_FMT),
        expiry_date: expiryOf(it)?.format(DATE_FMT) ?? null,
      })),
    });

  return (
    <Modal
      open
      title={t("production.completeTitle", { no: order.production_no })}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okButtonProps={{ ...icons.okButtonProps, disabled: missing }}
      cancelButtonProps={icons.cancelButtonProps}
      okText={t("production.completeSubmit")}
      cancelText={t("common.cancel")}
      width={560}
    >
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600">{t("production.completeHint")}</p>

        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-medium text-gray-700">{t("production.deductByPlannedTitle")}</p>
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3 px-3 text-xs font-medium text-gray-500">
            <span>{t("production.colProduct")}</span>
            <span className="text-right">{t("production.colPlanned")}</span>
          </div>
          {items.map((it) => (
            <div key={it._id} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <span className="truncate text-sm text-brown-800" title={it.product_name}>{it.product_name}</span>
              <span className="text-right text-sm text-gray-700">
                {it.planned_qty} {it.unit_abbr}
              </span>
            </div>
          ))}
          {items.length === 0 && <p className="py-2 text-center text-sm text-gray-500">{t("production.completeNoPending")}</p>}
        </div>

        {lotItems.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <p className="m-0 text-sm font-medium text-gray-700">{t("production.lotDatesTitle")}</p>
            <p className="m-0 text-xs text-gray-500">{t("production.lotDatesHint")}</p>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-600">{t("production.producedDate")}</span>
              <DatePicker
                className="!w-40"
                format="DD/MM/YYYY"
                allowClear={false}
                value={produced}
                onChange={(d) => { if (d && !Array.isArray(d)) setProduced(d.startOf("day")); }}
              />
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-3 px-3 text-xs font-medium text-gray-500">
              <span>{t("production.colProduct")}</span>
              <span>{t("production.expiryDate")}</span>
            </div>
            {lotItems.map((it) => {
              const expiry = expiryOf(it);
              const invalid = expiry != null && expiry.isBefore(produced, "day");
              return (
                <div key={it._id} className="grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                  <span className="truncate text-sm text-brown-800" title={it.product_name}>
                    {it.product_name}
                    {it.shelf_life_days ? (
                      <span className="block text-xs text-gray-500">{t("production.shelfLife", { n: it.shelf_life_days })}</span>
                    ) : null}
                  </span>
                  <DatePicker
                    size="small"
                    format="DD/MM/YYYY"
                    placeholder={t("production.noExpiry")}
                    status={invalid ? "error" : undefined}
                    value={expiry}
                    onChange={(d) => {
                      if (Array.isArray(d)) return;
                      setExpiryEdits((e) => ({ ...e, [it._id]: d ? d.startOf("day") : null }));
                    }}
                  />
                </div>
              );
            })}
            {badExpiry && <p className="m-0 text-xs text-danger">{t("production.expiryBeforeProduced")}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
