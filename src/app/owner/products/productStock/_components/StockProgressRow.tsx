"use client";
// สต็อกคงเหลือ + แถบบอกระดับ (สีตามสถานะ) — presentational cell
import { useLocale } from "next-intl";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import { formatNumber } from "@/i18n/format";
import { effectiveLowStockThreshold, getStockStatus } from "../stockStatus";

export function StockProgressRow({ qty, unit, threshold }: { qty: number; unit: string; threshold?: number | null }) {
  const locale = useLocale();
  const status = getStockStatus(qty, threshold);
  // แถบเต็ม 100% ที่ 5 เท่าของเกณฑ์ใกล้หมด (สินค้าไม่มี max_stock)
  const fullBarQty = Math.max(effectiveLowStockThreshold(threshold) * 5, 1);
  const pct = Math.max(3, Math.min(100, (qty / fullBarQty) * 100));

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
