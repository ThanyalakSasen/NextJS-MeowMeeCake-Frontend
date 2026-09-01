"use client";
// กริดสินค้าฝั่งซ้ายของ POS — แตะการ์ดเพื่อเพิ่มลงตะกร้า (disable เมื่อหมดสต็อก)
import { useTranslations, useLocale } from "next-intl";
import { EmptyState } from "@/components/base";
import { formatCurrency, formatNumber } from "@/i18n/format";
import type { Product } from "@/types/product";

export function ProductPickerGrid({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  if (products.length === 0) return <EmptyState description={t("common.noData")} />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const stock = p.product_stock_quantity ?? 0;
        const out = stock <= 0;
        const price = p.sale_price ?? p.product_price;
        return (
          <button
            key={p._id}
            type="button"
            disabled={out}
            onClick={() => onAdd(p)}
            className={`flex flex-col rounded-xl border border-gray-100 bg-white p-3 text-left transition ${
              out ? "cursor-not-allowed opacity-50" : "hover:border-brown-200 hover:shadow-sm"
            }`}
          >
            <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-brown-50 text-2xl" aria-hidden="true">
              🧁
            </div>
            <p className="truncate text-sm font-medium text-brown-800">{p.product_name_th}</p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-700">{formatCurrency(price, locale)}</span>
              {p.sale_price != null && (
                <span className="text-xs text-gray-400 line-through">{formatCurrency(p.product_price, locale)}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {out ? t("pos.outOfStock") : t("pos.stockLeft", { n: formatNumber(stock, locale) })}
            </p>
          </button>
        );
      })}
    </div>
  );
}
