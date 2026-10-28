"use client";
// พิมพ์ฉลากบาร์โค้ดของล็อต — เลือกขนาดฉลาก + จำนวนดวงต่อล็อต (ค่าเริ่มต้น = จำนวนที่ผลิต 1 ดวงต่อชิ้น)
// state เริ่มใหม่ทุกครั้งที่เปิด — ผู้เรียก render เฉพาะตอนเปิด
import { useState } from "react";
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { InputNumber, Select } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import { alert } from "@/lib/alert";
import type { ProductLot } from "@/types/productLot";
import { LABEL_SIZES, labelDate, printLotLabels, type LabelSize } from "./printLotLabels";

export function LotLabelModal({ lots, onClose }: { lots: ProductLot[]; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [size, setSize] = useState<LabelSize>("50x30");
  const [copies, setCopies] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lots.map((l) => [l._id, l.qty_produced])),
  );
  const total = lots.reduce((s, l) => s + (copies[l._id] ?? 0), 0);
  const icons = modalButtonIcons("print");

  const handlePrint = async () => {
    const ok = await printLotLabels(
      lots.map((lot) => ({ lot, copies: copies[lot._id] ?? 0 })).filter((j) => j.copies > 0),
      size,
      locale,
      { produced: t("lots.produced"), expires: t("lots.expires"), noExpiry: t("lots.noExpiry") },
    );
    if (!ok) alert.error(t("lots.popupBlocked"));
  };

  return (
    <Modal
      open
      title={t("lots.printTitle")}
      onCancel={onClose}
      onOk={handlePrint}
      okButtonProps={{ ...icons.okButtonProps, disabled: total === 0 }}
      cancelButtonProps={icons.cancelButtonProps}
      okText={`${t("lots.print")} (${total})`}
      cancelText={t("common.close")}
      width={560}
    >
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-600">{t("lots.labelSize")}</span>
          <Select
            className="!w-40"
            value={size}
            onChange={(v) => setSize(v as LabelSize)}
            options={Object.entries(LABEL_SIZES).map(([k, s]) => ({ value: k, label: `${s.w} × ${s.h} mm` }))}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3 px-3 text-xs font-medium text-gray-500">
            <span>{t("lots.colProduct")}</span>
            <span className="text-right">{t("lots.copies")}</span>
          </div>
          {lots.map((l) => (
            <div key={l._id} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm text-brown-800" title={l.product_name_th ?? ""}>{l.product_name_th}</p>
                <p className="m-0 text-xs text-gray-500">
                  <span className="font-mono">{l.lot_no}</span> · {t("lots.produced")} {labelDate(l.produced_date, locale)} ·{" "}
                  {l.expiry_date ? `${t("lots.expires")} ${labelDate(l.expiry_date, locale)}` : t("lots.noExpiry")}
                </p>
              </div>
              <InputNumber
                size="small"
                min={0}
                max={500}
                precision={0}
                className="!w-full"
                value={copies[l._id]}
                onChange={(v) => setCopies((c) => ({ ...c, [l._id]: typeof v === "number" ? v : null }))}
              />
            </div>
          ))}
        </div>

        <p className="m-0 text-xs text-gray-500">{t("lots.printHint")}</p>
      </div>
    </Modal>
  );
}
