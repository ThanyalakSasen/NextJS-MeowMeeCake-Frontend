"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของหน้าแชทลูกค้า (/owner/chats) — รายการห้อง (ซ้าย) + ห้องที่เลือก (ขวา)
// - รายการห้อง: GET /admin/chats ทุก 8 วิ (ห้องที่มีข้อความใหม่ขึ้นบนสุดเอง) · ค้นหาชื่อ/เบอร์/อีเมล · เฉพาะที่ยังไม่อ่าน
// - ห้องที่เลือก sync กับ ?id= (ลิงก์จากแจ้งเตือน "แชทใหม่จากลูกค้า" เปิดห้องนั้นตรง ๆ) · ข้อความใหม่ทุก 4 วิ (useChatThread)
// - เปิดห้อง / มีข้อความใหม่ระหว่างเปิด = อ่านแล้ว · ตอบได้เมื่อมี chats.create
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

  const send = useMutation({
    mutationFn: (body: string) => chatsService.send(selectedId!, body),
    onSuccess: (msg) => {
      thread.append(msg);
      refreshCounts();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("sendFailed")),
  });

  // แก้ไข/ลบข้อความของร้าน — สิทธิ์ chats.update / chats.delete · สำเร็จแล้วแทนที่ข้อความเดิมในรายการ
  const editMessage = async (m: ChatMessage, body: string) => {
    try {
      thread.append(await chatsService.editMessage(selectedId!, m._id, body));
      return true;
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("editFailed"));
      return false;
    }
  };
  const deleteMessage = async (m: ChatMessage) => {
    try {
      thread.append(await chatsService.deleteMessage(selectedId!, m._id));
      void qc.invalidateQueries({ queryKey: CHATS_LIST_KEY });
      return true;
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("deleteFailed"));
      return false;
    }
  };

  // ลบแชทออกจากรายการ (ปุ่ม … ในรายการห้อง) — ประวัติไม่หาย ลูกค้าทักใหม่ = กลับมาพร้อมประวัติเดิม · สิทธิ์ chats.delete · ลบห้องที่เปิดอยู่ = กลับไปรายการ
  const deleteConversation = async (c: ChatConversation) => {
    const name = c.customer?.user_fullname || t("customer");
    if (!(await confirmAlert(t("deleteRoomConfirm", { name }), { note: t("deleteRoomNote"), variant: "delete", danger: true }))) return;
    try {
      await chatsService.remove(c._id);
      if (selectedId === c._id) select(null);
      refreshCounts();
      alert.success(t("deleteRoomDone"));
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("deleteRoomFailed"));
    }
  };

  return {
    perm,
    deleteConversation: perm.delete ? deleteConversation : undefined,
    editMessage: perm.update ? editMessage : undefined,
    deleteMessage: perm.delete ? deleteMessage : undefined,
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
    sending: send.isPending,
    sendMessage: async (body: string) => {
      try {
        await send.mutateAsync(body);
        return true;
      } catch {
        return false;
      }
    },
  };
}
