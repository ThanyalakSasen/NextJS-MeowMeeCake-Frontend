"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม "ส่งสรุปคำสั่งซื้อเข้าแชท LINE" — แสดงเฉพาะตอนเปิดหน้าร้านจากห้องแชทของ OA (LIFF · src/lib/liff.ts)
// liff.sendMessages ส่งในนามลูกค้า → ร้านเห็นออเดอร์ในแชท OA โดยไม่กินโควตา push
// ลูกค้ากดเอง (ไม่ส่งอัตโนมัติ) · ส่งได้ครั้งเดียวต่อการเปิดหน้า
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { canSendToChat, sendToChat } from "@/lib/liff";

export default function SendToLineChat({ text }: { text: string }) {
  const t = useTranslations("shop.success");
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  useEffect(() => {
    let alive = true;
    void canSendToChat().then((ok) => alive && setAvailable(ok));
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  const send = async () => {
    setState("sending");
    try {
      await sendToChat(text);
      setState("sent");
    } catch (e) {
      console.warn("[liff] sendMessages failed", e);
      setState("failed");
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={send}
        disabled={state === "sending" || state === "sent"}
        className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-5 text-sm font-bold text-white transition hover:bg-[#05b14c] disabled:opacity-60"
      >
        <MessageCircle size={18} aria-hidden="true" />
        {state === "sent" ? t("lineSent") : t("sendToLine")}
      </button>
      {state === "failed" && <p className="m-0 text-xs text-red-600">{t("lineSendFailed")}</p>}
    </div>
  );
}
