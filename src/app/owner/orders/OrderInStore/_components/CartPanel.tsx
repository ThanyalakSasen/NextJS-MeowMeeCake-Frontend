"use client";
// ตะกร้าฝั่งขวาของ POS — แก้จำนวน/ลบ/ล้าง + ส่วนลดเพิ่มเติม + ชื่อลูกค้า + วิธีชำระ + ปุ่มยืนยัน
import { Empty, Segmented } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Input, InputNumber } from "@/components/base";
import { formatCurrency } from "@/i18n/format";
import type { CartLine } from "../posCart";
import type { PaymentMethod } from "../usePOSViewModel";

export function CartPanel({
  cart,
  itemCount,
  subtotal,
  total,
  customerName,
  extraDiscount,
  paymentMethod,
  canCreate,
  submitting,
  onChangeQty,
  onRemove,
  onClear,
  onCustomerName,
  onExtraDiscount,
  onPaymentMethod,
  onConfirm,
}: {
  cart: CartLine[];
  itemCount: number;
  subtotal: number;
  total: number;
  customerName: string;
  extraDiscount: number;
  paymentMethod: PaymentMethod;
  canCreate: boolean;
  submitting: boolean;
  onChangeQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCustomerName: (v: string) => void;
  onExtraDiscount: (v: number) => void;
  onPaymentMethod: (v: PaymentMethod) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-card sticky top-4 flex h-fit flex-col">
      <div className="section-card-header">
        <span className="section-card-title flex items-center gap-2">
          <ShoppingCartIcon className="h-5 w-5 text-gray-500" />
          {t("pos.cart")}
          {itemCount > 0 && <span className="badge badge-info">{t("pos.itemCount", { n: itemCount })}</span>}
        </span>
        {cart.length > 0 && (
          <button type="button" className="section-card-link" onClick={onClear}>
            {t("pos.clearCart")}
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="px-5 py-10">
          <Empty description={<span className="text-sm text-gray-600">{t("pos.cartEmpty")}</span>} />
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto px-5 py-3">
          {cart.map((c) => (
            <li key={c.productId} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brown-800">{c.name}</p>
                <p className="text-sm text-gray-600">{formatCurrency(c.price, locale)}</p>
              </div>
              <InputNumber
                size="small"
                min={1}
                max={c.stock}
                value={c.qty}
                onChange={(v) => onChangeQty(c.productId, Number(v) || 1)}
                style={{ width: 64 }}
              />
              <span className="w-16 text-right text-sm font-semibold text-gray-700">
                {formatCurrency(c.price * c.qty, locale)}
              </span>
              <Button
                size="small"
                type="text"
                danger
                aria-label={t("common.delete")}
                icon={<TrashIcon className="h-4 w-4" />}
                onClick={() => onRemove(c.productId)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("pos.subtotal")}</span>
          <span className="font-medium text-gray-800">{formatCurrency(subtotal, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("pos.extraDiscount")}</span>
          <InputNumber
            size="small"
            min={0}
            max={subtotal}
            value={extraDiscount}
            onChange={(v) => onExtraDiscount(Number(v) || 0)}
            style={{ width: 104 }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">{t("pos.payable")}</span>
          <span className="text-lg font-bold text-brown-800">{formatCurrency(total, locale)}</span>
        </div>
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
            disabled={cart.length === 0 || submitting}
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
