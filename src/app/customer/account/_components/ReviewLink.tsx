"use client";
// สถานะรีวิว / ปุ่ม "รีวิวสินค้า" ในประวัติ/รายละเอียดออเดอร์และพรีออเดอร์ (BACKLOG3-merge D7)
// แสดงเฉพาะ completed + ชำระแล้ว · รีวิวครบทุกรายการ = ป้าย "รีวิวแล้ว" แทนปุ่ม
// ยังรีวิวไม่ได้ / กำลังโหลด = แสดง fallback (เช่น ป้ายสถานะคำสั่งซื้อในหน้าประวัติ) · ไม่ส่ง = ไม่แสดงอะไร
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReviewKind } from "@/services/shopReviews";
import { canReview, useReviewedItems } from "../../hooks/useReviewedItems";

export default function ReviewLink({
  kind,
  doc,
  itemIds,
  href,
  className,
  reviewedClassName = "whitespace-nowrap px-2 text-xs font-semibold text-green-700",
  fallback = null,
}: {
  kind: ReviewKind;
  doc: { order_status: string; payment_status: string };
  /** id ของรายการในเอกสาร — undefined ระหว่างโหลดรายละเอียด */
  itemIds: string[] | undefined;
  href: string;
  className: string;
  /** สไตล์ป้าย "รีวิวแล้ว" */
  reviewedClassName?: string;
  /** แสดงแทนเมื่อยังรีวิวไม่ได้ หรือข้อมูลยังโหลดไม่เสร็จ */
  fallback?: ReactNode;
}) {
  const t = useTranslations("shop.orders");
  const eligible = canReview(doc);
  const { reviewed, loaded } = useReviewedItems(kind, eligible);
  if (!eligible || !loaded || !itemIds?.length) return <>{fallback}</>;

  const left = itemIds.filter((id) => !reviewed.has(id)).length;
  if (left === 0) return <span className={reviewedClassName}>{t("reviewed")}</span>;
  return (
    <Link href={href} className={className}>
      {itemIds.length > 1 ? t("reviewCount", { n: left }) : t("reviewProducts")}
    </Link>
  );
}
