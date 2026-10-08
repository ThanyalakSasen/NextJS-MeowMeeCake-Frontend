"use client";
// ─────────────────────────────────────────────────────────────
// ใช้แต้มสะสมเป็นส่วนลด — แทน FrontOffice PointsRedeemBox
// max คิดจากหน้า checkout (maxRedeemablePoints ตามฐานเดียวกับ backend) · ค่าที่กรอกถูกปัดลงทีละ REDEEM_STEP
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { pointsToBaht, type MyPoints } from "@/services/shopLoyalty";
import { baht, shopButton, shopInput } from "@/components/customer/shopStyles";

export default function PointsRedeemBox({
  points,
  max,
  value,
  onChange,
}: {
  points: MyPoints;
  /** แต้มสูงสุดที่ใช้กับออเดอร์นี้ได้ */
  max: number;
  value: number;
  onChange: (points: number) => void;
}) {
  const t = useTranslations("shop.points");
  const { balance, rules } = points;
  if (balance <= 0) return null;

  const step = rules.REDEEM_STEP;
  const clamp = (n: number) => {
    const v = Math.min(Math.max(0, Math.floor(n) || 0), max);
    return v - (v % step);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <p className="font-semibold">{t("title")}</p>
        <p className="text-xs text-gray-500">{t("balance", { n: balance.toLocaleString() })}</p>
      </div>

      {balance < rules.MIN_BALANCE_TO_REDEEM ? (
        <p className="text-xs text-gray-500">{t("minBalance", { n: rules.MIN_BALANCE_TO_REDEEM.toLocaleString() })}</p>
      ) : max === 0 ? (
        <p className="text-xs text-gray-500">{t("notUsable")}</p>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className={shopInput}
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              step={step}
              value={value || ""}
              placeholder="0"
              aria-label={t("inputAria")}
              onChange={(e) => onChange(Math.min(Math.max(0, Math.floor(Number(e.target.value)) || 0), max))}
              // ปัดลงให้ลงตัวทีละ step ตอนออกจากช่อง (ระหว่างพิมพ์ยังพิมพ์ 1, 15 ได้)
              onBlur={() => onChange(clamp(value))}
            />
            <button type="button" className={`${shopButton} shrink-0`} onClick={() => onChange(value === max ? 0 : max)}>
              {value === max ? t("none") : t("max")}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {t("rule", { max: max.toLocaleString(), amount: baht(pointsToBaht(max, rules)), step, percent: Math.round(rules.MAX_REDEEM_RATIO * 100) })}
          </p>
        </>
      )}
    </div>
  );
}
