"use client";
import { useTranslations, useLocale } from "next-intl";
import { Card, Switch } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency } from "@/i18n/format";
import { resolveUploadUrl } from "@/lib/uploads";
import { PRODUCT_TYPE_CONFIG, PRODUCT_TYPE_FALLBACK } from "@/constants/enumConfig";
import type { Product } from "@/types/product";
import { EditButton, DeleteButton } from "@/components/shared/actions";
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
  const typeCfg = PRODUCT_TYPE_CONFIG[product.product_type] ?? PRODUCT_TYPE_FALLBACK;

  return (
    // รูปติดขอบบน/ซ้าย/ขวาของการ์ด (padding อยู่ที่ส่วนเนื้อหาแทน) — overflow-hidden ให้มุมมนของการ์ดตัดมุมรูปด้วย
    // h-full + flex-col: การ์ดยืดเต็มแถวของ grid แล้วปุ่มแก้ไข/ลบชิดล่างเสมอ
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-brown-50 flex items-center justify-center text-3xl">
        {product.product_img?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveUploadUrl(product.product_img[0])} alt={product.product_name_th} className="h-full w-full object-cover" />
        ) : (
          "🍰"
        )}
        {/* ประเภทสินค้าเป็นป้ายสีทับมุมซ้ายบนของรูป — เห็นได้ทันที และไม่กินบรรทัดในส่วนเนื้อหา */}
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold shadow-sm"
          style={{ color: typeCfg.color, background: typeCfg.bg }}
        >
          {t(`enums.productType.${product.product_type}`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* ชื่อตัดที่ 2 บรรทัด + เผื่อที่ 2 บรรทัดเสมอ (min-h-12 = 2 × leading-6) ให้ราคาอยู่ระดับเดียวกันทุกใบ */}
        <p className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-brown-900" title={product.product_name_th}>
          {product.product_name_th}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-brown-900">{formatCurrency(price, locale)}</span>
          <RatingDisplay rating={product.avg_rating} count={product.review_count} />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-700">
          <span>
            {product.product_stock_quantity != null ? t("products.stock", { n: product.product_stock_quantity }) : "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {t("products.visible")}
            <Switch checked={product.is_visible} disabled={!canUpdate} onChange={onToggleVisible} />
          </span>
        </div>
        <div className="mt-auto flex gap-2">
          {canUpdate && (
            <EditButton block href={`/owner/products/${product._id}/edit`} />
          )}
          {canDelete && (
            <ConfirmDeletePopup onConfirm={onDelete}>
              <DeleteButton block />
            </ConfirmDeletePopup>
          )}
        </div>
      </div>
    </Card>
  );
}
