"use client";
// ช่อง "สแกน / ค้นหา" ช่องเดียว — ยิงบาร์โค้ด หรือพิมพ์รหัส/ชื่อสินค้า · คำแนะนำโชว์ใต้ช่อง กดเพื่อเพิ่มลงบิล
// Enter = เพิ่มสินค้าที่รหัสตรง/เหลือคำแนะนำตัวเดียว ไม่งั้นถาม backend (ดู usePOSViewModel submitQuery)
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import { refId } from "@/lib/refId";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/promotion";

export function ScanSearchBox({
  value,
  scanning,
  suggestions,
  promosOf,
  onChange,
  onSubmit,
  onPick,
}: {
  value: string;
  scanning: boolean;
  suggestions: Product[];
  promosOf: (productId: string, categoryId: string | null) => Promotion[];
  onChange: (v: string) => void;
  onSubmit: () => void;
  onPick: (p: Product) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const hasQuery = value.trim().length > 0;

  return (
    <div className="relative">
      <label className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-white px-4">
        <span className="whitespace-nowrap text-sm font-semibold text-brown-800">{t("pos.scanLabel")}</span>
        <input
          type="search"
          autoFocus
          value={value}
          disabled={scanning}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={t("pos.scanPlaceholder")}
          className="min-w-0 flex-1 border-none bg-transparent text-lg text-brown-900 outline-none placeholder:text-gray-400"
        />
      </label>

      {hasQuery && (
        <div className="absolute inset-x-0 top-[62px] z-10 flex flex-col gap-0.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
          {suggestions.map((p) => {
            const stock = p.product_stock_quantity ?? 0;
            const out = stock <= 0;
            const promos = promosOf(p._id, refId(p.category_id) || null);
            return (
              <button
                key={p._id}
                type="button"
                disabled={out}
                onClick={() => onPick(p)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-brown-900 hover:bg-brown-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="w-24 shrink-0 truncate font-mono text-xs text-gray-500">{p.product_id ?? "—"}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{p.product_name_th}</span>
                  {promos.length > 0 && (
                    <span className="truncate text-xs font-medium text-pink-700">
                      {t("pos.promoTag", { name: promos.map((x) => x.promotion_name).join(", ") })}
                    </span>
                  )}
                </span>
                <span className="font-semibold">{formatCurrency(p.sale_price ?? p.product_price, locale)}</span>
                <span className="w-16 shrink-0 text-right text-sm font-semibold text-brown-600">
                  {out ? t("pos.outOfStock") : t("pos.addAction")}
                </span>
              </button>
            );
          })}
          {suggestions.length === 0 && <p className="m-0 p-3 text-gray-600">{t("pos.searchNoResult")}</p>}
        </div>
      )}
    </div>
  );
}
