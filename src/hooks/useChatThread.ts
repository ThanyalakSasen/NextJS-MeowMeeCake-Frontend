"use client";
// ─────────────────────────────────────────────────────────────
// useChatThread — ข้อความในห้องแชท + ดึงข้อความใหม่แบบ polling (ใช้ทั้งหน้าร้านและหลังร้าน)
// - โหลดครั้งแรก = ข้อความล่าสุด · ทุก POLL_MS ขอเฉพาะที่ใหม่กว่าข้อความล่าสุด (?after=) แล้วรวม (ตัดซ้ำด้วย _id)
// - แท็บถูกซ่อน = หยุด poll (กลับมาเห็นแท็บ = ดึงทันที) — ไม่ยิง backend ฟรี ๆ
// - loadOlder = ข้อความเก่ากว่าอันแรก (?before=) · append = ใส่ข้อความที่เพิ่งส่งทันทีไม่ต้องรอ poll
// key เปลี่ยน (เปลี่ยนห้อง) = เริ่มใหม่ · fetcher ต้องคงที่ต่อ key
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { mergeChatMessages, type ChatConversation, type ChatMessage, type ChatMessageQuery, type ChatThread } from "@/types/chat";

export const CHAT_POLL_MS = 4000;

export function useChatThread(
  key: string | null,
  fetcher: (q: ChatMessageQuery) => Promise<ChatThread>,
  { onNewFromOther }: { onNewFromOther?: () => void } = {},
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingOlder, setLoadingOlder] = useState(false);

  // เปลี่ยนห้อง = ล้างของห้องเดิมระหว่าง render (แนวทาง React "adjusting state when a prop changes" — ไม่ setState ใน effect)
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setMessages([]);
    setConversation(null);
    setHasMore(false);
    setStatus("loading");
  }

  // ค่าล่าสุดสำหรับ interval (ไม่ให้ effect เริ่มใหม่ทุกครั้งที่ข้อความเปลี่ยน)
  const latestRef = useRef<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const onNewRef = useRef(onNewFromOther);
  useEffect(() => {
    fetcherRef.current = fetcher;
    onNewRef.current = onNewFromOther;
  });
  useEffect(() => {
    latestRef.current = messages.length ? messages[messages.length - 1].created_at : null;
  }, [messages]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    latestRef.current = null;

    const load = async (initial: boolean) => {
      try {
        const after = initial ? undefined : latestRef.current ?? undefined;
        const res = await fetcherRef.current(after ? { after } : {});
        if (cancelled) return;
        setConversation(res.conversation);
        if (initial) setHasMore(res.has_more);
        setMessages((prev) => {
          const merged = mergeChatMessages(prev, res.messages);
          // มีข้อความใหม่จากอีกฝั่ง (ไม่ใช่รอบแรก) → ให้หน้าเรียก "อ่านแล้ว"
          if (!initial && merged.length > prev.length) {
            const fresh = res.messages.filter((m) => !prev.some((p) => p._id === m._id));
            if (fresh.length) queueMicrotask(() => onNewRef.current?.());
          }
          return merged;
        });
        setStatus("ready");
      } catch {
        if (!cancelled && initial) setStatus("error");
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(() => void load(false), CHAT_POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void load(false);
        start();
      }
    };

    void load(true);
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key]);

  const loadOlder = useCallback(async () => {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await fetcherRef.current({ before: first.created_at });
      setHasMore(res.has_more);
      setMessages((prev) => mergeChatMessages(prev, res.messages));
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder]);

  const append = useCallback((m: ChatMessage) => setMessages((prev) => mergeChatMessages(prev, [m])), []);

  return { messages, conversation, hasMore, status, loadingOlder, loadOlder, append };
}
