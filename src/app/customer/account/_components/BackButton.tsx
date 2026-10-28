"use client";
// ปุ่ม "กลับไปหน้าก่อนหน้า" (ไม่มีลูกศร — ทุกปุ่มกลับฝั่งลูกค้าใช้ข้อความเดียวกัน 2026-10-27) — ย้อนไปหน้าก่อนหน้า · เปิดจากลิงก์ตรง (ไม่มีหน้าก่อนหน้า) = ไป fallback แทน
// ใช้ในแถบปุ่มท้ายหน้ารายละเอียดคำสั่งซื้อ/พรีออเดอร์ เมื่อไม่มีปุ่มยกเลิก
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton({ fallback, className }: { fallback: string; className: string }) {
  const t = useTranslations("shop.orders");
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>
      {t("back")}
    </button>
  );
}
