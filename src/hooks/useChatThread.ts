"use client";
// ─────────────────────────────────────────────────────────────
// useChatThread — ข้อความในห้องแชท + ดึงข้อความใหม่แบบ polling (ใช้ทั้งหน้าร้านและหลังร้าน)
// - โหลดครั้งแรก = ข้อความล่าสุด · ทุก POLL_MS ขอที่ใหม่/เปลี่ยนหลัง (updated_at, _id) ล่าสุดที่เห็น (?after=&after_id=) แล้วรวม (ตัดซ้ำด้วย _id)
//   cursor เป็นคู่ — เดิมใช้เวลาอย่างเดียว ข้อความเวลาเดียวกันเกิน 30 (กดอ่านแล้วทีเดียว) ได้ 30 ตัวเดิมทุกรอบ = ค้าง (ข้อ 17)
//   รอบไหนได้ has_more = ยังมีต่อ → ขอต่อทันทีไม่รอรอบหน้า
//   ข้อความที่อีกฝั่งแก้ = แทนของเดิม · ที่ถูกลบ = เอาออก · ห้องถูกลบ (conversation null) = ล้างจอ
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
  /** โหลดข้อความก่อนหน้ารอบล่าสุดไม่สำเร็จ — ปุ่มบอกให้ลองใหม่ (เดิมไม่มี catch: กดแล้วเงียบ) */
  const [olderFailed, setOlderFailed] = useState(false);

  // เปลี่ยนห้อง = ล้างของห้องเดิมระหว่าง render (แนวทาง React "adjusting state when a prop changes" — ไม่ setState ใน effect)
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setMessages([]);
    setConversation(null);
    setHasMore(false);
    setStatus("loading");
    setOlderFailed(false);
  }

  // ค่าล่าสุดสำหรับ interval (ไม่ให้ effect เริ่มใหม่ทุกครั้งที่ข้อความเปลี่ยน)
  const latestRef = useRef<{ at: string; id: string } | null>(null);
  const fetcherRef = useRef(fetcher);
  const onNewRef = useRef(onNewFromOther);
  useEffect(() => {
    fetcherRef.current = fetcher;
    onNewRef.current = onNewFromOther;
  });
  /** cursor ของ polling = (updated_at, _id) ล่าสุดที่เคยได้รับ (รวมข้อความที่ถูกลบ — ไม่อยู่ใน messages แล้ว)
   *  เวลาเท่ากันเทียบ _id (ObjectId hex ยาวเท่ากัน เทียบ string ได้) — ลำดับเดียวกับ backend */
  const bumpCursor = (list: ChatMessage[]) => {
    for (const m of list) {
      const at = m.updated_at ?? m.created_at;
      const cur = latestRef.current;
      if (!cur || at > cur.at || (at === cur.at && m._id > cur.id)) latestRef.current = { at, id: m._id };
    }
  };

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    // คำขอรอบก่อนยังไม่จบ = ข้ามรอบนี้ — เดิม interval 4 วิยิงซ้อนกันตอน backend ช้า (คำตอบเก่ามาทีหลังทับของใหม่)
    let busy = false;
    latestRef.current = null;

    // has_more ของรอบ poll = ยังมีข้อความใหม่ค้าง → ขอต่อทันที (จำกัดรอบ กันวนไม่จบถ้า backend ตอบแปลก)
    const MAX_CATCH_UP = 5;
    const load = async (initial: boolean, round = 0): Promise<void> => {
      if (busy && !initial && round === 0) return;
      busy = true;
      let more = false;
      try {
        const cursor = initial ? null : latestRef.current;
        const res = await fetcherRef.current(cursor ? { after: cursor.at, after_id: cursor.id } : {});
        if (cancelled) return;
        setConversation(res.conversation);
        if (initial) setHasMore(res.has_more);
        else more = res.has_more && res.messages.length > 0;
        bumpCursor(res.messages);
        // ห้องถูกร้านลบ → ล้างข้อความเดิมบนจอ
        if (!res.conversation) {
          latestRef.current = null;
          setMessages([]);
          setStatus("ready");
          return;
        }
        setMessages((prev) => {
          // polling คืนข้อความที่ "เปลี่ยน" ด้วย (แก้ไข/อ่านแล้ว) — ข้อความเก่ากว่าช่วงที่โหลดไว้และยังไม่อยู่บนจอ ไม่ต้องแทรก
          // (ไม่งั้นข้อความเก่าโผล่บนสุดของห้องเอง · เลื่อนขึ้น "ดูข้อความก่อนหน้า" ก็ได้ฉบับล่าสุดอยู่แล้ว)
          const oldest = prev[0]?.created_at;
          const incoming =
            initial || !oldest ? res.messages : res.messages.filter((m) => m.created_at >= oldest || prev.some((p) => p._id === m._id));
          const merged = mergeChatMessages(prev, incoming);
          // มีข้อความใหม่ (ไม่ใช่ที่แก้/ลบ) จากอีกฝั่ง (ไม่ใช่รอบแรก) → ให้หน้าเรียก "อ่านแล้ว"
          if (!initial) {
            const fresh = incoming.filter((m) => !m.deleted && !prev.some((p) => p._id === m._id));
            if (fresh.length) queueMicrotask(() => onNewRef.current?.());
          }
          return merged;
        });
        setStatus("ready");
      } catch {
        if (!cancelled && initial) setStatus("error");
      } finally {
        busy = false;
      }
      if (more && !cancelled && round < MAX_CATCH_UP) {
        busy = true;
        await load(false, round + 1);
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
    setOlderFailed(false);
    try {
      const res = await fetcherRef.current({ before: first.created_at });
      setHasMore(res.has_more);
      setMessages((prev) => mergeChatMessages(prev, res.messages));
    } catch {
      setOlderFailed(true);
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder]);

  /** ใส่/แทนข้อความที่เพิ่งส่งหรือแก้ทันทีไม่ต้องรอ poll */
  const append = useCallback((m: ChatMessage) => setMessages((prev) => mergeChatMessages(prev, [m])), []);
  /** เอาข้อความที่เพิ่งลบออกทันที */
  const remove = useCallback((id: string) => setMessages((prev) => prev.filter((m) => m._id !== id)), []);

  return { messages, conversation, hasMore, status, loadingOlder, olderFailed, loadOlder, append, remove };
}
