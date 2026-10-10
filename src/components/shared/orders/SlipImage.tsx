"use client";
// รูปสลิปโอนเงิน — ใช้ร่วม Manage Orders / Pre-order Round
//
// backend เก็บ slip_image_url เป็น path relative ("/api/files/slips/<ไฟล์>" หลัง backend #54 · เดิม
// "/uploads/slips/…") → ต้องผ่าน resolveUploadUrl() ให้ชี้ไป origin ของ backend ไม่งั้นได้ 404 จาก frontend
// สลิปเป็นไฟล์ส่วนตัว (ตรวจสิทธิ์ทุกครั้ง: owner / payments.view) — cookie session เป็น SameSite=Lax และ
// frontend/backend เป็น same-site (dev: localhost คนละ port · prod: app./api. โดเมนเดียวกัน) <img> จึงแนบ
// cookie ไปเองได้ ไม่ต้องโหลดผ่าน axios · ถ้ายังโหลดไม่ได้ (401/403/ไฟล์หาย) โชว์ข้อความแทนรูปแตก
import { useState } from "react";
import { Image } from "antd";
import { useTranslations } from "next-intl";
import { resolveUploadUrl } from "@/lib/uploads";

export function SlipImage({ url, size = 72 }: { url: string; size?: number }) {
  const t = useTranslations();
  // จำว่า url ไหนโหลดไม่ได้ (แทน boolean) — เปลี่ยนรายการแล้ว url ใหม่ได้ลองโหลดเองโดยไม่ต้อง reset state ใน effect
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (failedUrl === url) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1 text-center text-xs text-gray-500"
        style={{ width: size, height: size }}
      >
        {t("orders.slipLoadFailed")}
      </div>
    );
  }

  return (
    <Image
      src={resolveUploadUrl(url)}
      alt={t("orders.paymentProof")}
      width={size}
      height={size}
      className="rounded-lg border border-gray-200 !object-cover"
      onError={() => setFailedUrl(url)}
    />
  );
}
