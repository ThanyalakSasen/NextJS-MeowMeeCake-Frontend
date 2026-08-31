"use client";
import { useTranslations, useLocale } from "next-intl";
import { Card, Switch, Button } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency } from "@/i18n/format";
import type { Product } from "@/types/product";
import { RatingDisplay } from "./RatingDisplay";

export function ProductCard({
  product,
  canUpdate,
  canDelete,
  onToggleVisible,
  onDelete,
}: {
  product: Product;
  canUpdate: boolean;
  canDelete: boolean;
  onToggleVisible: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const price = product.sale_price ?? product.product_price;

  return (
    <Card className="p-4 flex flex-col gap-2.5">
      <div className="aspect-[4/3] rounded-lg bg-brown-50 flex items-center justify-center text-3xl">🍰</div>
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-brown-900 line-clamp-2">{product.product_name_th}</p>
        <span className="text-sm text-gray-600 shrink-0">{t(`enums.orderType.${product.product_type}`)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-brown-900">{formatCurrency(price, locale)}</span>
        <RatingDisplay rating={product.avg_rating} count={product.review_count} />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>{t("products.stock", { n: product.product_stock_quantity })}</span>
        <span className="inline-flex items-center gap-1.5">
          {t("products.visible")}
          <Switch checked={product.is_visible} disabled={!canUpdate} onChange={onToggleVisible} />
        </span>
      </div>
      {canDelete && (
        <ConfirmDeletePopup onConfirm={onDelete}>
          <Button danger block>
            {t("common.delete")}
          </Button>
        </ConfirmDeletePopup>
      )}
    </Card>
  );
}
