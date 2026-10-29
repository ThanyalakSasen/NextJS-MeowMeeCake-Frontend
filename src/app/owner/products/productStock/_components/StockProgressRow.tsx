"use client";
// สต็อกคงเหลือ + แถบบอกระดับ (สีตามสถานะ) — presentational cell
import { useLocale } from "next-intl";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import { formatNumber } from "@/i18n/format";
import { getStockStatus, LOW_STOCK_THRESHOLD } from "../stockStatus";

/** สต็อกที่ทำให้แถบเต็ม 100% (ไม่มี max_stock ในสินค้า → ใช้ heuristic จากเกณฑ์สต็อกต่ำ) */
const FULL_BAR_QTY = LOW_STOCK_THRESHOLD * 5;

export function StockProgressRow({ qty, unit }: { qty: number; unit: string }) {
  const locale = useLocale();
  const status = getStockStatus(qty);
  const pct = Math.max(3, Math.min(100, (qty / FULL_BAR_QTY) * 100));

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-brown-800">
        {formatNumber(qty, locale)} <span className="font-normal text-gray-600">{unit}</span>
      </span>
      <div className="h-1.5 w-24 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: STOCK_STATUS_CONFIG[status].dotColor }}
        />
      </div>
    </div>
  );
}
