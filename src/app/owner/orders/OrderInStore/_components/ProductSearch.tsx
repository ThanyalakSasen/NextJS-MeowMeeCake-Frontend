"use client";
// ช่องค้นหาสินค้าตามรหัสหรือชื่อ (แทนกริดเมนูเดิม) — พิมพ์แล้วเลือกจาก dropdown เพื่อเพิ่มลงรายการ
// ใช้ onSearch/onSelect (ไม่ใช้ onChange) — ไม่งั้นตอนเลือก antd จะเขียน value ของตัวเลือก (_id) ลงช่องค้นหา
// ช่อง input ข้างในใช้ antd Input ตรง ๆ (ไม่ใช่ base/Input) — AutoComplete ต้องผูก ref/event กับ input ลูกโดยตรง
import { AutoComplete, Input as AntInput } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Tag } from "@/components/base";
import { formatCurrency } from "@/i18n/format";
import { refId } from "@/lib/refId";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/promotion";

export function ProductSearch({
  value,
  results,
  promosOf,
  onChange,
  onPick,
}: {
  value: string;
  results: Product[];
  promosOf: (productId: string, categoryId: string | null) => Promotion[];
  onChange: (v: string) => void;
  onPick: (productId: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const options = results.map((p) => {
    const stock = p.product_stock_quantity ?? 0;
    const promos = promosOf(p._id, refId(p.category_id) || null);
    return {
      value: p._id,
      disabled: stock <= 0,
      label: (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <div className="min-w-0">
            <p className="truncate font-medium text-brown-800">{p.product_name_th}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {p.product_id && <span className="font-mono text-xs text-gray-500">{p.product_id}</span>}
              {promos.length > 0 && (
                <Tag color="magenta" className="!m-0">
                  {t("pos.promoTag", { name: promos.map((x) => x.promotion_name).join(", ") })}
                </Tag>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-700">{formatCurrency(p.sale_price ?? p.product_price, locale)}</p>
            <p className="text-xs text-gray-500">
              {stock <= 0 ? t("pos.outOfStock") : t("pos.stockLeft", { n: stock })}
            </p>
          </div>
        </div>
      ),
    };
  });

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={onChange}
      onSelect={(id: string) => onPick(id)}
      allowClear
      onClear={() => onChange("")}
      notFoundContent={value.trim() ? t("pos.searchNoResult", { q: value.trim() }) : null}
      className="w-full"
      popupMatchSelectWidth
    >
      <AntInput
        size="large"
        placeholder={t("pos.searchPlaceholder")}
        prefix={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
        aria-label={t("pos.searchPlaceholder")}
      />
    </AutoComplete>
  );
}
