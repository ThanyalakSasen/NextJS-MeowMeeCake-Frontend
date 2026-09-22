"use client";
// การ์ดคูปอง 1 ใบ — โค้ด, มูลค่าส่วนลด, ความคืบหน้าการใช้, ขอบเขต, ช่องทาง, สถานะ
import { useTranslations, useLocale } from "next-intl";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { BuildingStorefrontIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import { Button, ProgressBar, Switch, Tag } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency, formatDate } from "@/i18n/format";
import { DISCOUNT_TYPE_CONFIG, COUPON_STATUS_CONFIG } from "@/constants/enumConfig";
import type { CouponRow } from "../useCouponsViewModel";
import { usagePct } from "../couponForm";

export function CouponCard({
  coupon,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onToggle,
}: {
  coupon: CouponRow;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (c: CouponRow) => void;
  onDelete: (id: string) => void;
  onToggle: (c: CouponRow) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const statusCfg = COUPON_STATUS_CONFIG[coupon.status];
  const typeCfg = DISCOUNT_TYPE_CONFIG[coupon.discount_type];
  const pct = usagePct(coupon);
  const isExpired = coupon.status === "expired";

  const discountLabel =
    coupon.discount_type === "Percentage"
      ? `${coupon.discount_value}% OFF`
      : coupon.discount_type === "Amount"
        ? `${formatCurrency(coupon.discount_value, locale)} OFF`
        : t("coupons.freeShipping");

  const scopeLabel =
    coupon.applicable_products.length > 0
      ? t("coupons.scopeProducts", { n: coupon.applicable_products.length })
      : coupon.applicable_categories.length > 0
        ? t("coupons.scopeCategories", { n: coupon.applicable_categories.length })
        : t("coupons.scopeAll");

  const minParts: string[] = [];
  if (coupon.min_quantity) minParts.push(t("coupons.minQtyLabel", { n: coupon.min_quantity }));
  if (coupon.min_order_amount) minParts.push(t("coupons.minOrderLabel", { amount: formatCurrency(coupon.min_order_amount, locale) }));
  const minLabel = minParts.length > 0 ? minParts.join(" + ") : t("coupons.noMinimum");

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:border-gray-200 hover:shadow-md ${isExpired ? "opacity-60" : ""}`}>
      <div className="flex">
        <div className="w-1 shrink-0" style={{ background: statusCfg.color }} />

        <div className="flex-1 p-3.5">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-bold tracking-wider text-brown-800">{coupon.promotion_code}</p>
              {coupon.promotion_name && <p className="mt-0.5 text-xs text-gray-400">{coupon.promotion_name}</p>}
            </div>
            <div className="flex items-center gap-1">
              {!isExpired && canUpdate && (
                <Button type="text" size="small" icon={<PencilSquareIcon className="h-3.5 w-3.5" />} onClick={() => onEdit(coupon)} />
              )}
              {canDelete && (
                <ConfirmDeletePopup title={t("coupons.deleteConfirm", { code: coupon.promotion_code })} onConfirm={() => onDelete(coupon._id)}>
                  <Button type="text" size="small" danger icon={<TrashIcon className="h-3.5 w-3.5" />} />
                </ConfirmDeletePopup>
              )}
            </div>
          </div>

          <div className="mb-1">
            <p className="text-2xl font-bold" style={{ color: typeCfg.color }}>{discountLabel}</p>
            <p className="text-xs text-gray-400">{t(`enums.discountType.${coupon.discount_type}`)}</p>
          </div>

          {coupon.usage_limit ? (
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                <span>{t("coupons.usageOf", { used: coupon.used_count, limit: coupon.usage_limit })}</span>
                <span>{pct}%</span>
              </div>
              <ProgressBar percent={pct} color={typeCfg.color} />
            </div>
          ) : (
            <p className="mb-2 text-xs text-gray-400">{t("coupons.usageUnlimited", { used: coupon.used_count })}</p>
          )}

          <div className="flex flex-col gap-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
            <span>{formatDate(coupon.start_date, locale)} – {formatDate(coupon.end_date, locale)}</span>
            <span>{minLabel} · {scopeLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3.5 py-2">
        <div className="flex items-center gap-1">
          <Tag color={statusCfg.antColor}>{t(`enums.couponStatus.${coupon.status}`)}</Tag>
          {coupon.applicable_channels.includes("instore") && (
            <Tag icon={<BuildingStorefrontIcon className="mr-1 inline h-3 w-3" />}>{t("coupons.channelInstore")}</Tag>
          )}
          {coupon.applicable_channels.includes("online") && (
            <Tag icon={<GlobeAltIcon className="mr-1 inline h-3 w-3" />}>{t("coupons.channelOnline")}</Tag>
          )}
        </div>
        <Switch checked={coupon.is_active} disabled={isExpired || !canUpdate} onChange={() => onToggle(coupon)} aria-label={coupon.promotion_code} />
      </div>
    </div>
  );
}

