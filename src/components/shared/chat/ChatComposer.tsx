"use client";
// ─────────────────────────────────────────────────────────────
// ช่องพิมพ์ข้อความแชท — Enter = ส่ง · Shift+Enter = ขึ้นบรรทัดใหม่ · สูงตามข้อความ (สูงสุด ~5 บรรทัด)
// leading = ปุ่มเสริมด้านซ้าย (หน้าร้าน: แนบคำสั่งซื้อ) · above = ส่วนเหนือช่องพิมพ์ (ชิปคำสั่งซื้อที่เลือกไว้)
// canSendEmpty = ส่งได้แม้ไม่มีข้อความ (มีคำสั่งซื้อแนบอยู่)
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SendHorizontal } from "lucide-react";

export const CHAT_MAX_LENGTH = 1000;

export default function ChatComposer({
  onSend,
  sending,
  disabled,
  leading,
  above,
  canSendEmpty = false,
}: {
  /** คืน true = ส่งสำเร็จ (ล้างช่องพิมพ์) */
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
  leading?: React.ReactNode;
  above?: React.ReactNode;
  canSendEmpty?: boolean;
}) {
  const t = useTranslations("chat");
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const ready = !disabled && !sending && (text.trim().length > 0 || canSendEmpty);
  const submit = async () => {
    if (!ready) return;
    if (await onSend(text.trim())) setText("");
    ref.current?.focus();
  };

  return (
    <div className="border-t border-[#8C5A3C]/10 bg-white px-3 py-2.5 sm:px-4">
      {above}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {leading}
        <label className="sr-only" htmlFor="chat-input">{t("placeholder")}</label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={text}
          maxLength={CHAT_MAX_LENGTH}
          disabled={disabled}
          placeholder={t("placeholder")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // ไม่ส่งระหว่างพิมพ์ภาษาที่ต้องประกอบตัวอักษร (IME)
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#8C5A3C]/25 bg-[#FAF6F0]/40 px-3.5 py-2.5 text-sm text-[#4A342E] outline-none transition placeholder:text-stone-500 focus:border-[#8C5A3C] focus:bg-white focus:ring-2 focus:ring-[#8C5A3C]/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!ready}
          aria-label={t("send")}
          title={t("send")}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#4A342E] text-white shadow-md transition hover:bg-[#8C5A3C] active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
        >
          <SendHorizontal size={18} aria-hidden="true" />
        </button>
      </form>
      {text.length > CHAT_MAX_LENGTH * 0.9 && (
        <p className="m-0 mt-1 text-right text-xs text-stone-500">{text.length}/{CHAT_MAX_LENGTH}</p>
      )}
    </div>
  );
}
