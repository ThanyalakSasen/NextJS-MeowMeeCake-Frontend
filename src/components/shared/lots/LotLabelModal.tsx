"use client";
// พิมพ์ฉลากบาร์โค้ดของล็อตลงสติ๊กเกอร์ A4 — เลือกชนิดแผ่น + ดวงเริ่มต้น (ใช้แผ่นที่เหลือต่อ) + ชิ้นเริ่มต้น/จำนวนดวงต่อล็อต
// 1 ดวง = 1 ชิ้น รหัสไม่ซ้ำกัน (ดึงรหัสที่เก็บใน DB ตอนเปิด — productLotsService.pieces) · ค่าเริ่มต้น = ทุกชิ้นของล็อต · พิมพ์ซ้ำบางชิ้น = ตั้งชิ้นเริ่มต้น
// focusPiece — เปิดจากการสแกนชิ้นใดชิ้นหนึ่ง (LotLookupModal) = พิมพ์ซ้ำเฉพาะชิ้นนั้น · ชื่อร้านจากข้อมูลร้าน (/catalog/store-info)
// state เริ่มใหม่ทุกครั้งที่เปิด — ผู้เรียก render เฉพาะตอนเปิด
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { InputNumber, Select } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import { alert } from "@/lib/alert";
import { formatCurrency } from "@/i18n/format";
import { storeInfoService } from "@/services/storeInfo";
import { productLotsService } from "@/services/productLots";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";
import type { ProductLot } from "@/types/productLot";
import { SHEET_PRESETS, labelDate, labelPrice, perSheet, printLotLabels, type SheetPreset } from "./printLotLabels";

export function LotLabelModal({ lots, focusPiece, onClose }: { lots: ProductLot[]; focusPiece?: number | null; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [preset, setPreset] = useState<SheetPreset>("a4-21");
  const [startAt, setStartAt] = useState<number | null>(1);
  const storeQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const [fromPiece, setFromPiece] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lots.map((l) => [l._id, focusPiece ?? 1])),
  );
  const [copies, setCopies] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lots.map((l) => [l._id, focusPiece ? 1 : l.qty_produced])),
  );
  // ชิ้นเริ่ม 1..ผลิต · จำนวนดวงไม่เกินชิ้นที่เหลือถึงชิ้นสุดท้าย (รหัสชิ้นเกินจำนวนผลิตสแกนไม่เจอ)
  const fromOf = (l: ProductLot) => Math.min(Math.max(fromPiece[l._id] ?? 1, 1), l.qty_produced);
  const maxCopies = (l: ProductLot) => l.qty_produced - fromOf(l) + 1;
  const copiesOf = (l: ProductLot) => Math.min(copies[l._id] ?? 0, maxCopies(l));
  const total = lots.reduce((s, l) => s + copiesOf(l), 0);
  // รหัสประจำชิ้นของแต่ละล็อต (เรียงตามลำดับ) — ต้องได้ครบก่อนพิมพ์ (หน้าต่างพิมพ์ต้องเปิดใน click ไม่รอ API)
  const piecesQ = useQueries({
    queries: lots.map((l) => ({
      queryKey: ["product-lots", "pieces", l.lot_no],
      queryFn: () => productLotsService.pieces(l.lot_no),
      staleTime: Infinity,
    })),
  });
  const piecesLoading = piecesQ.some((q) => q.isPending);
  const piecesFailed = piecesQ.some((q) => q.isError);
  const codesOf = (l: ProductLot, i: number) =>
    (piecesQ[i].data ?? []).slice(fromOf(l) - 1, fromOf(l) - 1 + copiesOf(l)).map((p) => p.piece_code);
  const slots = perSheet(preset);
  const start = Math.min(startAt ?? 1, slots);
  const sheets = total > 0 ? Math.ceil((start - 1 + total) / slots) : 0;
  const icons = modalButtonIcons("print");

  const handlePrint = async () => {
    const ok = await printLotLabels(
      lots.map((lot, i) => ({ lot, codes: codesOf(lot, i) })).filter((j) => j.codes.length > 0),
      {
        preset,
        startAt: start,
        locale,
        storeName: storeQ.data?.store_name ?? "",
        price: (n) => formatCurrency(n, locale),
        texts: { produced: t("lots.produced"), expires: t("lots.expires"), noExpiry: t("lots.noExpiry"), lot: t("lots.lotShort") },
      },
    );
    if (!ok) alert.error(t("lots.popupBlocked"));
  };

  return (
    <Modal
      open
      title={t("lots.printTitle")}
      onCancel={onClose}
      onOk={handlePrint}
      okButtonProps={{ ...icons.okButtonProps, disabled: total === 0 || storeQ.isLoading || piecesLoading || piecesFailed }}
      cancelButtonProps={icons.cancelButtonProps}
      okText={`${t("lots.print")} (${total})`}
      cancelText={t("common.close")}
      width={560}
    >
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-600">{t("lots.sheetType")}</span>
          <Select
            className="!w-64"
            value={preset}
            onChange={(v) => setPreset(v as SheetPreset)}
            options={Object.entries(SHEET_PRESETS).map(([k, s]) => ({
              value: k,
              label: t("lots.sheetOption", { n: s.cols * s.rows, w: s.w, h: s.h }),
            }))}
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-600">{t("lots.startAt")}</span>
          <InputNumber
            className="!w-64"
            min={1}
            max={slots}
            precision={0}
            value={startAt}
            onChange={(v) => setStartAt(typeof v === "number" ? v : null)}
            suffix={<span className="text-xs text-gray-500">/ {slots}</span>}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] gap-3 px-3 text-xs font-medium text-gray-500">
            <span>{t("lots.colProduct")}</span>
            <span className="text-right">{t("lots.fromPiece")}</span>
            <span className="text-right">{t("lots.copies")}</span>
          </div>
          {lots.map((l) => (
            <div key={l._id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm text-brown-800" title={l.product_name_th ?? ""}>{l.product_name_th}</p>
                <p className="m-0 text-xs text-gray-500">
                  <span className="font-mono">{l.lot_no}</span>
                  {labelPrice(l) != null && <> · {formatCurrency(labelPrice(l)!, locale)}</>} · {t("lots.produced")} {labelDate(l.produced_date, locale)} ·{" "}
                  {l.expiry_date ? `${t("lots.expires")} ${labelDate(l.expiry_date, locale)}` : t("lots.noExpiry")}
                </p>
              </div>
              <InputNumber
                size="small"
                min={1}
                max={l.qty_produced}
                precision={0}
                className="!w-full"
                value={fromPiece[l._id]}
                onChange={(v) => setFromPiece((f) => ({ ...f, [l._id]: typeof v === "number" ? v : null }))}
              />
              <InputNumber
                size="small"
                min={0}
                max={maxCopies(l)}
                precision={0}
                className="!w-full"
                value={copies[l._id]}
                onChange={(v) => setCopies((c) => ({ ...c, [l._id]: typeof v === "number" ? v : null }))}
              />
            </div>
          ))}
        </div>

        <p className="m-0 text-xs text-gray-500">
          {total > 0 && <>{t("lots.sheetCount", { n: sheets })} · </>}
          {piecesFailed ? <span className="text-danger">{t("lots.piecesFailed")} </span> : null}
          {t("lots.pieceHint")} {t("lots.printHint")}
        </p>
      </div>
    </Modal>
  );
}
