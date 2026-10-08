"use client";
// ปุ่ม "รีวิวสินค้า" ในประวัติ/รายละเอียดออเดอร์และพรีออเดอร์ (BACKLOG3-merge D7)
// แสดงเฉพาะ completed + ชำระแล้ว · รีวิวครบทุกรายการ = ป้าย "รีวิวแล้ว" แทนปุ่ม
import Link from "next/link";
import type { ReviewKind } from "@/services/shopReviews";
import { canReview, useReviewedItems } from "../../hooks/useReviewedItems";

export default function ReviewLink({
  kind,
  doc,
  itemIds,
  href,
  className,
}: {
  kind: ReviewKind;
  doc: { order_status: string; payment_status: string };
  /** id ของรายการในเอกสาร — undefined ระหว่างโหลดรายละเอียด */
  itemIds: string[] | undefined;
  href: string;
  className: string;
}) {
  const eligible = canReview(doc);
  const { reviewed, loaded } = useReviewedItems(kind, eligible);
  if (!eligible || !loaded || !itemIds?.length) return null;

  const left = itemIds.filter((id) => !reviewed.has(id)).length;
  if (left === 0) return <span className="whitespace-nowrap px-2 text-xs font-semibold text-green-700">✓ รีวิวแล้ว</span>;
  return (
    <Link href={href} className={className}>
      รีวิวสินค้า{itemIds.length > 1 ? ` (${left})` : ""}
    </Link>
  );
}
