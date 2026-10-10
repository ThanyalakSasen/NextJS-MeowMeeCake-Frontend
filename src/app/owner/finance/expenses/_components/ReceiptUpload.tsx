"use client";
// อัปโหลดรูปใบเสร็จค่าใช้จ่าย (รูปเดียว) — ผูก ImageUpload กลางเข้ากับ POST /admin/expenses/receipts
// value/onChange มาจาก <FormItem> ของ antd
import { expensesService } from "@/services/expenses";
import { SingleImageUpload } from "@/components/shared/form";

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
  return (
    <SingleImageUpload
      value={value}
      onChange={onChange}
      upload={(file) => expensesService.uploadReceipt(file)}
      errorKey="finance.receiptUploadFailed"
      maxBytes={MAX_BYTES}
      tooLargeKey="finance.receiptTooLarge"
      accept={ACCEPT}
      name="receipt"
    />
  );
}
