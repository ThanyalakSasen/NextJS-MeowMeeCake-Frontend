"use client";
// ─────────────────────────────────────────────────────────────
// ImageUpload — กล่องอัปโหลดรูปจริง (ยิงไฟล์ไป backend แล้วเก็บ URL ที่ได้กลับมา)
//
// เดิมมี 3 ตัวที่เขียนโครงเดียวกันคนละไฟล์ รวม 196 บรรทัด (CONSISTENCY_AUDIT ข้อ 3.14 A2):
//   ProductImageUpload (หลายรูป) · BannerImageUpload (รูปเดียว) · ReceiptUpload (รูปเดียว + จำกัดขนาด)
// ต่างกันจริงแค่ 4 อย่าง — ฟังก์ชันอัปโหลด · จำนวนรูปสูงสุด · ขนาดไฟล์สูงสุด · ชนิดไฟล์ที่รับ
// จึงทำเป็น prop หมด แล้วให้ 3 ตัวนั้นเหลือแค่ตัวห่อบาง ๆ ที่ผูกกับ service ของโดเมนตัวเอง
//
// ⚠️ อย่าใช้เก็บ base64 — backend รับเฉพาะ URL จริง (ของเดิมที่เก็บ base64 ทำให้แนบใบเสร็จไม่ได้
// มาตลอดโดยไม่มีใครรู้ · ดู CONSISTENCY_AUDIT ข้อ 3.1)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useTranslations } from "next-intl";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { actionIcon } from "@/components/shared/actions";

export interface ImageUploadProps {
  /** URL ที่อัปโหลดแล้ว (ดิบอย่างที่เก็บใน DB — ไม่ใช่ที่ resolve แล้ว) */
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  /** ยิงไฟล์ขึ้น backend แล้วคืน URL — ต่างกันตามโดเมน (สินค้า / แบนเนอร์ / ใบเสร็จ) */
  upload: (file: File) => Promise<string>;
  /** คีย์ i18n ที่ใช้เมื่ออัปโหลดไม่สำเร็จและ backend ไม่ได้บอกเหตุผล */
  errorKey: string;
  max?: number;
  /** กันไว้ก่อนส่ง จะได้ไม่ต้องรอ backend ตอบ 400 */
  maxBytes?: number;
  tooLargeKey?: string;
  accept?: string;
  name?: string;
}

export function ImageUpload({
  urls,
  onUrlsChange,
  upload,
  errorKey,
  max = 1,
  maxBytes,
  tooLargeKey,
  accept = "image/*",
  name = "image",
}: ImageUploadProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = urls.map((url, i) => ({
    uid: url, // ต้องเป็น url ดิบ (ตรงกับที่เก็บใน value/DB) — onRemove เทียบกับตัวนี้
    name: max > 1 ? `${name}-${i}` : name,
    status: "done",
    url: resolveUploadUrl(url), // ใช้แค่โชว์ thumbnail — path ดิบ resolve ผิด origin ได้ 404
  }));

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const file = options.file as File;
    if (maxBytes && file.size > maxBytes) {
      alert.error(t(tooLargeKey as Parameters<typeof t>[0]));
      options.onError?.(new Error("file too large"));
      return;
    }
    setUploading(true);
    try {
      const url = await upload(file);
      onUrlsChange([...urls, url]);
      options.onSuccess?.({ url });
    } catch (e) {
      // แสดงเหตุผลจาก backend เสมอถ้ามี (ALERTS.md §2) — เดิมมีแค่ ReceiptUpload ที่ทำ
      alert.error(isApiError(e) ? e.message : t(errorKey as Parameters<typeof t>[0]));
      options.onError?.(e as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      accept={accept}
      multiple={max > 1}
      maxCount={max}
      fileList={fileList}
      customRequest={customRequest}
      onRemove={(file) => onUrlsChange(urls.filter((url) => url !== file.uid))}
    >
      {urls.length >= max ? null : (
        <span className="flex flex-col items-center gap-1 text-xs text-gray-500">
          {actionIcon("add", undefined, "h-5 w-5")}
          {uploading ? t("common.loading") : t("common.add")}
        </span>
      )}
    </Upload>
  );
}

/** ตัวห่อสำหรับรูปเดียว — <FormItem> ของ antd ส่ง value/onChange เป็น string ไม่ใช่ array */
export function SingleImageUpload({
  value,
  onChange,
  ...rest
}: { value?: string; onChange?: (url: string | undefined) => void } & Omit<
  ImageUploadProps,
  "urls" | "onUrlsChange"
>) {
  return (
    <ImageUpload
      {...rest}
      max={1}
      urls={value ? [value] : []}
      onUrlsChange={(urls) => onChange?.(urls[0])}
    />
  );
}
