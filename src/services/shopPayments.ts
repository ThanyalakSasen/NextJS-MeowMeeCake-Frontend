// ─────────────────────────────────────────────────────────────
// src/services/shopPayments.ts — การชำระเงินของลูกค้าที่ login (/shop/payments* + /shop/orders/{id}/payment) · หน้าร้าน
// ลำดับ: เปิดหน้าชำระเงิน (QR พร้อมเพย์ + กำหนดชำระจาก backend) → สร้างรายการชำระเงิน (ยอดต้องเท่ายอดออเดอร์)
//   → อัปโหลดสลิป → รอแอดมินตรวจ
// 1 ออเดอร์มีรายการ pending ได้ใบเดียว (ซ้ำ = 409) · สลิปที่ถูกปฏิเสธ (failed) แนบใหม่กับใบเดิมได้ → กลับเป็น pending
// ออเดอร์เว็บต้องจ่ายภายใน 30 นาที (payment_due_at) · เลยแล้ว backend ยกเลิกให้ · แนบสลิปกับใบเดิมหลังหมดเวลา = เปิดออเดอร์กลับ
// (backend docs/customer-backend-merge.md §8.8)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

export interface ShopPayment {
  _id: string;
  order_id: string | null;
  preorder_id: string | null;
  amount: number;
  status: PaymentStatus;
  slip_image_url: string | null;
  created_at: string;
}

/** ออเดอร์ปกติ หรือ พรีออเดอร์ — หน้าชำระเงิน/สลิปใช้ร่วมกัน (backend paymentService.getPaymentPage(kind)) */
export type PaymentKind = "order" | "preorder";

/** GET /shop/{orders|preorders}/{id}/payment — paymentService.getPaymentPage() ฝั่ง backend */
export interface ShopPaymentPage {
  id: string;
  /** order_no หรือ preorder_no */
  order_no: string;
  /** ยอดที่ต้องโอน (บาท) */
  amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  /** false = จ่ายไม่ได้แล้ว (ชำระแล้ว · ยกเลิก · เสร็จสิ้น) — เหตุผลอยู่ใน blocked_reason */
  can_pay: boolean;
  blocked_reason: string | null;
  /** หมดเวลาชำระ (ถูกยกเลิกอัตโนมัติ) แต่ยังแนบสลิปเพื่อเปิดออเดอร์กลับได้ — ไม่ออก QR ใหม่ */
  late_upload: boolean;
  /** QR พร้อมเพย์ระบุยอดเป็น data URL · null = ร้านยังไม่ตั้งเลขพร้อมเพย์ / จ่ายไม่ได้แล้ว */
  qr_image: string | null;
  account_name: string;
  qr_error: string | null;
  /** รายการชำระเงินล่าสุดของออเดอร์ (ถ้ามี) */
  payment_id: string | null;
  payment_record_status: PaymentStatus | null;
  slip_url: string | null;
  /** หมดเขตชำระ · null = ออเดอร์ไม่มีกำหนด (สร้างก่อนมีกติกา 30 นาที) */
  payment_due_at: string | null;
  /** เวลา server ตอนตอบ — ใช้ชดเชยนาฬิกาเครื่องลูกค้าตอนนับถอยหลัง */
  server_time: string;
}

export const shopPaymentsService = {
  /** GET /shop/orders/{id}/payment — ข้อมูลหน้าชำระเงิน (backend ยกเลิกออเดอร์ที่เลยกำหนดให้ก่อนตอบ) */
  orderPaymentPage: async (orderId: string): Promise<ShopPaymentPage> => {
    const res = await http.get<ItemResponse<ShopPaymentPage>>(`/shop/orders/${orderId}/payment`);
    return res.data;
  },

  /** GET /shop/preorders/{id}/payment — แบบเดียวกับออเดอร์ แต่กำหนดชำระ = 24 ชม. (ไม่เกินปิดรอบ) · ไม่มี late_upload */
  preorderPaymentPage: async (preorderId: string): Promise<ShopPaymentPage> => {
    const res = await http.get<ItemResponse<ShopPaymentPage>>(`/shop/preorders/${preorderId}/payment`);
    return res.data;
  },

  paymentPage: (kind: PaymentKind, id: string) =>
    kind === "order" ? shopPaymentsService.orderPaymentPage(id) : shopPaymentsService.preorderPaymentPage(id),

  /** POST /shop/payments { order_id, amount } — ออเดอร์ที่หมดเวลาแล้วสร้างแบบไม่มีสลิปไม่ได้ (400) */
  createForOrder: async (orderId: string, amount: number): Promise<ShopPayment> => {
    const res = await http.post<ItemResponse<ShopPayment>>("/shop/payments", { order_id: orderId, amount });
    return res.data;
  },

  /** POST /shop/payments { preorder_id, amount } — ยอดต้องเท่ายอดพรีออเดอร์ */
  createForPreorder: async (preorderId: string, amount: number): Promise<ShopPayment> => {
    const res = await http.post<ItemResponse<ShopPayment>>("/shop/payments", { preorder_id: preorderId, amount });
    return res.data;
  },

  create: (kind: PaymentKind, id: string, amount: number) =>
    kind === "order" ? shopPaymentsService.createForOrder(id, amount) : shopPaymentsService.createForPreorder(id, amount),

  /** POST /shop/payments/{id}/slip (multipart field "file") — JPEG/PNG/WEBP/AVIF ≤ 5 MB */
  uploadSlip: async (paymentId: string, file: File): Promise<ShopPayment> => {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<ItemResponse<ShopPayment>>(`/shop/payments/${paymentId}/slip`, form);
    return res.data;
  },
};
