"use client";
// ─────────────────────────────────────────────────────────────
// useMenuBadges — ตัวเลขบนเมนู Sidebar หลังร้าน
//   chat = ห้องแชทที่ร้านยังไม่เปิดอ่าน (GET /admin/chats/unread ทุก 30 วิ · เฉพาะผู้มีสิทธิ์ chat.view)
// หน้าแชท invalidate ADMIN_CHAT_UNREAD_KEY หลังอ่าน/ตอบ → ตัวเลขลดทันที
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { adminChatService, ADMIN_CHAT_UNREAD_KEY } from "@/services/chat";
import { usePermission } from "@/context/PermissionsContext";
import type { MenuBadge } from "@/constants/menu";

export function useMenuBadges(): Record<MenuBadge, number> {
  const chatPerm = usePermission("chat");
  const chatQ = useQuery({
    queryKey: ADMIN_CHAT_UNREAD_KEY,
    queryFn: adminChatService.unread,
    enabled: chatPerm.view,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  return { chat: chatPerm.view ? (chatQ.data?.unread_conversations ?? 0) : 0 };
}
