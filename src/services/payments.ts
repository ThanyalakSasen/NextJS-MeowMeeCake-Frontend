// src/services/payments.ts — เรียก /admin/payments (paymentModel.ts จริงฝั่ง backend)
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { Payment, PaymentInput } from "@/types/payment";

const BASE = "/admin/payments";

export const paymentsService = {
  listByOrder: (orderId: string) => http.getList<Payment>(BASE, { params: { order_id: orderId } }),
  create: (body: PaymentInput) => http.post<ItemResponse<Payment>>(BASE, body),
  /** approved=true → status "paid" (+ propagate ไป order.payment_status) · false → "failed" */
  verify: (id: string, approved: boolean) =>
    http.post<ItemResponse<Payment>>(`${BASE}/${id}/verify`, { approved }),
};
