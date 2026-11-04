// ─────────────────────────────────────────────────────────────
// src/types/preorder.ts — DTO ของ /admin/preorders* (preorderModel/preorderItemModel จริงฝั่ง backend)
//
// state machine ของ order_status (pending→confirmed→preparing→ready→completed, cancelled ได้ทุกจุดที่
// ยังไม่ completed) และ payment_status เหมือน Order ทุกประการ — reuse OrderStatus/PaymentStatus จาก
// enumConfig ตรง ๆ ไม่สร้างซ้ำ (ดู services/preorderService.ts NEXT_STATUS ฝั่ง backend)
//
// backend populate user_id/round_id เป็น object เต็มเสมอ (ทั้ง list และ get) — denormalize เป็น
// customer_name/customer_phone/round_name ที่ services/preorders.ts จุดเดียว (แพทเทิร์นเดียวกับ
// services/orders.ts toOrder())
//
// ไม่มี create — แอดมินไม่สร้างพรีออเดอร์แทนลูกค้า · แก้ผู้รับ/ที่อยู่ และเปลี่ยนรายการสินค้าได้ (EditPreorderItemsInput)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { OrderStatus, PaymentStatus, RoundStatus } from "@/constants/enumConfig";
import type { OrderStatusFilter } from "./order";
import type { OrderType, DeliveryAddress, DeliveryInfo, RefundAccount } from "@/types/order";

/** PUT /admin/preorders/:id/items — รายการเดิมที่ไม่อยู่ใน keep = เอาออก */
export interface EditPreorderItemsInput {
  keep: { item_id: string; quantity: number }[];
  add: {
    round_item_id: string;
    quantity: number;
    variant_ids?: string[];
    selected_options?: { option_id: string; text_value: string | null }[];
  }[];
  /** ชำระแล้วแต่ยอดใหม่เกิน — ร้านยืนยันแล้วให้ลูกค้าชำระเพิ่ม (ไม่ส่ง = backend ตอบ 422) */
  allow_extra_payment?: boolean;
}

interface PreorderAmounts {
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
}

/** POST /admin/preorders/:id/items/preview — ยอดจริงจาก backend ก่อนกดยืนยันเปลี่ยนสินค้า (ยังไม่บันทึก) */
export interface PreorderEditPreview {
  before: PreorderAmounts;
  after: PreorderAmounts;
  paid: boolean;
  /** ยอดที่ลูกค้าโอนมาแล้ว · ยังไม่ชำระ = 0 */
  paid_amount: number;
  /** none = ยอดเท่าเดิม · refund = ร้านโอนคืน · extra = ลูกค้าชำระเพิ่ม · unpaid = ยังไม่ชำระ (QR ยอดใหม่) */
  outcome: "none" | "refund" | "extra" | "unpaid";
  refund: number;
  extra: number;
  refund_due_after: number;
  extra_due_after: number;
  lines: {
    name: string;
    extras: string[];
    unit_price: number;
    old_qty: number;
    new_qty: number;
    status: "kept" | "changed" | "removed" | "added";
  }[];
  /** โควตาในรอบไม่พอ — บันทึกไม่ได้ */
  quota_errors: string[];
  /** สินค้าที่เพิ่มต่ำกว่าขั้นต่ำต่อรายการ — เตือนเท่านั้น ร้านบันทึกได้ */
  below_min: Array<{ name: string; min_qty: number; quantity: number }>;
  /** ข้อความที่ลูกค้าจะได้รับ (LINE / กระดิ่ง) */
  customer_message: string;
}

export interface PreorderItem {
  _id: string;
  preorder_id: string;
  round_item_id: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  selected_variants: { group_name: string; variant_name: string }[];
  selected_options: { option_name: string; text_value: string | null }[];
  pickup_date: string;
  special_request?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Preorder extends DeliveryInfo {
  _id: string;
  preorder_no: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  round_id: string;
  round_name: string;
  round_pickup_date?: string;
  round_status?: RoundStatus;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_address?: DeliveryAddress | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  cancelled_reason?: string | null;
  /** กำหนดชำระ = min(สั่ง + 24 ชม., ปิดรอบ) — เลยแล้วยังไม่จ่าย (และไม่มีสลิปรอตรวจ) backend ยกเลิกอัตโนมัติ
   *  · null = ข้อมูลก่อนมีฟิลด์นี้ (backend #55 — docs/preorder-round-flow.md ประเด็น 3) */
  payment_due_at?: string | null;
  /** ยอดรอโอนคืนจากการที่ร้านยกเลิกบางสินค้าในใบนี้ — ใบยังเดินต่อ · total_amount หักแล้ว */
  refund_due_amount: number;
  /** สินค้าที่ถูกยกเลิก เช่น "ขนมปัง × 2" */
  refund_due_note: string | null;
  /** ยอดที่ลูกค้าต้องชำระเพิ่ม — ร้านเปลี่ยนสินค้าในใบที่ชำระแล้วจนยอดเกิน · total_amount รวมแล้ว · payment_status คง "paid" */
  extra_due_amount: number;
  /** มีทั้ง list และ get(id) — backend แนบรายการสินค้าของแต่ละใบมาให้ */
  items?: PreorderItem[];
  /** มีค่าเฉพาะ preordersService.get(id) ของพรีออเดอร์ที่รอโอนคืน + ลูกค้าตั้งบัญชีไว้ (Q-BE12) */
  refund_account: RefundAccount | null;
  created_at: string;
  updated_at: string;
}

export interface PreorderListParams extends ListParams {
  user_id?: string;
  round_id?: string;
  /** หลายสถานะคั่นด้วย , ได้ — ใช้ statusFilter() */
  order_status?: OrderStatusFilter;
  payment_status?: PaymentStatus;
  order_type?: OrderType;
  date_from?: string;
  date_to?: string;
}
