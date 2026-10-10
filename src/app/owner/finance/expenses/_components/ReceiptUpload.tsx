"use client";
// อัปโหลดรูปใบเสร็จค่าใช้จ่ายจริง (รูปเดียว) — ยิงไฟล์ไปที่ POST /admin/expenses/receipts แล้วเก็บ URL ที่ได้
// แทน UploadImageBox เดิมที่เก็บ base64 ไว้ใน receipt_url → backend ตอบ 400 ทุกครั้ง (แนบใบเสร็จไม่ได้เลย)
// แพทเทิร์นเดียวกับ BannerImageUpload · value/onChange มาจาก <FormItem> ของ antd
import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useTranslations } from "next-intl";
import { expensesService } from "@/services/expenses";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { actionIcon } from "@/components/shared/actions";

/** ตรงกับเพดานของ backend (src/lib/upload.ts) — กันไว้ก่อนส่งจะได้ไม่ต้องรอ 400 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function ReceiptUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (url: string | undefined) => void;
}) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = value
    ? [{ uid: value, name: "receipt", status: "done", url: resolveUploadUrl(value) }]
    : [];

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const file = options.file as File;
    if (file.size > MAX_BYTES) {
      alert.error(t("finance.receiptTooLarge"));
      options.onError?.(new Error("file too large"));
      return;
    }
    setUploading(true);
    try {
      const url = await expensesService.uploadReceipt(file);
      onChange?.(url);
      options.onSuccess?.({ url });
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("finance.receiptUploadFailed"));
      options.onError?.(e as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      accept={ACCEPT}
      maxCount={1}
      fileList={fileList}
      customRequest={customRequest}
      onRemove={() => onChange?.(undefined)}
    >
      {value ? null : (
        <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
          {actionIcon("add", undefined, "h-5 w-5")}
          {uploading ? t("common.loading") : t("common.add")}
        </span>
      )}
    </Upload>
  );
}
