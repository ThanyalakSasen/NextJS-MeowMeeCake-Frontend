"use client";
// คำเตือนแพ้อาหารในหน้ารายละเอียดสินค้า (TC-ADM-87 / TC-CUS-49) — ข้อมูลชุดเดียวกับป้ายบนบัตรสินค้า
// (useAllergenWarnings → /shop/allergen-warnings · ล็อกอิน + บันทึกอาหารที่แพ้ไว้) · ไม่มีคำเตือน/guest = ไม่แสดง
import { useTranslations } from "next-intl";
import { FaExclamationTriangle } from "react-icons/fa";
import type { AllergenWarningLevel } from "@/services/catalog";
import { useAllergenWarnings } from "../../../hooks/useAllergenWarnings";

const TONE: Record<Exclude<AllergenWarningLevel, "none">, string> = {
  caution: "bg-amber-50 text-amber-900 border-amber-300",
  warning: "bg-orange-50 text-orange-900 border-orange-300",
  danger: "bg-red-50 text-red-800 border-red-300",
};

export default function AllergenNotice({ productId }: { productId: string }) {
  const t = useTranslations("shop.product");
  const warning = useAllergenWarnings()(productId);
  if (!warning || warning.level === "none") return null;

  // ข้อความจาก backend บอกระดับความเสี่ยงอยู่แล้ว ("…ที่คุณอาจแพ้…") — ใช้ก่อน ไม่มีค่อยประกอบเองจากชื่อวัตถุดิบ
  const names = warning.matchedAllergens.map((m) => m.name);
  const message =
    warning.message ?? (names.length > 0 ? t("allergenNotice", { names: names.join(", ") }) : t("allergenNoticeGeneric"));
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border p-4 ${TONE[warning.level]}`}>
      <FaExclamationTriangle className="mt-0.5 shrink-0 text-base" aria-hidden />
      <p className="m-0 min-w-0 text-sm font-bold">{message}</p>
    </div>
  );
}
