"use client";
// ตัวเลขห้องแชทที่มีข้อความลูกค้ายังไม่อ่าน — ข้างเมนู "แชทลูกค้า" ใน Sidebar
// GET /admin/chats/unread ทุก 20 วิ (แท็บซ่อน = หยุด) · Sidebar แสดงเมนูนี้เฉพาะคนที่มี chats.view อยู่แล้ว
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { chatsService } from "@/services/chats";

export const CHAT_UNREAD_KEY = ["admin", "chats", "unread"] as const;

export function ChatUnreadBadge() {
  const t = useTranslations("chat");
  const q = useQuery({
    queryKey: CHAT_UNREAD_KEY,
    queryFn: chatsService.unread,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
  const n = q.data?.conversations ?? 0;
  if (n <= 0) return null;
  return (
    <span
      className="ml-auto min-w-[1.25rem] rounded-full bg-red-500 px-1.5 text-center text-xs font-bold leading-5 text-white"
      aria-label={t("unreadRooms", { n })}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
