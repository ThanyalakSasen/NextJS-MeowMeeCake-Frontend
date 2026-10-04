"use client";
// บิลปัจจุบัน — รายการสินค้าที่สแกน (รหัส · ชื่อ + ราคาต่อหน่วย + ป้ายโปร · จำนวน −/+ · รวม)
// ลดจำนวนจนเหลือ 0 = เอาออกจากบิล (ไม่มีปุ่มลบแยก)
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import type { Promotion } from "@/types/promotion";
import type { CartLine } from "../posCart";

export function BillCard({
  cart,
  itemCount,
  promosOf,
  onIncrease,
  onDecrease,
}: {
  cart: CartLine[];
  itemCount: number;
  promosOf: (productId: string, categoryId: string | null) => Promotion[];
  onIncrease: (line: CartLine) => void;
  onDecrease: (line: CartLine) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col rounded-[20px] border border-gray-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-3 border-b border-gray-100 px-[18px] pb-3 pt-4">
        <h2 className="m-0 text-xl font-semibold text-brown-900">{t("pos.billTitle")}</h2>
        <span className="text-sm text-gray-600">{t("pos.itemCount", { n: itemCount })}</span>
      </div>

      <div className="flex gap-2.5 border-b border-gray-100 px-[18px] py-2 text-sm font-semibold text-gray-600">
        <span className="w-24 shrink-0">{t("pos.colCode")}</span>
        <span className="flex-1">{t("pos.colProduct")}</span>
        <span className="w-[122px] text-center">{t("pos.colQty")}</span>
        <span className="w-20 text-right">{t("pos.colTotal")}</span>
      </div>

      <div className="min-h-80 px-[18px] pb-2">
        {cart.length === 0 && <p className="m-0 px-2.5 py-20 text-center text-gray-600">{t("pos.billEmpty")}</p>}
        {cart.map((l) => {
          const promos = promosOf(l.productId, l.categoryId);
          const atMax = l.qty >= l.stock;
          return (
            <div key={l.productId} className="flex items-center gap-2.5 border-b border-gray-100 py-2.5">
              <span className="w-24 shrink-0 truncate font-mono text-xs text-gray-500">{l.code ?? "—"}</span>
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="font-medium text-brown-900">{l.name}</span>
                <span className="text-sm text-gray-600">{t("pos.unitPrice", { price: formatCurrency(l.price, locale) })}</span>
                {promos.length > 0 && (
                  <span className="text-xs font-medium text-pink-700">
                    {t("pos.promoTag", { name: promos.map((p) => p.promotion_name).join(", ") })}
                  </span>
                )}
              </div>
              <div className="flex w-[122px] items-center justify-center rounded-[10px] border border-gray-300">
                <button
                  type="button"
                  onClick={() => onDecrease(l)}
                  aria-label={t("pos.decreaseQty")}
                  className="h-10 w-11 cursor-pointer border-none bg-transparent text-lg text-brown-900"
                >
                  −
                </button>
                <span className="min-w-[30px] text-center font-semibold tabular-nums">{l.qty}</span>
                <button
                  type="button"
                  onClick={() => onIncrease(l)}
                  disabled={atMax}
                  aria-label={t("pos.increaseQty")}
                  title={atMax ? t("pos.stockLeft", { n: l.stock }) : undefined}
                  className="h-10 w-11 cursor-pointer border-none bg-transparent text-lg text-brown-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right font-semibold tabular-nums">{formatCurrency(l.price * l.qty, locale)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
