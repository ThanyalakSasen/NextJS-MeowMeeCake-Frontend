"use client";
// ปิดงานผลิต (กำลังผลิต → เสร็จแล้ว) — เลือกว่าจะตัดวัตถุดิบ/เพิ่มสต็อกสินค้าตาม "จำนวนที่วางแผน" หรือ "จำนวนที่ผลิตได้จริง"
// ผลิตได้จริง: กรอกต่อรายการ (ค่าเริ่มต้น = จำนวนที่วางแผน) · 0 = ผลิตไม่ได้เลย → รายการนั้นถูกยกเลิก ไม่ตัดวัตถุดิบ
// แสดงเฉพาะรายการที่ยังไม่ถูกตัดวัตถุดิบ (ที่ตัดแยกไปก่อนแล้ว backend ไม่ตัดซ้ำ)
// state เริ่มใหม่ทุกครั้งที่เปิดใบใหม่ — ผู้เรียกใส่ key={order._id}
import { useState } from "react";
import { InputNumber, Modal, Radio } from "antd";
import { useTranslations } from "next-intl";
import type { ProductionOrder } from "@/types/productionOrder";
import { modalButtonIcons } from "@/components/shared/actions";

export interface CompleteProductionValue {
  useActual: boolean;
  /** item _id → จำนวนที่ผลิตได้จริง (มีเฉพาะตอน useActual) */
  actuals: Record<string, number>;
}

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
  const [useActual, setUseActual] = useState(false);
  const [actuals, setActuals] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(items.map((it) => [it._id, it.actual_qty ?? it.planned_qty])),
  );
  const missing = useActual && items.some((it) => actuals[it._id] == null);
  const icons = modalButtonIcons("save");

  const handleOk = () =>
    onSubmit({
      useActual,
      actuals: useActual ? Object.fromEntries(items.map((it) => [it._id, actuals[it._id] ?? it.planned_qty])) : {},
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

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t("production.deductBy")}</p>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={useActual}
            onChange={(e) => setUseActual(e.target.value)}
            options={[
              { value: false, label: t("production.deductByPlanned") },
              { value: true, label: t("production.deductByActual") },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_6rem_8rem] gap-3 px-3 text-xs font-medium text-gray-500">
            <span>{t("production.colProduct")}</span>
            <span className="text-right">{t("production.colPlanned")}</span>
            <span className="text-right">{t("production.colActual")}</span>
          </div>
          {items.map((it) => (
            <div key={it._id} className="grid grid-cols-[1fr_6rem_8rem] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <span className="truncate text-sm text-brown-800" title={it.product_name}>{it.product_name}</span>
              <span className="text-right text-sm text-gray-700">
                {it.planned_qty} {it.unit_abbr}
              </span>
              {useActual ? (
                <InputNumber
                  size="small"
                  min={0}
                  precision={0}
                  className="!w-full"
                  value={actuals[it._id]}
                  status={actuals[it._id] == null ? "error" : undefined}
                  onChange={(v) => setActuals((a) => ({ ...a, [it._id]: v }))}
                />
              ) : (
                <span className="text-right text-sm text-gray-500">—</span>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="py-2 text-center text-sm text-gray-500">{t("production.completeNoPending")}</p>}
          {useActual && <p className="m-0 text-xs text-gray-500">{t("production.actualZeroHint")}</p>}
        </div>
      </div>
    </Modal>
  );
}
