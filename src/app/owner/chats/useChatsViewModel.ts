"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของหน้าแชทลูกค้า (/owner/chats) — รายการห้อง (ซ้าย) + ห้องที่เลือก (ขวา)
// - รายการห้อง: GET /admin/chats ทุก 8 วิ (ห้องที่มีข้อความใหม่ขึ้นบนสุดเอง) · ค้นหาชื่อ/เบอร์/อีเมล · เฉพาะที่ยังไม่อ่าน
// - ห้องที่เลือก sync กับ ?id= (ลิงก์จากแจ้งเตือน "แชทใหม่จากลูกค้า" เปิดห้องนั้นตรง ๆ) · ข้อความใหม่ทุก 4 วิ (useChatThread)
// - เปิดห้อง / มีข้อความใหม่ระหว่างเปิด = อ่านแล้ว · ตอบได้เมื่อมี chats.create
// - ข้อความของร้าน: แก้ไข (chats.update) / ลบ (chats.delete) · ลบห้องแชทของลูกค้าทั้งห้อง (chats.delete — ปุ่ม "..." ในรายการห้อง)
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { chatsService } from "@/services/chats";
import { usePermission } from "@/context/PermissionsContext";
import { useChatThread } from "@/hooks/useChatThread";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ChatAttachment, ChatConversation, ChatMessage, ChatMessageQuery } from "@/types/chat";
import { CHAT_UNREAD_KEY } from "@/components/shared/layout/ChatUnreadBadge";

export const CHATS_LIST_KEY = ["admin", "chats", "list"] as const;

/** ลิงก์หน้าคำสั่งซื้อในหลังร้าน (ตรงกับ backend lib/adminLinks.ts) */
export const staffAttachmentHref = (a: Pick<ChatAttachment, "kind" | "ref_id">) =>
  a.kind === "order"
    ? `/owner/orders/manageOrders?id=${encodeURIComponent(a.ref_id)}`
    : `/owner/orders/preOrderRound?tab=orders&id=${encodeURIComponent(a.ref_id)}`;

export function useChatsViewModel() {
  const t = useTranslations("chat");
  const perm = usePermission("chats");
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams().get("id");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(h);
  }, [search]);

  const listQ = useQuery({
    queryKey: [...CHATS_LIST_KEY, debounced, unreadOnly],
    queryFn: () => chatsService.list({ search: debounced || undefined, unread: unreadOnly || undefined, limit: 50 }),
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });

  const select = useCallback(
    (id: string | null) => router.replace(id ? `${pathname}?id=${encodeURIComponent(id)}` : pathname, { scroll: false }),
    [router, pathname],
  );

  const refreshCounts = useCallback(() => {
    void qc.invalidateQueries({ queryKey: CHAT_UNREAD_KEY });
    void qc.invalidateQueries({ queryKey: CHATS_LIST_KEY });
  }, [qc]);

  const markRead = useCallback(() => {
    if (!selectedId) return;
    void chatsService.markRead(selectedId).then(refreshCounts).catch(() => undefined);
  }, [selectedId, refreshCounts]);

  const fetcher = useCallback((q: ChatMessageQuery) => chatsService.thread(selectedId!, q), [selectedId]);
  const thread = useChatThread(selectedId, fetcher, { onNewFromOther: markRead });

  // เปิดห้องที่มีข้อความค้างอ่าน → อ่านแล้ว
  const unreadOnOpen = thread.conversation?.staff_unread ?? 0;
  useEffect(() => {
    if (unreadOnOpen > 0) markRead();
  }, [unreadOnOpen, markRead]);

  // ── แก้ไข / ลบข้อความของร้าน ──
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  // เปลี่ยนห้อง = เลิกแก้ (ปรับ state ตอน prop เปลี่ยน)
  const [editRoom, setEditRoom] = useState(selectedId);
  if (editRoom !== selectedId) {
    setEditRoom(selectedId);
    setEditing(null);
  }
  const saveEdit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => chatsService.editMessage(selectedId!, id, body),
    onSuccess: (msg) => {
      thread.append(msg);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: CHATS_LIST_KEY });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("editFailed")),
  });

  const deleteMessage = async (m: ChatMessage) => {
    if (!selectedId) return;
    const ok = await confirmAlert(t("deleteMessageConfirm"), {
      title: t("deleteMessage"),
      note: t("deleteMessageNote"),
      confirmText: t("deleteMessage"),
      cancelText: t("cancelEdit"),
      variant: "delete",
    });
    if (!ok) return;
    try {
      await chatsService.removeMessage(selectedId, m._id);
      thread.remove(m._id);
      if (editing?._id === m._id) setEditing(null);
      refreshCounts();
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("deleteFailed"));
    }
  };

  const deleteConversation = async (c: ChatConversation) => {
    const ok = await confirmAlert(t("deleteRoomConfirm", { name: c.customer?.user_fullname || t("customer") }), {
      title: t("deleteRoom"),
      note: t("deleteRoomNote"),
      confirmText: t("deleteRoom"),
      cancelText: t("cancelEdit"),
      variant: "delete",
    });
    if (!ok) return;
    try {
      await chatsService.removeConversation(c._id);
      alert.success(t("roomDeleted"));
      if (selectedId === c._id) select(null);
      refreshCounts();
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("deleteFailed"));
    }
  };

  const send = useMutation({
    mutationFn: (body: string) => chatsService.send(selectedId!, body),
    onSuccess: (msg) => {
      thread.append(msg);
      refreshCounts();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("sendFailed")),
  });

  return {
    perm,
    conversations: listQ.data?.data ?? [],
    listLoading: listQ.isPending,
    listError: listQ.isError,
    retryList: () => void listQ.refetch(),
    search,
    setSearch,
    unreadOnly,
    setUnreadOnly,
    selectedId,
    select,
    thread,
    editing,
    startEdit: (m: ChatMessage) => setEditing(m),
    cancelEdit: () => setEditing(null),
    deleteMessage: (m: ChatMessage) => void deleteMessage(m),
    deleteConversation: (c: ChatConversation) => void deleteConversation(c),
    sending: send.isPending || saveEdit.isPending,
    sendMessage: async (body: string) => {
      try {
        if (editing) await saveEdit.mutateAsync({ id: editing._id, body });
        else await send.mutateAsync(body);
        return true;
      } catch {
        return false;
      }
    },
  };
}
