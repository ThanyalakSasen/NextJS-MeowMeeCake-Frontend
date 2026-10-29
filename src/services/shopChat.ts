// ─────────────────────────────────────────────────────────────
// src/services/shopChat.ts — แชทกับร้านของลูกค้าที่ login (/shop/chat*) · แทนฟอร์ม "ส่งข้อความหาเรา" (/shop/contact)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { ChatAttachRef, ChatMessage, ChatMessageQuery, ChatThread, SendChatInput } from "@/types/chat";

export const shopChatService = {
  /** GET /shop/chat?after=&before=&limit= — ห้องของฉัน (ยังไม่เคยคุย = conversation null) */
  thread: async (q: ChatMessageQuery = {}): Promise<ChatThread> =>
    (await http.get<ItemResponse<ChatThread>>("/shop/chat", { params: q })).data,
  /** POST /shop/chat/messages — ข้อความ และ/หรือ แนบคำสั่งซื้อของฉัน 1 รายการ */
  send: async (body: SendChatInput): Promise<ChatMessage> =>
    (await http.post<ItemResponse<ChatMessage>>("/shop/chat/messages", body)).data,
  /** PATCH /shop/chat/messages/{id} { body, order_id? | preorder_id? } — แก้ข้อความของฉัน (ส่ง attach = เปลี่ยนคำสั่งซื้อที่แนบ) */
  edit: async (messageId: string, body: string, attach?: ChatAttachRef | null): Promise<ChatMessage> =>
    (
      await http.patch<ItemResponse<ChatMessage>>(`/shop/chat/messages/${encodeURIComponent(messageId)}`, {
        body,
        ...(attach ? (attach.kind === "order" ? { order_id: attach.id } : { preorder_id: attach.id }) : {}),
      })
    ).data,
  /** DELETE /shop/chat/messages/{id} — ลบข้อความของฉัน (ร้านเห็น "ข้อความนี้ถูกลบแล้ว") */
  remove: async (messageId: string): Promise<ChatMessage> =>
    (await http.delete<ItemResponse<ChatMessage>>(`/shop/chat/messages/${encodeURIComponent(messageId)}`)).data,
  /** POST /shop/chat/read — ข้อความจากร้านอ่านแล้ว */
  markRead: async (): Promise<void> => {
    await http.post("/shop/chat/read");
  },
  /** GET /shop/chat/unread — ข้อความจากร้านที่ยังไม่อ่าน */
  unread: async (): Promise<number> =>
    Number((await http.get<ItemResponse<{ unread: number }>>("/shop/chat/unread")).data.unread ?? 0),
};
