"use client";
// การ์ด "โปรโมชันอื่นๆ" ในแผงขวา — โปรที่ยังใช้กับบิลนี้ไม่ได้ พร้อมบอกว่าต้องทำอะไรเพิ่ม ให้พนักงานแนะนำลูกค้าได้
// เช่น ซื้อซาวโดว์อีก 1 ชิ้นลด ฿100 · แค่แสดงข้อมูล กดเลือกไม่ได้ · ใบเดียวรวมทุกโปร + ย่อไว้ แผงจึงไม่ยาวเกิน
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import type { Promotion } from "@/types/promotion";
import { isScoped, type OtherPromo } from "../posPromotion";

/** จำนวนโปรที่แสดงก่อนกดดูเพิ่ม */
const COLLAPSED_COUNT = 3;
/** จำนวนชื่อสินค้าที่แสดงต่อโปร — เกินนี้สรุปเป็น "และอีก n รายการ" */
const MAX_ITEM_NAMES = 2;

export function OtherPromosCard({
  promos,
  valueLabel,
}: {
  promos: OtherPromo[];
  valueLabel: (p: Promotion) => string;
}) {
  const t = useTranslations("pos.otherPromo");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const itemsText = ({ promotion, itemNames }: OtherPromo) => {
    if (itemNames.length === 0) return t(isScoped(promotion) ? "itemsParticipating" : "itemsAny");
    const names = itemNames.slice(0, MAX_ITEM_NAMES).join(", ");
    return itemNames.length > MAX_ITEM_NAMES ? t("itemsMore", { names, n: itemNames.length - MAX_ITEM_NAMES }) : names;
  };

  const needText = (o: OtherPromo) => {
    const { need, promotion: p } = o;
    const items = itemsText(o);
    switch (need.key) {
      case "minQty":
        return t("addQty", { items, n: need.min - need.current });
      case "minAmount":
        return t("addAmount", { items, amount: formatCurrency(need.min - need.current, locale) });
      case "memberOnly":
        return t("member");
      case "noEligibleItems":
        if (p.min_quantity != null) return t("buyQty", { items, n: p.min_quantity });
        if (p.min_order_amount != null) return t("buyAmount", { items, amount: formatCurrency(p.min_order_amount, locale) });
        return t("buyItems", { items });
    }
  };

  const shown = expanded ? promos : promos.slice(0, COLLAPSED_COUNT);
  const hiddenCount = promos.length - COLLAPSED_COUNT;

  return (
    <section aria-label={t("title")} className="flex flex-col gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5">
      <h4 className="m-0 text-sm font-semibold text-brown-800">{t("title")}</h4>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {shown.map((o) => (
          <li key={o.promotion._id} className="flex items-start justify-between gap-2 leading-tight">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-brown-900">{o.promotion.promotion_name}</span>
              <span className="text-xs text-gray-600">{needText(o)}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-success">{valueLabel(o.promotion)}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-h-[36px] cursor-pointer self-start border-none bg-transparent p-0 text-sm font-medium text-brown-800 underline"
        >
          {expanded ? t("showLess") : t("showMore", { n: hiddenCount })}
        </button>
      )}
    </section>
  );
}
