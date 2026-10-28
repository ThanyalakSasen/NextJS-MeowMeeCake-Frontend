// ─────────────────────────────────────────────────────────────
// src/services/shopCheckout.ts — สั่งซื้อรวม + ชำระรวม (ตะกร้ารวม 2026-10-27)
//   POST /shop/checkout                       { order?, preorders[] } → หลายบิล (1 ปกติ + 1 ต่อรอบ) + group_id (เมื่อ > 1 บิล)
//   GET  /shop/payment-groups/{id}            ทุกบิล + ยอดรวม + QR ยอดรวม (ชำระรวมได้เมื่อทุกบิลยังรอชำระ)
//   POST /shop/payment-groups/{id}/slip       สลิปเดียวสำหรับทุกบิล (multipart "file")
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import type { CreateShopOrderInput } from "./shopOrders";
import type { CreatePreorderInput } from "./shopPreorders";

export interface CheckoutBill {
  kind: "order" | "preorder";
  _id: string;
  doc_no: string;
  total_amount: number;
}

export interface CheckoutResult {
  group_id: string | null;
  bills: CheckoutBill[];
}

export interface GroupBill {
  kind: "order" | "preorder";
  id: string;
  doc_no: string;
  amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  can_pay: boolean;
  blocked_reason: string | null;
  payment_record_status: string | null;
  slip_url: string | null;
  payment_due_at: string | null;
}

export interface PaymentGroupPage {
  _id: string;
  bills: GroupBill[];
  total_amount: number;
  /** awaiting_payment = ชำระรวมได้ · awaiting_review = ส่งสลิปรวมแล้ว · paid = ครบ · split = ต้องชำระแยกรายบิล */
  status: "awaiting_payment" | "awaiting_review" | "paid" | "split";
  can_pay_together: boolean;
  qr_image: string | null;
  account_name: string;
  qr_error: string | null;
  payment_due_at: string | null;
  server_time: string;
}

export const billHref = (b: { kind: "order" | "preorder"; id?: string; _id?: string }) =>
  b.kind === "order" ? `/customer/account/purchases/${b.id ?? b._id}` : `/customer/account/preorders/${b.id ?? b._id}`;

export const paymentGroupHref = (id: string) => `/customer/account/payment-group/${id}`;

export const shopCheckoutService = {
  checkout: async (body: { order?: CreateShopOrderInput | null; preorders: CreatePreorderInput[] }): Promise<CheckoutResult> =>
    (await http.post<ItemResponse<CheckoutResult>>("/shop/checkout", {
      ...(body.order ? { order: { source: "cart", ...body.order } } : {}),
      preorders: body.preorders,
    })).data,

  paymentGroup: async (id: string): Promise<PaymentGroupPage> =>
    (await http.get<ItemResponse<PaymentGroupPage>>(`/shop/payment-groups/${encodeURIComponent(id)}`)).data,

  uploadGroupSlip: async (id: string, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await http.post(`/shop/payment-groups/${encodeURIComponent(id)}/slip`, form, { timeout: 60_000 });
  },
};
