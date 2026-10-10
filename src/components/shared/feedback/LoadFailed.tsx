"use client";
// ─────────────────────────────────────────────────────────────
// LoadFailed — สถานะ "โหลดข้อมูลไม่สำเร็จ + ปุ่มลองใหม่"
//
// เดิมเขียนบล็อกเดียวกันซ้ำ 31 ไฟล์ และเพี้ยนไปแล้วจริง (CONSISTENCY_AUDIT ข้อ 3.14 A1):
//   28 จุดใช้ text-gray-600 · 1 จุด text-gray-500 · ปุ่มเขียน 2 แบบ (() => vm.refetch() กับ vm.refetch)
//   และ 1 หน้าลืมใส่ปุ่มลองใหม่ไปเลย (reports/sales)
//
//   {vm.isError ? <LoadFailed onRetry={vm.refetch} /> : ...}
//
// ตั้งใจแทนที่เฉพาะ "บล็อก" ไม่ใช่ครอบ control flow ทั้งก้อน — เพราะ ternary ของ 31 หน้า
// มีรูปร่างต่างกันมาก (บางหน้าซ้อน isLoading บางหน้าไม่มี) การรื้อ control flow เสี่ยงเกินผลที่ได้
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { RetryButton } from "@/components/shared/actions";

export function LoadFailed({
  onRetry,
  className = "flex flex-col items-center gap-3 py-10 text-center",
  size,
}: {
  onRetry: () => void;
  /** ใช้เมื่ออยู่ในพื้นที่แคบ เช่นใน drawer หรือการ์ด — ไม่ส่ง = ระยะมาตรฐานของหน้าเต็ม */
  className?: string;
  size?: "small";
}) {
  const t = useTranslations();
  return (
    <div className={className}>
      <p className="text-gray-600">{t("common.loadFailed")}</p>
      <RetryButton size={size} onClick={onRetry} />
    </div>
  );
}
