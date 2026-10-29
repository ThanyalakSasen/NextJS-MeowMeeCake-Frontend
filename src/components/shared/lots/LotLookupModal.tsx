"use client";
// สแกนบาร์โค้ดบนฉลาก (รหัสประจำชิ้น หรือเลขล็อต) → ดูล็อต (สินค้า · ชิ้นที่ · วันผลิต/หมดอายุ · ใบสั่งผลิต/รอบ · คงเหลือ)
// เครื่องยิงบาร์โค้ดพิมพ์ตัวอักษรแล้วกด Enter ให้เอง (keyboard wedge) — ช่องโฟกัสรอไว้ สแกนต่อได้เรื่อย ๆ
import { useState, type ReactNode } from "react";
import { Modal } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Button, Input, Spinner } from "@/components/base";
import { productLotsService } from "@/services/productLots";
import { isApiError } from "@/types/api";
import { ExpiryTag } from "./ExpiryTag";
import { LotLabelModal } from "./LotLabelModal";
import { labelDate } from "./printLotLabels";
import { actionIcon } from "@/components/shared/actions";

export function LotLookupModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [lotNo, setLotNo] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const q = useQuery({
    queryKey: ["product-lots", "by-no", lotNo],
    queryFn: () => productLotsService.getByNo(lotNo!),
    enabled: !!lotNo,
    retry: false,
  });
  const lot = q.data;

  const submit = () => {
    const v = input.trim().toUpperCase();
    if (!v) return;
    setLotNo(v);
    setInput("");
  };

  const row = (label: string, value: ReactNode) => (
    <div className="flex justify-between gap-3 border-b border-gray-50 py-1.5 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right text-gray-800">{value}</span>
    </div>
  );

  return (
    <Modal open title={t("lots.lookupTitle")} onCancel={onClose} footer={null} width={480}>
      <div className="flex flex-col gap-4">
        <Input
          autoFocus
          allowClear
          value={input}
          placeholder={t("lots.scanPlaceholder")}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={submit}
        />

        {q.isFetching ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : q.isError ? (
          <p className="m-0 py-4 text-center text-sm text-danger">
            {isApiError(q.error) && q.error.status !== 404 ? q.error.message : t("lots.notFound", { no: lotNo ?? "" })}
          </p>
        ) : lot ? (
          <div className="rounded-lg border border-gray-100 px-3 py-2">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 font-medium text-brown-900">{lot.product_name_th}</p>
                <p className="m-0 font-mono text-xs text-gray-500">{lot.piece_code ?? lot.lot_no}</p>
              </div>
              <ExpiryTag state={lot.expiry_state} />
            </div>
            {lot.piece_no != null && row(t("lots.piece"), t("lots.pieceOf", { n: lot.piece_no, total: lot.qty_produced }))}
            {row(t("lots.colLot"), <span className="font-mono">{lot.lot_no}</span>)}
            {row(t("lots.colProduced"), labelDate(lot.produced_date, locale))}
            {row(t("lots.colExpiry"), lot.expiry_date ? labelDate(lot.expiry_date, locale) : t("lots.noExpiry"))}
            {row(t("lots.productionNo"), <span className="font-mono">{lot.production_no ?? "—"}</span>)}
            {lot.round_name && row(t("lots.round"), lot.round_name)}
            {row(t("lots.qtyProduced"), lot.qty_produced)}
            {row(t("lots.qtyRemaining"), lot.qty_remaining ?? t("lots.preorderNoStock"))}
            <div className="flex justify-end pt-2">
              <Button size="small" icon={actionIcon("print", "small")} onClick={() => setPrinting(true)}>
                {t("lots.printLabels")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {/* สแกนชิ้นมา = พิมพ์ซ้ำเฉพาะชิ้นนั้น (เปลี่ยนชิ้น/จำนวนในหน้าต่างพิมพ์ได้) */}
      {printing && lot && <LotLabelModal lots={[lot]} focusPiece={lot.piece_no} onClose={() => setPrinting(false)} />}
    </Modal>
  );
}
