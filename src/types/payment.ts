// ─────────────────────────────────────────────────────────────
// src/types/payment.ts — DTO ของ resource /admin/payments (paymentModel.ts จริงฝั่ง backend)
// การชำระเงินแยกจาก order เป็นคนละ record เสมอ (1 order ผูก payment ที่ยัง pending ได้ใบเดียว)
// ─────────────────────────────────────────────────────────────
export type PaymentRecordStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  _id: string;
  order_id?: string | null;
  preorder_id?: string | null;
  user_id: string;
  amount: number;
  status: PaymentRecordStatus;
  promptpay_ref?: string | null;
  slip_image_url?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInput {
  user_id: string;
  order_id?: string;
  preorder_id?: string;
  amount: number;
  promptpay_ref?: string;
  slip_image_url?: string;
}
