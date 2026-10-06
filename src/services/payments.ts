// src/services/payments.ts — เรียก /admin/payments (paymentModel.ts จริงฝั่ง backend)
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { Payment, PaymentInput } from "@/types/payment";

const BASE = "/admin/payments";

export const paymentsService = {
  /** เรียงใหม่สุดก่อน (backend sort created_at: -1) — [0] = รายการล่าสุด */
  listByOrder: (orderId: string) => http.getList<Payment>(BASE, { params: { order_id: orderId } }),
  listByPreorder: (preorderId: string) => http.getList<Payment>(BASE, { params: { preorder_id: preorderId } }),
  create: (body: PaymentInput) => http.post<ItemResponse<Payment>>(BASE, body),
  /** approved=true → status "paid" (+ propagate ไป order.payment_status) · false → "failed" */
  verify: (id: string, approved: boolean) =>
    http.post<ItemResponse<Payment>>(`${BASE}/${id}/verify`, { approved }),
  /**
   * POST /admin/payments/{id}/refund — ร้านโอนคืนแล้ว: paid → refunded (+ propagate ไป order/preorder) · สิทธิ์ payments.approve
   * ใช้กับออเดอร์ "ยกเลิก + ชำระแล้ว" (isAwaitingRefund) — ลูกค้ายกเลิกเองแล้ว backend ไม่คืนอัตโนมัติ (§8.8)
   */
  refund: (id: string) => http.post<ItemResponse<Payment>>(`${BASE}/${id}/refund`),
};
