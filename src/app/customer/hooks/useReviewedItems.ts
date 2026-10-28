"use client";
// ─────────────────────────────────────────────────────────────
// useReviewedItems — id ของรายการ (ออเดอร์/พรีออเดอร์) ที่ฉันรีวิวแล้ว (BACKLOG3-merge D7)
// ใช้ซ่อน/แสดงปุ่ม "รีวิวสินค้า" และกรองรายการในหน้าเขียนรีวิว · cache เดียวทั้งแอป (shopReviewsKey)
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { shopReviewsService, type ReviewKind } from "@/services/shopReviews";
import { shopReviewsKey } from "../lib/shopQueries";

/** รีวิวได้เมื่อ completed + ชำระแล้ว (backend reviewService) */
export const canReview = (doc: { order_status: string; payment_status: string }) =>
  doc.order_status === "completed" && doc.payment_status === "paid";

/**
 * เหตุที่ยังรีวิวไม่ได้ (null = รีวิวได้) — ลำดับ/เงื่อนไขเดียวกับ backend reviewService.reviewBlockReason
 * ข้อความอยู่ที่ shop.orders.reviewBlocked.* (ตรงกับข้อความ error ของ backend)
 */
export type ReviewBlockReason = "cancelled" | "unpaid" | "notCompleted";
export function reviewBlockReason(doc: { order_status: string; payment_status: string }): ReviewBlockReason | null {
  if (doc.order_status === "cancelled") return "cancelled";
  if (doc.payment_status !== "paid") return "unpaid";
  if (doc.order_status !== "completed") return "notCompleted";
  return null;
}

export function useReviewedItems(kind: ReviewKind, enabled = true) {
  const q = useQuery({ queryKey: shopReviewsKey, queryFn: shopReviewsService.mine, enabled, staleTime: 60_000 });
  const reviewed = new Set(
    (q.data ?? []).flatMap((r) => {
      const id = kind === "preorder" ? r.preorder_order_item_id : r.order_item_id;
      return id ? [id] : [];
    }),
  );
  return { reviewed, loaded: q.isSuccess, isError: q.isError };
}
