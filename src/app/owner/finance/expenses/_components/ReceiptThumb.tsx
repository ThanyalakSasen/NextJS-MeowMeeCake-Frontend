"use client";
// รูปย่อใบเสร็จในตารางค่าใช้จ่าย — กดแล้วเปิดรูปเต็มในแท็บใหม่
// ใบเสร็จเป็นไฟล์ส่วนตัว ("/api/files/receipts/<ไฟล์>" — backend ตรวจสิทธิ์ reports.view ทุกครั้ง) <img> แนบ cookie
// session ไปเอง (แบบเดียวกับ SlipImage) · โหลดไม่ได้ (401/403/ไฟล์หาย/ข้อมูลรุ่นเก่า) → ป้ายข้อความแทนรูปแตก
import { useState } from "react";
import { useTranslations } from "next-intl";
import { resolveUploadUrl } from "@/lib/uploads";

export function ReceiptThumb({ url }: { url: string }) {
  const t = useTranslations("finance");
  // จำ url ที่โหลดไม่ได้ (แทน boolean) — แถวอื่น/ค่าใหม่ได้ลองโหลดเองโดยไม่ต้อง reset state
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = resolveUploadUrl(url);

  if (failedUrl === url || !src) {
    return <span className="text-xs text-gray-500">{t("receiptLoadFailed")}</span>;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={t("fieldReceipt")} className="h-8 w-8 rounded object-cover" onError={() => setFailedUrl(url)} />
    </a>
  );
}
