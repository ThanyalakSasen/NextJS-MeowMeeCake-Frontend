"use client";
// ปุ่ม "กลับ" — ย้อนไปหน้าก่อนหน้า · เปิดจากลิงก์ตรง (ไม่มีหน้าก่อนหน้า) = ไป fallback แทน
// ใช้ในแถบปุ่มท้ายหน้ารายละเอียดคำสั่งซื้อ/พรีออเดอร์ เมื่อไม่มีปุ่มยกเลิก
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallback, className }: { fallback: string; className: string }) {
  const t = useTranslations("shop.orders");
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>
      <ArrowLeft size={16} aria-hidden="true" />
      {t("back")}
    </button>
  );
}
