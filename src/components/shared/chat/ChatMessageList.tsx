"use client";
// ─────────────────────────────────────────────────────────────
// รายการข้อความแชท (ฟองข้อความ) — ใช้ทั้งหน้าร้าน (ลูกค้า) และหลังร้าน (พนักงาน)
// viewer = ฝั่งที่กำลังดู: ข้อความของฝั่งตัวเองอยู่ขวา (สีน้ำตาล) · อีกฝั่งอยู่ซ้าย (สีขาว)
// คั่นด้วยวันที่ · ข้อความล่าสุดของฝั่งตัวเองที่อีกฝั่งอ่านแล้วขึ้น "อ่านแล้ว"
// เลื่อนลงล่างสุดเองเมื่อมีข้อความใหม่ — ยกเว้นผู้ใช้เลื่อนขึ้นไปอ่านของเก่าอยู่ (ไม่กระชากจอ)
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Package, ReceiptText } from "lucide-react";
import type { ChatAttachment, ChatMessage, ChatSenderType } from "@/types/chat";

const baht = (n: number) => `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatMessageList({
  messages,
  viewer,
  attachmentHref,
  onOpenAttachment,
  hasMore,
  loadingOlder,
  onLoadOlder,
  empty,
  className = "",
}: {
  messages: ChatMessage[];
  viewer: ChatSenderType;
  /** ลิงก์ไปหน้ารายละเอียดของคำสั่งซื้อที่แนบ (ต่างกันระหว่างหน้าร้าน/หลังร้าน) */
  attachmentHref: (a: ChatAttachment) => string;
  /** ส่งมา = กดการ์ดแล้วเปิดป๊อปอัปแทนการไปหน้าอื่น (หลังร้าน) · ไม่ส่ง = ลิงก์ไป attachmentHref */
  onOpenAttachment?: (a: ChatAttachment) => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** แสดงเมื่อยังไม่มีข้อความ */
  empty?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const boxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const prevFirstRef = useRef<string | null>(null);
  const prevHeightRef = useRef(0);

  // ผู้ใช้อยู่ใกล้ล่างสุด = ติดล่าง (ข้อความใหม่เลื่อนตาม)
  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const first = messages[0]?._id ?? null;
    // โหลดของเก่าเพิ่มด้านบน → คงตำแหน่งที่อ่านอยู่
    if (prevFirstRef.current && first !== prevFirstRef.current && !stickRef.current) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevFirstRef.current = first;
    prevHeightRef.current = el.scrollHeight;
  }, [messages]);

  const lastReadMine = [...messages].reverse().find((m) => m.sender_type === viewer && m.read_at)?._id;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div ref={boxRef} onScroll={onScroll} className={`flex flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-4 ${className}`} aria-live="polite">
      {hasMore && onLoadOlder && (
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={loadingOlder}
          className="mx-auto mb-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-60"
        >
          {loadingOlder ? t("loadingOlder") : t("loadOlder")}
        </button>
      )}
      {messages.length === 0 && empty}
      {messages.map((m, i) => {
        const mine = m.sender_type === viewer;
        const prev = messages[i - 1];
        const showDay = !prev || !sameDay(prev.created_at, m.created_at);
        const grouped = prev && !showDay && prev.sender_type === m.sender_type;
        return (
          <div key={m._id} className="flex flex-col">
            {showDay && (
              <span className="mx-auto my-2 rounded-full bg-stone-100 px-3 py-0.5 text-xs text-stone-600">{day(m.created_at)}</span>
            )}
            <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""} ${grouped ? "" : "mt-1.5"}`}>
              <div className={`flex max-w-[80%] flex-col gap-1.5 sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                {m.attachment && (
                  <AttachmentCard
                    a={m.attachment}
                    href={attachmentHref(m.attachment)}
                    mine={mine}
                    onOpen={onOpenAttachment ? () => onOpenAttachment(m.attachment!) : undefined}
                  />
                )}
                {m.body && (
                  <p
                    className={`m-0 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      mine ? "rounded-br-md bg-[#4A342E] text-white" : "rounded-bl-md border border-[#8C5A3C]/10 bg-white text-[#4A342E]"
                    }`}
                  >
                    {m.body}
                  </p>
                )}
              </div>
              <span className="shrink-0 pb-0.5 text-[11px] leading-tight text-stone-500">
                {m._id === lastReadMine && <span className="block">{t("read")}</span>}
                {time(m.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** การ์ดคำสั่งซื้อที่แนบ — เลขที่ · สินค้า · ยอด · สถานะ ณ ตอนส่ง · กดไปหน้ารายละเอียด (หรือเปิดป๊อปอัป ถ้ามี onOpen) */
function AttachmentCard({ a, href, mine, onOpen }: { a: ChatAttachment; href: string; mine: boolean; onOpen?: () => void }) {
  const t = useTranslations("chat");
  const ts = useTranslations("shop.orderStatus");
  const Icon = a.kind === "order" ? ReceiptText : Package;
  const more = Math.max(0, a.item_count - 1);
  const className = `block w-64 max-w-full rounded-2xl border bg-white p-3 text-left text-[#4A342E] shadow-sm transition hover:shadow-md ${
    mine ? "border-[#8C5A3C]/40" : "border-[#8C5A3C]/15"
  }`;
  const body = (
    <>
      <span className="flex items-center gap-2 text-xs font-semibold text-[#8C5A3C]">
        <Icon size={14} aria-hidden="true" />
        {a.kind === "order" ? t("attachOrder") : t("attachPreorder")}
      </span>
      <span className="mt-1 block text-sm font-bold">{a.doc_no}</span>
      {a.first_item_name && (
        <span className="block truncate text-xs text-stone-600">
          {more > 0 ? t("itemsMore", { name: a.first_item_name, n: more }) : a.first_item_name}
        </span>
      )}
      <span className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold">{baht(a.total_amount)}</span>
        {a.order_status && (
          <span className="rounded-full bg-[#FAF6F0] px-2 py-0.5 text-[11px] font-semibold text-[#8C5A3C]">{ts(a.order_status)}</span>
        )}
      </span>
      <span className="mt-1.5 block text-right text-xs font-semibold text-[#8C5A3C] underline-offset-2 hover:underline">{t("viewDetail")}</span>
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className={className}>
      {body}
    </button>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
