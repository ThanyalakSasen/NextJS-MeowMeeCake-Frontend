"use client";
// แถวแสดงค่าแบบอ่านอย่างเดียว (โหมดดูของหน้า "ข้อมูลร้าน") — ป้ายซ้าย · ค่าขวา (ตัวเข้ม)
// ไม่มีค่า = "ยังไม่ได้ตั้งค่า" สีส้ม — เห็นทันทีว่าช่องไหนยังว่าง (เดิมใช้ช่องกรอก disabled ที่จางจนแยกไม่ออก)
import { useTranslations } from "next-intl";

export function ReadRow({ label, children, empty }: { label: string; children?: React.ReactNode; empty?: boolean }) {
  const t = useTranslations();
  const isEmpty = empty ?? (children == null || children === "" || children === false);
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="m-0 min-w-0 break-words text-sm font-medium text-gray-800">
        {isEmpty ? <span className="font-normal text-amber-700">{t("storeInfo.notSetShort")}</span> : children}
      </dd>
    </div>
  );
}

/** กลุ่มแถว — เส้นคั่นระหว่างแถว */
export function ReadList({ children }: { children: React.ReactNode }) {
  return <dl className="m-0 flex flex-col divide-y divide-gray-100">{children}</dl>;
}
