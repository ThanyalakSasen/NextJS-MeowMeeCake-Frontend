"use client";
// แผงชำระเงินฝั่งขวาของ POS — สรุปยอด + เลือกโปรโมชัน + ส่วนลดเพิ่มเติม + ชื่อลูกค้า + วิธีชำระ + ปุ่มยืนยัน
// (รายการสินค้าย้ายไปฝั่งซ้าย — ScannedList)
import { Radio, Segmented } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { TagIcon } from "@heroicons/react/24/outline";
import { Button, Input, InputNumber, Tag } from "@/components/base";
import { formatCurrency } from "@/i18n/format";
import { actionIcon } from "@/components/shared/actions";
import type { Promotion } from "@/types/promotion";
import type { PromoBlock, PromoEval } from "../posPromotion";
import type { PaymentMethod } from "../usePOSViewModel";

export function CheckoutPanel({
  hasItems,
  subtotal,
  discount,
  total,
  promotionsEnabled,
  promoEvals,
  bestPromoId,
  selectedPromoId,
  appliedPromo,
  selectedPromoInvalid,
  customerName,
  extraDiscount,
  paymentMethod,
  canCreate,
  submitting,
  onSelectPromo,
  onCustomerName,
  onExtraDiscount,
  onPaymentMethod,
  onConfirm,
}: {
  hasItems: boolean;
  subtotal: number;
  discount: number;
  total: number;
  promotionsEnabled: boolean;
  promoEvals: PromoEval[];
  bestPromoId: string | null;
  selectedPromoId: string | null;
  appliedPromo: PromoEval | null;
  selectedPromoInvalid: boolean;
  customerName: string;
  extraDiscount: number;
  paymentMethod: PaymentMethod;
  canCreate: boolean;
  submitting: boolean;
  onSelectPromo: (id: string | null) => void;
  onCustomerName: (v: string) => void;
  onExtraDiscount: (v: number) => void;
  onPaymentMethod: (v: PaymentMethod) => void;
  onConfirm: () => void;
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

  const eligibleCount = promoEvals.filter((e) => e.eligible).length;

  return (
    <section className="section-card sticky top-4 flex h-fit flex-col">
      <div className="section-card-header">
        <span className="section-card-title">{t("pos.checkoutTitle")}</span>
      </div>

      {promotionsEnabled && hasItems && promoEvals.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <TagIcon className="h-4 w-4 text-gray-500" />
            {t("pos.promotion")}
            {eligibleCount > 0 && <span className="text-xs font-normal text-gray-500">· {t("pos.promoAvailable", { n: eligibleCount })}</span>}
          </p>
          <Radio.Group
            value={selectedPromoId ?? ""}
            onChange={(e) => onSelectPromo(e.target.value || null)}
            className="!flex flex-col gap-1.5"
          >
            <Radio value="">{t("pos.noPromotion")}</Radio>
            {promoEvals.map((ev) => {
              const p = ev.promotion;
              return (
                <Radio key={p._id} value={p._id} disabled={!ev.eligible} className="!items-start">
                  <span className="flex flex-col">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{p.promotion_name}</span>
                      <span className="text-xs text-gray-500">{valueLabel(p)}</span>
                      {p._id === bestPromoId && <Tag color="green" className="!m-0">{t("pos.bestPromo")}</Tag>}
                    </span>
                    {ev.eligible ? (
                      <span className="text-xs font-medium text-success">-{formatCurrency(ev.discount, locale)}</span>
                    ) : (
                      ev.block && <span className="text-xs text-gray-500">{blockText(ev.block)}</span>
                    )}
                    {p.max_user_per_user != null && (
                      <span className="text-xs text-amber-700">{t("pos.promoPerUserNote")}</span>
                    )}
                  </span>
                </Radio>
              );
            })}
          </Radio.Group>
          {selectedPromoInvalid && <p className="text-xs text-danger">{t("pos.selectedPromoInvalid")}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 px-5 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("pos.subtotal")}</span>
          <span className="font-medium text-gray-800">{formatCurrency(subtotal, locale)}</span>
        </div>
        {appliedPromo ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("pos.promoDiscountLine", { name: appliedPromo.promotion.promotion_name })}</span>
            <span className="font-medium text-success">-{formatCurrency(discount, locale)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("pos.extraDiscount")}</span>
            <InputNumber
              size="small"
              min={0}
              max={subtotal}
              value={extraDiscount}
              onChange={(v) => onExtraDiscount(Number(v) || 0)}
              style={{ width: 104 }}
              aria-label={t("pos.extraDiscount")}
            />
          </div>
        )}
        {appliedPromo && <p className="text-xs text-gray-500">{t("pos.manualDiscountDisabled")}</p>}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="font-medium text-gray-700">{t("pos.payable")}</span>
          <span className="text-lg font-bold text-brown-800">{formatCurrency(total, locale)}</span>
        </div>
        {appliedPromo && <p className="text-xs text-gray-500">{t("pos.promoBackendNote")}</p>}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-gray-100 px-5 py-3">
        <Input
          placeholder={t("pos.customerNamePlaceholder")}
          value={customerName}
          onChange={(e) => onCustomerName(e.target.value)}
        />
        <Segmented
          block
          value={paymentMethod}
          onChange={(v) => onPaymentMethod(v as PaymentMethod)}
          options={[
            { label: t("pos.cash"), value: "cash" },
            { label: t("pos.qr"), value: "qr" },
          ]}
        />
        {canCreate ? (
          <Button
            type="primary"
            icon={actionIcon("confirm")}
            disabled={!hasItems || submitting}
            loading={submitting}
            onClick={onConfirm}
          >
            {t("pos.confirm", { amount: formatCurrency(total, locale) })}
          </Button>
        ) : (
          <p className="text-center text-sm text-gray-600">{t("pos.noPermission")}</p>
        )}
      </div>
    </section>
  );
}
