"use client";
// แผงขวา: การ์ดโปรโมชัน (เลือกได้ทีละ 1 — backend รับ promotion_id เดียว) · สรุปยอด · ปุ่มชำระเงินสด/QR · ยกเลิกบิล
import { useTranslations, useLocale } from "next-intl";
import { CheckIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/i18n/format";
import type { Promotion } from "@/types/promotion";
import type { PromoBlock, PromoEval } from "../posPromotion";

export function PaymentAside({
  promotionsEnabled,
  promoEvals,
  billPromotions,
  bestPromoId,
  selectedPromoId,
  selectedPromoInvalid,
  subtotal,
  discount,
  total,
  canPay,
  canCreate,
  hasItems,
  onTogglePromo,
  onPayCash,
  onPayQr,
  onClearBill,
}: {
  promotionsEnabled: boolean;
  promoEvals: PromoEval[];
  billPromotions: Promotion[];
  bestPromoId: string | null;
  selectedPromoId: string | null;
  selectedPromoInvalid: boolean;
  subtotal: number;
  discount: number;
  total: number;
  canPay: boolean;
  canCreate: boolean;
  hasItems: boolean;
  onTogglePromo: (id: string) => void;
  onPayCash: () => void;
  onPayQr: () => void;
  onClearBill: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const valueLabel = (p: Promotion) =>
    p.discount_type === "Percentage"
      ? t("pos.promoPercent", { n: p.discount_value })
      : t("pos.promoAmount", { amount: formatCurrency(p.discount_value, locale) });

  const blockText = (b: PromoBlock) => {
    switch (b.key) {
      case "minAmount": return t("pos.promoBlock.minAmount", { min: formatCurrency(b.min, locale) });
      case "minQty": return t("pos.promoBlock.minQty", { min: b.min, current: b.current });
      default: return t(`pos.promoBlock.${b.key}`);
    }
  };

  return (
    <aside
      aria-label={t("pos.asideLabel")}
      className="flex min-w-0 flex-col rounded-[20px] border border-gray-200 bg-white lg:sticky lg:top-4 lg:h-fit"
    >
      {promotionsEnabled && (
        <div className="flex flex-col gap-2 px-[18px] pb-3 pt-4">
          <h3 className="m-0 text-[15px] font-semibold text-brown-800">{t("pos.promotion")}</h3>

          {!hasItems && billPromotions.length > 0 && (
            <p className="m-0 text-sm text-gray-600">
              {t("pos.billPromoBanner", { names: billPromotions.map((p) => p.promotion_name).join(", ") })}
            </p>
          )}
          {!hasItems && billPromotions.length === 0 && <p className="m-0 text-sm text-gray-500">{t("pos.promoHint")}</p>}

          {promoEvals.map((ev) => {
            const p = ev.promotion;
            const on = p._id === selectedPromoId && ev.eligible;
            return (
              <button
                key={p._id}
                type="button"
                disabled={!ev.eligible}
                onClick={() => onTogglePromo(p._id)}
                aria-pressed={on}
                className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left ${
                  on ? "border-success bg-green-50" : "border-gray-200 bg-white"
                } ${ev.eligible ? "cursor-pointer text-brown-900" : "cursor-not-allowed text-gray-500"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border-2 text-sm font-bold text-white ${
                    on ? "border-success bg-success" : "border-gray-400 bg-white"
                  }`}
                >
                  {on && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    {p.promotion_name}
                    {p._id === bestPromoId && (
                      <span className="rounded bg-green-100 px-1.5 text-[11px] font-semibold text-green-800">{t("pos.bestPromo")}</span>
                    )}
                  </span>
                  <span className={`text-xs ${ev.eligible ? "text-gray-600" : "text-amber-800"}`}>
                    {ev.eligible ? valueLabel(p) : ev.block && blockText(ev.block)}
                  </span>
                  {p.max_user_per_user != null && <span className="text-xs text-amber-700">{t("pos.promoPerUserNote")}</span>}
                </span>
                <span className="text-sm font-semibold text-success tabular-nums">
                  {ev.eligible ? `−${formatCurrency(ev.discount, locale)}` : ""}
                </span>
              </button>
            );
          })}
          {selectedPromoInvalid && <p className="m-0 text-xs text-danger">{t("pos.selectedPromoInvalid")}</p>}
        </div>
      )}

      <div
        className={`flex flex-col gap-3 rounded-b-[20px] bg-gray-50 px-[18px] pb-[18px] pt-3.5 ${
          promotionsEnabled ? "border-t border-gray-100" : "rounded-t-[20px]"
        }`}
      >
        <div className="flex justify-between">
          <span className="text-gray-600">{t("pos.subtotal")}</span>
          <span className="tabular-nums">{formatCurrency(subtotal, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("pos.promoDiscount")}</span>
          <span className="font-medium text-success tabular-nums">
            {discount > 0 ? `−${formatCurrency(discount, locale)}` : formatCurrency(0, locale)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-gray-300 pt-2">
          <span className="font-semibold">{t("pos.payable")}</span>
          <span className="text-[44px] font-semibold leading-tight text-brown-900 tabular-nums">{formatCurrency(total, locale)}</span>
        </div>
        {discount > 0 && <p className="m-0 text-xs text-gray-500">{t("pos.promoBackendNote")}</p>}

        {canCreate ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onPayCash}
              disabled={!canPay}
              className="min-h-[76px] cursor-pointer rounded-[14px] border-none bg-success text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("pos.cash")}
            </button>
            <button
              type="button"
              onClick={onPayQr}
              disabled={!canPay}
              className="min-h-[76px] cursor-pointer rounded-[14px] border-none bg-info text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("pos.qr")}
            </button>
          </div>
        ) : (
          <p className="m-0 text-center text-sm text-gray-600">{t("pos.noPermission")}</p>
        )}

        <button
          type="button"
          onClick={onClearBill}
          disabled={!hasItems}
          className="min-h-10 cursor-pointer border-none bg-transparent font-medium text-danger underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("pos.clearBill")}
        </button>
      </div>
    </aside>
  );
}
