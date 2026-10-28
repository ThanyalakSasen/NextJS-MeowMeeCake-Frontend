// ─────────────────────────────────────────────────────────────
// src/services/chats.ts — แชทลูกค้า ฝั่งหลังร้าน (/admin/chats*) · สิทธิ์เมนู chats
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { ChatConversation, ChatMessage, ChatMessageQuery, ChatThread } from "@/types/chat";

export interface ChatListParams {
  search?: string;
  unread?: boolean;
  page?: number;
  limit?: number;
}

export const chatsService = {
  /** GET /admin/chats — ห้องที่มีข้อความ ล่าสุดก่อน */
  list: (params: ChatListParams = {}) => http.getList<ChatConversation>("/admin/chats", { params }),
  /** GET /admin/chats/{id}?after=&before= — ห้อง (ข้อมูลลูกค้า) + ข้อความ */
  thread: async (id: string, q: ChatMessageQuery = {}): Promise<ChatThread> =>
    (await http.get<ItemResponse<ChatThread>>(`/admin/chats/${encodeURIComponent(id)}`, { params: q })).data,
  /** POST /admin/chats/{id}/messages { body } — ตอบลูกค้า */
  send: async (id: string, body: string): Promise<ChatMessage> =>
    (await http.post<ItemResponse<ChatMessage>>(`/admin/chats/${encodeURIComponent(id)}/messages`, { body })).data,
  /** POST /admin/chats/{id}/read — ข้อความลูกค้าในห้องนี้อ่านแล้ว */
  markRead: async (id: string): Promise<void> => {
    await http.post(`/admin/chats/${encodeURIComponent(id)}/read`);
  },
  /** GET /admin/chats/unread — { conversations, messages } ที่ยังไม่อ่าน */
  unread: async (): Promise<{ conversations: number; messages: number }> =>
    (await http.get<ItemResponse<{ conversations: number; messages: number }>>("/admin/chats/unread")).data,
};
