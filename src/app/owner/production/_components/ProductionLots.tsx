"use client";
// ล็อตสินค้าของใบสั่งผลิตที่ปิดงานแล้ว (backend สร้างตอนปิดงาน 1 ล็อตต่อรายการ) + ปุ่มพิมพ์ฉลากบาร์โค้ด
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Button, Spinner } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { ExpiryTag, LotLabelModal, labelDate } from "@/components/shared/lots";
import { productLotsService } from "@/services/productLots";

export function ProductionLots({ orderId }: { orderId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [printing, setPrinting] = useState(false);
  const q = useQuery({
    queryKey: ["product-lots", "by-order", orderId],
    queryFn: () => productLotsService.list({ production_order_id: orderId, limit: 100 }),
  });
  const lots = q.data?.data ?? [];

  // ใบที่ปิดงานก่อนมีระบบล็อต → ไม่มีล็อต ไม่ต้องโชว์ส่วนนี้
  if (!q.isLoading && lots.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="m-0 text-sm font-semibold text-gray-500">{t("production.lotsTitle", { n: lots.length })}</p>
        {lots.length > 0 && (
          <Button size="small" icon={actionIcon("print", "small")} onClick={() => setPrinting(true)}>
            {t("lots.printLabels")}
          </Button>
        )}
      </div>
      {q.isLoading ? (
        <div className="flex justify-center py-3"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {lots.map((l) => (
            <div key={l._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm text-gray-800">{l.product_name_th}</p>
                <p className="m-0 text-xs text-gray-500">
                  <span className="font-mono">{l.lot_no}</span> · {t("lots.produced")} {labelDate(l.produced_date, locale)} ·{" "}
                  {l.expiry_date ? `${t("lots.expires")} ${labelDate(l.expiry_date, locale)}` : t("lots.noExpiry")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <ExpiryTag state={l.expiry_state} />
                <span className="text-xs text-gray-500">
                  {l.qty_remaining == null ? l.qty_produced : `${l.qty_remaining}/${l.qty_produced}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {printing && <LotLabelModal lots={lots} onClose={() => setPrinting(false)} />}
    </div>
  );
}
