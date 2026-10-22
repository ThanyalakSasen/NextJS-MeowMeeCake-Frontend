"use client";
// ─────────────────────────────────────────────────────────────
// useChatThread — ข้อความของห้องแชท 1 ห้อง (ใช้ทั้งปุ่มแชทลอยของลูกค้าและหน้าแชทหลังร้าน)
// แหล่งข้อมูลเดียว = cache ของ query "thread" (ข้อความทั้งหมดที่โหลดแล้ว เรียงเก่า→ใหม่)
//   โหลดครั้งแรก: 50 ข้อความล่าสุด (ไม่ refetch เอง — กันข้อความเก่าที่เลื่อนโหลดไว้หาย)
//   ดึงข้อความใหม่: query "poll" ทุก pollMs (?after=ข้อความล่าสุด) แล้วต่อท้ายใน cache เดียวกัน · หยุดเมื่อแท็บไม่ได้เปิดอยู่
//   ข้อความเก่า: loadOlder() (?before=ข้อความแรก) ต่อหัว · ส่งข้อความ: append() ต่อท้าย
// ไม่ใช้ WebSocket — backend อยู่บนโฮสต์ที่หลับได้ (Render ฟรี)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { ChatMessage, ChatPage } from "@/services/chat";

export interface ThreadData {
  messages: ChatMessage[];
  hasMore: boolean;
}

/** รวมข้อความ — ไม่ซ้ำ (_id) · เรียงตามเวลา */
export function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of [...a, ...b]) byId.set(m._id, m);
  return [...byId.values()].sort((x, y) => x.created_at.localeCompare(y.created_at));
}

export function useChatThread({
  queryKey,
  load,
  enabled,
  pollMs = 4000,
}: {
  /** key ของห้อง (เปลี่ยนห้อง = key ใหม่) */
  queryKey: QueryKey;
  load: (p: { after?: string | null; before?: string | null }) => Promise<ChatPage>;
  enabled: boolean;
  pollMs?: number;
}) {
  const qc = useQueryClient();
  const threadKey = [...queryKey, "thread"];
  const [loadingOlder, setLoadingOlder] = useState(false);

  const threadQ = useQuery({
    queryKey: threadKey,
    queryFn: async (): Promise<ThreadData> => {
      const page = await load({});
      return { messages: page.messages, hasMore: page.has_more };
    },
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ดึงข้อความใหม่เป็นช่วง ๆ แล้วต่อท้าย cache ของ thread (ผลของ query นี้เองไม่ได้ใช้)
  useQuery({
    queryKey: [...queryKey, "poll"],
    queryFn: async () => {
      const current = qc.getQueryData<ThreadData>(threadKey);
      const last = current?.messages.at(-1)?.created_at ?? null;
      const page = await load(last ? { after: last } : {});
      if (page.messages.length > 0) {
        qc.setQueryData<ThreadData>(threadKey, (old) =>
          old ? { ...old, messages: mergeMessages(old.messages, page.messages) } : { messages: page.messages, hasMore: page.has_more },
        );
      }
      return page.messages.length;
    },
    enabled: enabled && threadQ.isSuccess,
    refetchInterval: pollMs,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  const append = (m: ChatMessage) =>
    qc.setQueryData<ThreadData>(threadKey, (old) => ({ messages: mergeMessages(old?.messages ?? [], [m]), hasMore: old?.hasMore ?? false }));

  const loadOlder = async () => {
    const current = qc.getQueryData<ThreadData>(threadKey);
    const first = current?.messages[0]?.created_at;
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await load({ before: first });
      qc.setQueryData<ThreadData>(threadKey, (old) => ({
        messages: mergeMessages(page.messages, old?.messages ?? []),
        hasMore: page.has_more,
      }));
    } finally {
      setLoadingOlder(false);
    }
  };

  return {
    messages: threadQ.data?.messages ?? [],
    hasMore: threadQ.data?.hasMore ?? false,
    isLoading: threadQ.isLoading,
    isError: threadQ.isError,
    retry: () => void threadQ.refetch(),
    append,
    loadOlder,
    loadingOlder,
  };
}
