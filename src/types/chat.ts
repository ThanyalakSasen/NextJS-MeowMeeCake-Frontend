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

export interface ChatMessage {
  _id: string;
  conversation_id: string;
  sender_type: ChatSenderType;
  body: string;
  attachment: ChatAttachment | null;
  read_at: string | null;
  /** แก้ไขล่าสุดเมื่อไร (null = ไม่เคยแก้) */
  edited_at: string | null;
  /** true = ถูกลบแล้ว (มาจาก polling — เอาออกจากจอ) */
  deleted: boolean;
  created_at: string;
  /** เวลาเปลี่ยนล่าสุด (ส่ง/แก้/ลบ/อ่านแล้ว) — cursor ของ polling ?after= */
  updated_at: string;
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
  /** _id ของข้อความที่ updated_at = after — ใช้คู่กับ after ให้ cursor ขยับได้แม้ข้อความเวลาเดียวกันเกิน limit (เอกสารบั๊กข้อ 17) */
  after_id?: string;
  /** ISO — ข้อความเก่ากว่านี้ (ดูย้อนหลัง) */
  before?: string;
  limit?: number;
}

export interface SendChatInput {
  body?: string;
  order_id?: string;
  preorder_id?: string;
}

/** แก้ข้อความ — ลูกค้าเปลี่ยน/เอาออกคำสั่งซื้อที่แนบได้ · ร้านแก้ได้แค่ body */
export interface EditChatInput extends SendChatInput {
  remove_attachment?: boolean;
}

/** รวมข้อความใหม่เข้ากับของเดิม — ตัดตัวซ้ำด้วย _id (ตัวใหม่แทนตัวเดิม = เห็นที่แก้ไข) · ที่ถูกลบเอาออก · เรียงตามเวลา */
export function mergeChatMessages(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  if (next.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m._id, m]));
  for (const m of next) {
    if (m.deleted) byId.delete(m._id);
    else byId.set(m._id, m);
  }
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a._id.localeCompare(b._id));
}
