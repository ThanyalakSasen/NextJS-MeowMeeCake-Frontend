// ─────────────────────────────────────────────────────────────
// src/services/chat.ts — แชทร้าน–ลูกค้า (แทนฟอร์ม "ส่งข้อความหาเรา")
//   ลูกค้า (ต้องล็อกอิน):
//     GET  /shop/chat ?after=ISO | ?before=ISO   ห้องของฉัน + ข้อความ (เรียงเก่า→ใหม่ · ครั้งละ 50)
//     POST /shop/chat/messages { text?, ref? }   ส่งข้อความ (≤ 1000 ตัว · 20 ข้อความ/นาที) · ref = การ์ดคำสั่งซื้อของฉัน
//     POST /shop/chat/read                       อ่านข้อความจากร้านแล้ว
//     GET  /shop/chat/unread                     { unread } จุดแดงบนปุ่มแชทลอย
//   หลังร้าน (สิทธิ์ chat · view = ดู · create = ตอบ):
//     GET  /admin/chats ?filter=all|unanswered|unread &q= &page=   รายการห้อง
//     GET  /admin/chats/unread                                     { unread_conversations, unanswered_conversations }
//     GET  /admin/chats/:id                                        ห้อง + ข้อมูลลูกค้า + คำสั่งซื้อล่าสุด
//     GET  /admin/chats/:id/messages ?after= | ?before=            ข้อความ (มีชื่อพนักงานที่ตอบ)
//     POST /admin/chats/:id/messages { text?, ref? }               ตอบลูกค้า (ref = การ์ดคำสั่งซื้อของลูกค้าห้องนี้)
//     GET/POST /admin/chats/quick-replies · PATCH/DELETE /admin/chats/quick-replies/:qid   ข้อความตอบเร็ว (แก้ = chat.update)
//     POST /admin/chats/:id/read                                   อ่านแล้ว
// ไม่มี WebSocket — หน้าเว็บดึงข้อความใหม่ (?after=) เป็นช่วงระหว่างเปิดห้อง
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, ListMeta } from "@/types/api";

export type ChatSender = "customer" | "shop";

export type ChatRefKind = "order" | "preorder";

/** การ์ดที่จะแนบไปกับข้อความ */
export interface ChatRef {
  kind: ChatRefKind;
  id: string;
  /** เลขเอกสาร — ใช้แสดงในช่องพิมพ์ก่อนส่ง */
  no: string;
}

/** การ์ดคำสั่งซื้อในข้อความ — สถานะ/ยอดล่าสุด · missing = เอกสารถูกลบ */
export interface ChatOrderCard {
  kind: ChatRefKind;
  id: string;
  no: string;
  order_status: string | null;
  payment_status: string | null;
  total_amount: number | null;
  created_at: string | null;
  missing: boolean;
}

export interface ChatMessage {
  _id: string;
  sender: ChatSender;
  text: string;
  created_at: string;
  card: ChatOrderCard | null;
  /** หลังร้านเท่านั้น — ชื่อพนักงานที่ตอบ */
  sender_name?: string | null;
}

export interface ChatPage {
  messages: ChatMessage[];
  /** มีข้อความเก่ากว่านี้อีก (โหลดด้วย ?before=) */
  has_more: boolean;
}

export interface MyChat extends ChatPage {
  conversation: { _id: string; unread_customer: number } | null;
}

export type ChatListFilter = "all" | "unanswered" | "unread";

export interface ChatConversationRow {
  _id: string;
  customer: { _id: string; name: string; image: string | null };
  last_message_at: string | null;
  last_message_text: string;
  last_sender: ChatSender | null;
  unread_shop: number;
}

export interface ChatConversationDetail {
  _id: string;
  unread_shop: number;
  last_sender: ChatSender | null;
  customer: { _id: string; name: string; phone: string | null; email: string | null; image: string | null };
  recent_orders: {
    _id: string;
    kind: "order" | "preorder";
    no: string;
    order_status: string;
    payment_status: string;
    total_amount: number;
    created_at: string | null;
  }[];
}

export interface ChatQuickReply {
  _id: string;
  title: string;
  text: string;
  sort_order: number;
}

export const CHAT_TEXT_MAX = 1000;

/** ตัวเลขบนเมนูหลังร้าน (Sidebar) — หน้าแชท invalidate key นี้หลังอ่าน/ตอบ */
export const ADMIN_CHAT_UNREAD_KEY = ["admin", "chats", "unread-summary"] as const;
export const ADMIN_CHAT_QUICK_REPLIES_KEY = ["admin", "chats", "quick-replies"] as const;

const sendBody = (text: string, ref?: ChatRef | null) => ({ text, ...(ref ? { ref: { kind: ref.kind, id: ref.id } } : {}) });

const pageParams = (p: { after?: string | null; before?: string | null }) => ({
  ...(p.after ? { after: p.after } : {}),
  ...(p.before ? { before: p.before } : {}),
});

export const shopChatService = {
  get: async (p: { after?: string | null; before?: string | null } = {}): Promise<MyChat> =>
    (await http.get<ItemResponse<MyChat>>("/shop/chat", { params: pageParams(p) })).data,
  send: async (text: string, ref?: ChatRef | null): Promise<ChatMessage> =>
    (await http.post<ItemResponse<ChatMessage>>("/shop/chat/messages", sendBody(text, ref))).data,
  read: async (): Promise<void> => {
    await http.post("/shop/chat/read", {});
  },
  unread: async (): Promise<number> => (await http.get<ItemResponse<{ unread: number }>>("/shop/chat/unread")).data.unread,
};

export const adminChatService = {
  list: async (params: { filter?: ChatListFilter; q?: string; page?: number; limit?: number } = {}) =>
    (await http.get<ItemResponse<{ items: ChatConversationRow[]; meta: ListMeta }>>("/admin/chats", { params })).data,
  unread: async () =>
    (await http.get<ItemResponse<{ unread_conversations: number; unanswered_conversations: number }>>("/admin/chats/unread")).data,
  get: async (id: string): Promise<ChatConversationDetail> =>
    (await http.get<ItemResponse<ChatConversationDetail>>(`/admin/chats/${id}`)).data,
  messages: async (id: string, p: { after?: string | null; before?: string | null } = {}): Promise<ChatPage> =>
    (await http.get<ItemResponse<ChatPage>>(`/admin/chats/${id}/messages`, { params: pageParams(p) })).data,
  send: async (id: string, text: string, ref?: ChatRef | null): Promise<ChatMessage> =>
    (await http.post<ItemResponse<ChatMessage>>(`/admin/chats/${id}/messages`, sendBody(text, ref))).data,
  read: async (id: string): Promise<void> => {
    await http.post(`/admin/chats/${id}/read`, {});
  },
  quickReplies: async (): Promise<ChatQuickReply[]> =>
    (await http.get<ItemResponse<{ items: ChatQuickReply[] }>>("/admin/chats/quick-replies")).data.items,
  createQuickReply: async (body: { title: string; text: string }): Promise<ChatQuickReply> =>
    (await http.post<ItemResponse<ChatQuickReply>>("/admin/chats/quick-replies", body)).data,
  updateQuickReply: async (qid: string, body: { title?: string; text?: string; sort_order?: number }): Promise<ChatQuickReply> =>
    (await http.patch<ItemResponse<ChatQuickReply>>(`/admin/chats/quick-replies/${qid}`, body)).data,
  deleteQuickReply: async (qid: string): Promise<void> => {
    await http.delete(`/admin/chats/quick-replies/${qid}`);
  },
};
