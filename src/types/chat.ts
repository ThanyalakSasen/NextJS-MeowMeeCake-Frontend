// ─────────────────────────────────────────────────────────────
// src/types/chat.ts — แชทลูกค้า ↔ ร้าน (backend services/chatService.ts · collection chatconversations / chatmessages)
// ─────────────────────────────────────────────────────────────
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

export type ChatSenderType = "customer" | "staff";
export type ChatAttachmentKind = "order" | "preorder";

/** คำสั่งซื้อที่ลูกค้าแนบในแชท — ภาพ ณ ตอนส่ง (สถานะล่าสุดดูที่หน้าคำสั่งซื้อ) */
export interface ChatAttachment {
  kind: ChatAttachmentKind;
  ref_id: string;
  doc_no: string;
  order_status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  order_type: "delivery" | "takeaway" | null;
  total_amount: number;
  item_count: number;
  first_item_name: string;
  ordered_at: string | null;
}

/** คำสั่งซื้อที่เลือกจะแนบ (ก่อนส่ง / ตอนเปลี่ยนในข้อความที่แก้) — ข้อมูลพอแสดงชิป */
export interface ChatAttachRef {
  kind: ChatAttachmentKind;
  id: string;
  doc_no: string;
  total_amount: number;
}

export interface ChatMessage {
  _id: string;
  conversation_id: string;
  sender_type: ChatSenderType;
  body: string;
  attachment: ChatAttachment | null;
  read_at: string | null;
  created_at: string;
  /** ถูกลบแล้ว — body ว่าง · attachment null (แสดง "ข้อความนี้ถูกลบแล้ว") */
  deleted: boolean;
  /** แก้ไขล่าสุดเมื่อไร (null = ไม่เคยแก้) */
  edited_at: string | null;
}

export interface ChatCustomer {
  _id: string;
  user_fullname: string;
  user_phone: string | null;
  email: string;
  user_img: string | null;
}

export interface ChatConversation {
  _id: string;
  customer_id: string;
  /** มีเฉพาะฝั่งร้าน */
  customer: ChatCustomer | null;
  last_message_at: string | null;
  last_message_preview: string;
  last_sender_type: ChatSenderType | null;
  customer_unread: number;
  staff_unread: number;
  created_at: string;
}

/** GET ห้อง + ข้อความ (เก่า → ใหม่) */
export interface ChatThread {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  has_more: boolean;
}

export interface ChatMessageQuery {
  /** ISO — ข้อความตั้งแต่เวลานี้ (polling) */
  after?: string;
  /** ISO — ข้อความเก่ากว่านี้ (ดูย้อนหลัง) */
  before?: string;
  limit?: number;
}

export interface SendChatInput {
  body?: string;
  order_id?: string;
  preorder_id?: string;
}

/** รวมข้อความใหม่เข้ากับของเดิม — ตัดตัวซ้ำด้วย _id แล้วเรียงตามเวลา (polling ?after= คืนข้อความเวลาเท่ากันซ้ำได้) */
export function mergeChatMessages(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  if (next.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m._id, m]));
  for (const m of next) byId.set(m._id, m);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a._id.localeCompare(b._id));
}
